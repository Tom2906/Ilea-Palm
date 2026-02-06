using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Models;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using Npgsql;

namespace EmployeeHub.Api.Services;

public class AuthService : IAuthService
{
    private readonly IDbService _db;
    private readonly IConfiguration _config;
    private readonly IAuditService _audit;
    private readonly ConfigurationManager<OpenIdConnectConfiguration>? _oidcConfigManager;
    private readonly string? _azureClientId;
    private readonly string? _azureTenantId;

    private const string UserQuery = @"
        SELECT u.id, u.email, u.password_hash, u.display_name, u.role_id, u.employee_id, u.active,
               r.name AS role_name, r.data_scope
        FROM users u
        JOIN roles r ON r.id = u.role_id";

    public AuthService(IDbService db, IConfiguration config, IAuditService audit)
    {
        _db = db;
        _config = config;
        _audit = audit;

        _azureClientId = config["AzureAd:ClientId"];
        _azureTenantId = config["AzureAd:TenantId"];

        if (!string.IsNullOrEmpty(_azureClientId) && !string.IsNullOrEmpty(_azureTenantId))
        {
            var metadataUrl = $"https://login.microsoftonline.com/{_azureTenantId}/v2.0/.well-known/openid-configuration";
            _oidcConfigManager = new ConfigurationManager<OpenIdConnectConfiguration>(
                metadataUrl,
                new OpenIdConnectConfigurationRetriever(),
                new HttpDocumentRetriever());
        }
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(
            UserQuery + " WHERE u.email = @email", conn);
        cmd.Parameters.AddWithValue("email", request.Email.ToLowerInvariant());

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
            return null;

        var user = ReadUser(reader);
        await reader.CloseAsync();

        if (!user.Active)
            return null;

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return null;

        // Load permissions
        user.Permissions = await LoadPermissionsAsync(conn, user.RoleId);

        // Update last_login
        await using var updateCmd = new NpgsqlCommand(
            "UPDATE users SET last_login = NOW() WHERE id = @id", conn);
        updateCmd.Parameters.AddWithValue("id", user.Id);
        await updateCmd.ExecuteNonQueryAsync();

        var token = GenerateJwtToken(user);

        return new LoginResponse
        {
            Token = token,
            User = BuildUserInfo(user)
        };
    }

    public async Task<(LoginResponse? Response, string? Error)> LoginWithMicrosoftAsync(string idToken)
    {
        if (_oidcConfigManager == null || string.IsNullOrEmpty(_azureClientId) || string.IsNullOrEmpty(_azureTenantId))
            return (null, "Microsoft sign-in is not configured");

        // Validate the Microsoft ID token
        var oidcConfig = await _oidcConfigManager.GetConfigurationAsync(CancellationToken.None);

        var validationParams = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = $"https://login.microsoftonline.com/{_azureTenantId}/v2.0",
            ValidateAudience = true,
            ValidAudience = _azureClientId,
            ValidateLifetime = true,
            IssuerSigningKeys = oidcConfig.SigningKeys,
        };

        ClaimsPrincipal principal;
        try
        {
            var handler = new JwtSecurityTokenHandler();
            principal = handler.ValidateToken(idToken, validationParams, out _);
        }
        catch (SecurityTokenException)
        {
            return (null, "Microsoft sign-in failed");
        }

        // Extract email from claims (preferred_username → email → ClaimTypes.Email)
        var email = principal.FindFirst("preferred_username")?.Value
            ?? principal.FindFirst("email")?.Value
            ?? principal.FindFirst(ClaimTypes.Email)?.Value;

        if (string.IsNullOrEmpty(email))
            return (null, "Microsoft sign-in failed");

        // Look up user by email
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(
            UserQuery + " WHERE u.email = @email", conn);
        cmd.Parameters.AddWithValue("email", email.ToLowerInvariant());

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
            return (null, "Your account is not provisioned. Contact your administrator.");

        var user = ReadUser(reader);
        await reader.CloseAsync();

        if (!user.Active)
            return (null, "Your account is not provisioned. Contact your administrator.");

        // Load permissions
        user.Permissions = await LoadPermissionsAsync(conn, user.RoleId);

        // Update last_login
        await using var updateCmd = new NpgsqlCommand(
            "UPDATE users SET last_login = NOW() WHERE id = @id", conn);
        updateCmd.Parameters.AddWithValue("id", user.Id);
        await updateCmd.ExecuteNonQueryAsync();

        await _audit.LogAsync("users", user.Id, "microsoft_login", user.Id);

        var token = GenerateJwtToken(user);

        return (new LoginResponse
        {
            Token = token,
            User = BuildUserInfo(user)
        }, null);
    }

    public async Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(
            "SELECT password_hash FROM users WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("id", userId);

        var currentHash = await cmd.ExecuteScalarAsync() as string;
        if (currentHash == null)
            return false;

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, currentHash))
            return false;

        var newHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

        await using var updateCmd = new NpgsqlCommand(
            "UPDATE users SET password_hash = @hash, updated_at = NOW() WHERE id = @id", conn);
        updateCmd.Parameters.AddWithValue("hash", newHash);
        updateCmd.Parameters.AddWithValue("id", userId);
        await updateCmd.ExecuteNonQueryAsync();

        await _audit.LogAsync("users", userId, "change_password", userId);

        return true;
    }

    public async Task<User?> GetUserByIdAsync(Guid userId)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(
            UserQuery + " WHERE u.id = @id", conn);
        cmd.Parameters.AddWithValue("id", userId);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
            return null;

        var user = ReadUser(reader);
        await reader.CloseAsync();

        user.Permissions = await LoadPermissionsAsync(conn, user.RoleId);
        return user;
    }

    public string GenerateJwtToken(User user)
    {
        var secret = _config["Jwt:Secret"]
            ?? throw new InvalidOperationException("Jwt:Secret not configured");
        var expiryHours = int.Parse(_config["Jwt:ExpiryHours"] ?? "8");
        var issuer = _config["Jwt:Issuer"] ?? "EmployeeHub";

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.DisplayName),
            new Claim("RoleId", user.RoleId.ToString()),
            new Claim("RoleName", user.RoleName),
            new Claim("DataScope", user.DataScope)
        };

        if (user.EmployeeId.HasValue)
            claims.Add(new Claim("EmployeeId", user.EmployeeId.Value.ToString()));

        foreach (var permission in user.Permissions)
            claims.Add(new Claim("Permission", permission));

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: issuer,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expiryHours),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static User ReadUser(NpgsqlDataReader reader)
    {
        return new User
        {
            Id = reader.GetGuid(0),
            Email = reader.GetString(1),
            PasswordHash = reader.GetString(2),
            DisplayName = reader.GetString(3),
            RoleId = reader.GetGuid(4),
            EmployeeId = reader.IsDBNull(5) ? null : reader.GetGuid(5),
            Active = reader.GetBoolean(6),
            RoleName = reader.GetString(7),
            DataScope = reader.GetString(8)
        };
    }

    private static async Task<List<string>> LoadPermissionsAsync(NpgsqlConnection conn, Guid roleId)
    {
        await using var cmd = new NpgsqlCommand(
            "SELECT permission FROM role_permissions WHERE role_id = @roleId ORDER BY permission", conn);
        cmd.Parameters.AddWithValue("roleId", roleId);

        var permissions = new List<string>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            permissions.Add(reader.GetString(0));

        return permissions;
    }

    private static UserInfo BuildUserInfo(User user)
    {
        return new UserInfo
        {
            Id = user.Id,
            Email = user.Email,
            DisplayName = user.DisplayName,
            RoleName = user.RoleName,
            DataScope = user.DataScope,
            Permissions = user.Permissions,
            EmployeeId = user.EmployeeId
        };
    }
}
