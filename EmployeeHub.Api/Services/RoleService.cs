using EmployeeHub.Api.DTOs;
using Npgsql;

namespace EmployeeHub.Api.Services;

public class RoleService : IRoleService
{
    private readonly IDbService _db;
    private readonly IAuditService _audit;

    private static readonly string[] AllPermissions =
    {
        // Dashboard
        "dashboard.view",
        // Employees
        "employees.view", "employees.add", "employees.edit", "employees.delete",
        // Training
        "training_courses.view", "training_courses.add", "training_courses.edit", "training_courses.delete",
        "training_matrix.view", "training_records.record",
        // Supervisions
        "supervisions.view", "supervisions.add", "supervisions.edit", "supervisions.delete",
        // Leave
        "leave.view", "leave.approve", "leave.manage_entitlements",
        // Rotas
        "rotas.view", "rotas.add", "rotas.edit", "rotas.delete",
        // Appraisals
        "appraisals.view", "appraisals.add", "appraisals.edit", "appraisals.delete",
        // Onboarding
        "onboarding.view", "onboarding.add", "onboarding.edit", "onboarding.delete",
        // Tools
        "day_in_life.use",
        // Administration (scope is always "all" — effectively boolean)
        "settings.manage", "notifications.manage", "audit_log.view", "users.manage", "employee_statuses.manage"
    };


    public RoleService(IDbService db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<List<RoleResponse>> GetAllAsync()
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            SELECT r.id, r.name, r.description, r.is_system, r.created_at, r.updated_at,
                   COUNT(DISTINCT u.id) AS user_count
            FROM roles r
            LEFT JOIN users u ON u.role_id = r.id
            GROUP BY r.id
            ORDER BY r.is_system DESC, r.name", conn);

        var roles = new List<RoleResponse>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            roles.Add(new RoleResponse
            {
                Id = reader.GetGuid(0),
                Name = reader.GetString(1),
                Description = reader.IsDBNull(2) ? null : reader.GetString(2),
                IsSystem = reader.GetBoolean(3),
                CreatedAt = reader.GetDateTime(4),
                UpdatedAt = reader.GetDateTime(5),
                UserCount = reader.GetInt32(6)
            });
        }
        await reader.CloseAsync();

        foreach (var role in roles)
            role.Permissions = await LoadPermissionsAsync(conn, role.Id);

        return roles;
    }

    public async Task<RoleResponse?> GetByIdAsync(Guid id)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            SELECT r.id, r.name, r.description, r.is_system, r.created_at, r.updated_at,
                   COUNT(DISTINCT u.id) AS user_count
            FROM roles r
            LEFT JOIN users u ON u.role_id = r.id
            WHERE r.id = @id
            GROUP BY r.id", conn);
        cmd.Parameters.AddWithValue("id", id);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
            return null;

        var role = new RoleResponse
        {
            Id = reader.GetGuid(0),
            Name = reader.GetString(1),
            Description = reader.IsDBNull(2) ? null : reader.GetString(2),
            IsSystem = reader.GetBoolean(3),
            CreatedAt = reader.GetDateTime(4),
            UpdatedAt = reader.GetDateTime(5),
            UserCount = reader.GetInt32(6)
        };
        await reader.CloseAsync();

        role.Permissions = await LoadPermissionsAsync(conn, role.Id);
        return role;
    }

    public async Task<RoleResponse> CreateAsync(CreateRoleRequest request, Guid userId)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var tx = await conn.BeginTransactionAsync();

        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO roles (name, description)
            VALUES (@name, @desc)
            RETURNING id, created_at, updated_at", conn, tx);
        cmd.Parameters.AddWithValue("name", request.Name);
        cmd.Parameters.AddWithValue("desc", (object?)request.Description ?? DBNull.Value);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();
        var roleId = reader.GetGuid(0);
        var createdAt = reader.GetDateTime(1);
        var updatedAt = reader.GetDateTime(2);
        await reader.CloseAsync();

        await InsertPermissionsAsync(conn, tx, roleId, request.Permissions);

        await tx.CommitAsync();

        await _audit.LogAsync("roles", roleId, "create", userId);

        return new RoleResponse
        {
            Id = roleId,
            Name = request.Name,
            Description = request.Description,
            IsSystem = false,
            Permissions = request.Permissions,
            UserCount = 0,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt
        };
    }

    public async Task<RoleResponse?> UpdateAsync(Guid id, UpdateRoleRequest request, Guid userId)
    {
        await using var conn = await _db.GetConnectionAsync();

        await using var checkCmd = new NpgsqlCommand("SELECT is_system FROM roles WHERE id = @id", conn);
        checkCmd.Parameters.AddWithValue("id", id);
        var isSystemObj = await checkCmd.ExecuteScalarAsync();
        if (isSystemObj == null) return null;

        await using var tx = await conn.BeginTransactionAsync();

        await using var cmd = new NpgsqlCommand(@"
            UPDATE roles SET name = @name, description = @desc, updated_at = NOW()
            WHERE id = @id", conn, tx);
        cmd.Parameters.AddWithValue("id", id);
        cmd.Parameters.AddWithValue("name", request.Name);
        cmd.Parameters.AddWithValue("desc", (object?)request.Description ?? DBNull.Value);
        await cmd.ExecuteNonQueryAsync();

        // Replace permissions
        await using var delCmd = new NpgsqlCommand("DELETE FROM role_permissions WHERE role_id = @roleId", conn, tx);
        delCmd.Parameters.AddWithValue("roleId", id);
        await delCmd.ExecuteNonQueryAsync();

        await InsertPermissionsAsync(conn, tx, id, request.Permissions);

        await tx.CommitAsync();

        await _audit.LogAsync("roles", id, "update", userId);

        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid userId)
    {
        await using var conn = await _db.GetConnectionAsync();

        await using var checkCmd = new NpgsqlCommand(
            "SELECT is_system FROM roles WHERE id = @id", conn);
        checkCmd.Parameters.AddWithValue("id", id);
        var isSystemObj = await checkCmd.ExecuteScalarAsync();
        if (isSystemObj == null) return false;
        if ((bool)isSystemObj) throw new InvalidOperationException("Cannot delete a system role");

        await using var userCheckCmd = new NpgsqlCommand(
            "SELECT COUNT(*) FROM users WHERE role_id = @id", conn);
        userCheckCmd.Parameters.AddWithValue("id", id);
        var userCount = (long)(await userCheckCmd.ExecuteScalarAsync() ?? 0);
        if (userCount > 0) throw new InvalidOperationException("Cannot delete a role that has users assigned");

        await using var cmd = new NpgsqlCommand("DELETE FROM roles WHERE id = @id AND is_system = false", conn);
        cmd.Parameters.AddWithValue("id", id);
        var rows = await cmd.ExecuteNonQueryAsync();

        if (rows > 0)
            await _audit.LogAsync("roles", id, "delete", userId);

        return rows > 0;
    }

    public Task<List<string>> GetAllPermissionKeysAsync()
    {
        return Task.FromResult(AllPermissions.ToList());
    }

    private static async Task<Dictionary<string, string>> LoadPermissionsAsync(NpgsqlConnection conn, Guid roleId)
    {
        await using var cmd = new NpgsqlCommand(
            "SELECT permission, scope FROM role_permissions WHERE role_id = @roleId ORDER BY permission", conn);
        cmd.Parameters.AddWithValue("roleId", roleId);

        var permissions = new Dictionary<string, string>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            permissions[reader.GetString(0)] = reader.GetString(1);

        return permissions;
    }

    private static async Task InsertPermissionsAsync(NpgsqlConnection conn, NpgsqlTransaction tx, Guid roleId, Dictionary<string, string> permissions)
    {
        foreach (var (perm, _) in permissions)
        {
            if (!AllPermissions.Contains(perm)) continue;

            await using var permCmd = new NpgsqlCommand(
                "INSERT INTO role_permissions (role_id, permission, scope) VALUES (@roleId, @perm, 'all') ON CONFLICT DO NOTHING",
                conn, tx);
            permCmd.Parameters.AddWithValue("roleId", roleId);
            permCmd.Parameters.AddWithValue("perm", perm);
            await permCmd.ExecuteNonQueryAsync();
        }
    }
}
