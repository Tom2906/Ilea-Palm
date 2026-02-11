using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Helpers;
using Npgsql;

namespace EmployeeHub.Api.Services;

public class UserManagementService : IUserManagementService
{
    private readonly IDbService _db;
    private readonly IAuditService _audit;

    private const string ListQuery = @"
        SELECT u.id, u.email, u.display_name, u.role_id, r.name AS role_name,
               u.employee_id, COALESCE(e.first_name || ' ' || e.last_name, '') AS employee_name,
               u.active, u.last_login, u.created_at, u.auth_method
        FROM users u
        JOIN roles r ON r.id = u.role_id
        LEFT JOIN employees e ON e.id = u.employee_id";

    public UserManagementService(IDbService db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<List<UserListResponse>> GetAllAsync()
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(ListQuery + " ORDER BY u.display_name", conn);

        return await ReadUsersAsync(cmd);
    }

    public async Task<UserListResponse?> GetByIdAsync(Guid id)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(ListQuery + " WHERE u.id = @id", conn);
        cmd.Parameters.AddWithValue("id", id);

        var users = await ReadUsersAsync(cmd);
        return users.FirstOrDefault();
    }

    public async Task<UserListResponse> CreateAsync(CreateUserRequest request, Guid createdBy)
    {
        await using var conn = await _db.GetConnectionAsync();

        var authMethod = request.AuthMethod ?? "microsoft";

        // Validate: password required for password/both auth methods
        if (authMethod is "password" or "both" && string.IsNullOrEmpty(request.Password))
            throw new InvalidOperationException("Password is required for this authentication method");

        // Validate password complexity
        if (authMethod is "password" or "both")
        {
            var (isValid, validationError) = Helpers.PasswordValidator.Validate(request.Password!);
            if (!isValid)
                throw new ArgumentException(validationError);
        }

        // Check email uniqueness
        await using var checkCmd = new NpgsqlCommand(
            "SELECT 1 FROM users WHERE email = @email", conn);
        checkCmd.Parameters.AddWithValue("email", request.Email.ToLowerInvariant());
        if (await checkCmd.ExecuteScalarAsync() != null)
            throw new InvalidOperationException("A user with this email already exists");

        string? passwordHash = authMethod is "password" or "both"
            ? BCrypt.Net.BCrypt.HashPassword(request.Password)
            : null;

        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO users (email, display_name, password_hash, role_id, employee_id, auth_method, active)
            VALUES (@email, @name, @hash, @roleId, @empId, @authMethod, true)
            RETURNING id", conn);
        cmd.Parameters.AddWithValue("email", request.Email.ToLowerInvariant());
        cmd.Parameters.AddWithValue("name", request.DisplayName);
        cmd.Parameters.AddWithValue("hash", (object?)passwordHash ?? DBNull.Value);
        cmd.Parameters.AddWithValue("roleId", request.RoleId);
        cmd.Parameters.AddWithValue("empId", (object?)request.EmployeeId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("authMethod", authMethod);

        var newId = (Guid)(await cmd.ExecuteScalarAsync())!;

        await _audit.LogAsync("users", newId, "create", createdBy);

        return (await GetByIdAsync(newId))!;
    }

    public async Task<UserListResponse?> UpdateAsync(Guid id, UpdateUserRequest request, Guid updatedBy)
    {
        await using var conn = await _db.GetConnectionAsync();

        // Check user exists
        await using var checkCmd = new NpgsqlCommand("SELECT 1 FROM users WHERE id = @id", conn);
        checkCmd.Parameters.AddWithValue("id", id);
        if (await checkCmd.ExecuteScalarAsync() == null)
            return null;

        await using var cmd = new NpgsqlCommand(@"
            UPDATE users SET
                role_id = @roleId,
                employee_id = @empId,
                active = COALESCE(@active, active),
                auth_method = COALESCE(@authMethod, auth_method),
                updated_at = NOW()
            WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("id", id);
        cmd.Parameters.AddWithValue("roleId", request.RoleId);
        cmd.Parameters.AddWithValue("empId", (object?)request.EmployeeId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("active", (object?)request.Active ?? DBNull.Value);
        cmd.Parameters.AddWithValue("authMethod", (object?)request.AuthMethod ?? DBNull.Value);
        await cmd.ExecuteNonQueryAsync();

        await _audit.LogAsync("users", id, "update", updatedBy);

        return await GetByIdAsync(id);
    }

    public async Task<(bool Success, string? Error)> ResetPasswordAsync(Guid id, ResetPasswordRequest request, Guid resetBy)
    {
        var (isValid, validationError) = Helpers.PasswordValidator.Validate(request.NewPassword);
        if (!isValid)
            return (false, validationError);

        await using var conn = await _db.GetConnectionAsync();

        var hash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

        await using var cmd = new NpgsqlCommand(
            "UPDATE users SET password_hash = @hash, updated_at = NOW() WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("hash", hash);
        cmd.Parameters.AddWithValue("id", id);
        var rows = await cmd.ExecuteNonQueryAsync();

        if (rows > 0)
            await _audit.LogAsync("users", id, "reset_password", resetBy);

        return (rows > 0, rows > 0 ? null : "User not found");
    }

    private static async Task<List<UserListResponse>> ReadUsersAsync(NpgsqlCommand cmd)
    {
        var users = new List<UserListResponse>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            users.Add(new UserListResponse
            {
                Id = reader.GetGuid("id"),
                Email = reader.GetString("email"),
                DisplayName = reader.GetString("display_name"),
                RoleId = reader.GetGuid("role_id"),
                RoleName = reader.GetString("role_name"),
                EmployeeId = reader.GetGuidOrNull("employee_id"),
                EmployeeName = reader.GetStringOrNull("employee_name"),
                Active = reader.GetBoolean("active"),
                LastLogin = reader.GetDateTimeOrNull("last_login"),
                CreatedAt = reader.GetDateTime("created_at"),
                AuthMethod = reader.GetString("auth_method")
            });
        }
        return users;
    }
}
