using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Helpers;
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
               r.name AS role_name, u.auth_method
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

    public async Task<(LoginResponse? Response, string? Error)> LoginAsync(LoginRequest request)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(
            UserQuery + " WHERE u.email = @email", conn);
        cmd.Parameters.AddWithValue("email", request.Email.ToLowerInvariant());

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
            return (null, "Invalid email or password");

        var user = ReadUser(reader);
        await reader.CloseAsync();

        if (!user.Active)
            return (null, "Invalid email or password");

        if (user.AuthMethod == "microsoft")
            return (null, "This account uses Microsoft sign-in");

        if (string.IsNullOrEmpty(user.PasswordHash))
            return (null, "This account uses Microsoft sign-in");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return (null, "Invalid email or password");

        user.Permissions = await LoadPermissionsAsync(conn, user.RoleId);

        await using var updateCmd = new NpgsqlCommand(
            "UPDATE users SET last_login = NOW() WHERE id = @id", conn);
        updateCmd.Parameters.AddWithValue("id", user.Id);
        await updateCmd.ExecuteNonQueryAsync();

        var token = GenerateJwtToken(user);

        return (new LoginResponse
        {
            Token = token,
            User = BuildUserInfo(user)
        }, null);
    }

    public async Task<(LoginResponse? Response, string? Error)> LoginWithMicrosoftAsync(string idToken)
    {
        if (_oidcConfigManager == null || string.IsNullOrEmpty(_azureClientId) || string.IsNullOrEmpty(_azureTenantId))
            return (null, "Microsoft sign-in is not configured");

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

        var email = principal.FindFirst("preferred_username")?.Value
            ?? principal.FindFirst("email")?.Value
            ?? principal.FindFirst(ClaimTypes.Email)?.Value;

        if (string.IsNullOrEmpty(email))
            return (null, "Microsoft sign-in failed");

        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(
            UserQuery + " WHERE u.email = @email", conn);
        cmd.Parameters.AddWithValue("email", email.ToLowerInvariant());

        await using var reader = await cmd.ExecuteReaderAsync();
        User user;
        if (!await reader.ReadAsync())
        {
            await reader.CloseAsync();

            // JIT provisioning: create user with Employee role
            var displayName = principal.FindFirst("name")?.Value
                ?? principal.FindFirst(ClaimTypes.Name)?.Value
                ?? email.Split('@')[0];

            await using var roleCmd = new NpgsqlCommand(
                "SELECT id FROM roles WHERE name = 'Employee'", conn);
            var roleId = await roleCmd.ExecuteScalarAsync() as Guid?;
            if (roleId == null)
                return (null, "Default role not configured. Contact your administrator.");

            // Match employee by email
            await using var empCmd = new NpgsqlCommand(
                "SELECT id FROM employees WHERE LOWER(email) = @email", conn);
            empCmd.Parameters.AddWithValue("email", email.ToLowerInvariant());
            var employeeId = await empCmd.ExecuteScalarAsync() as Guid?;

            await using var createCmd = new NpgsqlCommand(@"
                INSERT INTO users (email, display_name, password_hash, role_id, auth_method, active, employee_id)
                VALUES (@email, @name, NULL, @roleId, 'microsoft', true, @empId)
                RETURNING id", conn);
            createCmd.Parameters.AddWithValue("email", email.ToLowerInvariant());
            createCmd.Parameters.AddWithValue("name", displayName);
            createCmd.Parameters.AddWithValue("roleId", roleId.Value);
            createCmd.Parameters.AddWithValue("empId", (object?)employeeId ?? DBNull.Value);

            var newId = (Guid)(await createCmd.ExecuteScalarAsync())!;

            user = new User
            {
                Id = newId,
                Email = email.ToLowerInvariant(),
                DisplayName = displayName,
                RoleId = roleId.Value,
                RoleName = "Employee",
                EmployeeId = employeeId,
                AuthMethod = "microsoft",
                Active = true,
                Permissions = new Dictionary<string, string>()
            };

            await _audit.LogAsync("users", newId, "jit_create", newId);
        }
        else
        {
            user = ReadUser(reader);
            await reader.CloseAsync();

            if (!user.Active)
                return (null, "Your account has been deactivated. Contact your administrator.");

            if (user.AuthMethod == "password")
                return (null, "This account uses password sign-in. Contact your administrator to enable Microsoft login.");

            // Try to match employee if not already linked
            if (!user.EmployeeId.HasValue)
            {
                await using var empCmd = new NpgsqlCommand(
                    "SELECT id FROM employees WHERE LOWER(email) = @empEmail", conn);
                empCmd.Parameters.AddWithValue("empEmail", email.ToLowerInvariant());
                var empId = await empCmd.ExecuteScalarAsync() as Guid?;
                if (empId.HasValue)
                {
                    await using var linkCmd = new NpgsqlCommand(
                        "UPDATE users SET employee_id = @empId WHERE id = @userId", conn);
                    linkCmd.Parameters.AddWithValue("empId", empId.Value);
                    linkCmd.Parameters.AddWithValue("userId", user.Id);
                    await linkCmd.ExecuteNonQueryAsync();
                    user.EmployeeId = empId;
                }
            }

            user.Permissions = await LoadPermissionsAsync(conn, user.RoleId);
        }

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

    public async Task<(bool Success, string? Error)> ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        var (isValid, validationError) = Helpers.PasswordValidator.Validate(request.NewPassword);
        if (!isValid)
            return (false, validationError);

        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(
            "SELECT password_hash, auth_method FROM users WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("id", userId);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
            return (false, "User not found");

        var authMethod = reader.GetString("auth_method");
        if (authMethod == "microsoft")
            return (false, "This account uses Microsoft sign-in");

        var currentHash = reader.GetStringOrNull("password_hash");
        await reader.CloseAsync();

        if (currentHash == null)
            return (false, "This account uses Microsoft sign-in");

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, currentHash))
            return (false, "Current password is incorrect");

        var newHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

        await using var updateCmd = new NpgsqlCommand(
            "UPDATE users SET password_hash = @hash, updated_at = NOW() WHERE id = @id", conn);
        updateCmd.Parameters.AddWithValue("hash", newHash);
        updateCmd.Parameters.AddWithValue("id", userId);
        await updateCmd.ExecuteNonQueryAsync();

        await _audit.LogAsync("users", userId, "change_password", userId);

        return (true, null);
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
            new Claim("RoleName", user.RoleName)
        };

        if (user.EmployeeId.HasValue)
            claims.Add(new Claim("EmployeeId", user.EmployeeId.Value.ToString()));

        // Each permission is a claim with prefix "Perm:" and value = scope
        foreach (var (permission, scope) in user.Permissions)
            claims.Add(new Claim($"Perm:{permission}", scope));

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
            Id = reader.GetGuid("id"),
            Email = reader.GetString("email"),
            PasswordHash = reader.GetStringOrNull("password_hash"),
            DisplayName = reader.GetString("display_name"),
            RoleId = reader.GetGuid("role_id"),
            EmployeeId = reader.GetGuidOrNull("employee_id"),
            Active = reader.GetBoolean("active"),
            RoleName = reader.GetString("role_name"),
            AuthMethod = reader.GetString("auth_method")
        };
    }

    private static async Task<Dictionary<string, string>> LoadPermissionsAsync(NpgsqlConnection conn, Guid roleId)
    {
        await using var cmd = new NpgsqlCommand(
            "SELECT permission, scope FROM role_permissions WHERE role_id = @roleId ORDER BY permission", conn);
        cmd.Parameters.AddWithValue("roleId", roleId);

        var permissions = new Dictionary<string, string>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            permissions[reader.GetString("permission")] = reader.GetString("scope");

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
            Permissions = user.Permissions,
            EmployeeId = user.EmployeeId
        };
    }
}
