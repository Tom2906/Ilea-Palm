using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Models;
using Microsoft.IdentityModel.Tokens;
using Npgsql;

namespace EmployeeHub.Api.Services;

public class AuthService : IAuthService
{
    private readonly IDbService _db;
    private readonly IConfiguration _config;
    private readonly IAuditService _audit;

    public AuthService(IDbService db, IConfiguration config, IAuditService audit)
    {
        _db = db;
        _config = config;
        _audit = audit;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(
            "SELECT id, email, password_hash, display_name, role, employee_id, active FROM users WHERE email = @email",
            conn);
        cmd.Parameters.AddWithValue("email", request.Email.ToLowerInvariant());

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
            return null;

        var user = new User
        {
            Id = reader.GetGuid(0),
            Email = reader.GetString(1),
            PasswordHash = reader.GetString(2),
            DisplayName = reader.GetString(3),
            Role = reader.GetString(4),
            EmployeeId = reader.IsDBNull(5) ? null : reader.GetGuid(5),
            Active = reader.GetBoolean(6)
        };

        if (!user.Active)
            return null;

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return null;

        // Update last_login
        await reader.CloseAsync();
        await using var updateCmd = new NpgsqlCommand(
            "UPDATE users SET last_login = NOW() WHERE id = @id", conn);
        updateCmd.Parameters.AddWithValue("id", user.Id);
        await updateCmd.ExecuteNonQueryAsync();

        var token = GenerateJwtToken(user);

        return new LoginResponse
        {
            Token = token,
            User = new UserInfo
            {
                Id = user.Id,
                Email = user.Email,
                DisplayName = user.DisplayName,
                Role = user.Role,
                EmployeeId = user.EmployeeId
            }
        };
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
            "SELECT id, email, password_hash, display_name, role, employee_id, active, last_login, created_at, updated_at FROM users WHERE id = @id",
            conn);
        cmd.Parameters.AddWithValue("id", userId);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
            return null;

        return new User
        {
            Id = reader.GetGuid(0),
            Email = reader.GetString(1),
            PasswordHash = reader.GetString(2),
            DisplayName = reader.GetString(3),
            Role = reader.GetString(4),
            EmployeeId = reader.IsDBNull(5) ? null : reader.GetGuid(5),
            Active = reader.GetBoolean(6),
            LastLogin = reader.IsDBNull(7) ? null : reader.GetDateTime(7),
            CreatedAt = reader.GetDateTime(8),
            UpdatedAt = reader.GetDateTime(9)
        };
    }

    public string GenerateJwtToken(User user)
    {
        var secret = _config["Jwt:Secret"]
            ?? throw new InvalidOperationException("Jwt:Secret not configured");
        var expiryHours = int.Parse(_config["Jwt:ExpiryHours"] ?? "8");
        var issuer = _config["Jwt:Issuer"] ?? "EmployeeHub";

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.DisplayName),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: issuer,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expiryHours),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
