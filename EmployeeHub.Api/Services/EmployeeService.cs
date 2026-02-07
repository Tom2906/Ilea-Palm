using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Models;
using Npgsql;

namespace EmployeeHub.Api.Services;

public class EmployeeService : IEmployeeService
{
    private readonly IDbService _db;
    private readonly IAuditService _audit;

    private const string SelectColumns = @"
        e.id, e.email, e.first_name, e.last_name, e.department, e.role,
        e.start_date, e.active, e.status_id, es.name as status_name, e.notes,
        e.reports_to, supervisor.first_name || ' ' || supervisor.last_name as supervisor_name,
        e.supervision_frequency, e.created_at, e.updated_at";

    private const string FromClause = @"
        FROM employees e
        LEFT JOIN employee_statuses es ON e.status_id = es.id
        LEFT JOIN employees supervisor ON e.reports_to = supervisor.id";

    public EmployeeService(IDbService db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<List<Employee>> GetAllAsync(bool includeInactive = false)
    {
        await using var conn = await _db.GetConnectionAsync();
        var sql = includeInactive
            ? $"SELECT {SelectColumns} {FromClause} ORDER BY e.last_name, e.first_name"
            : $"SELECT {SelectColumns} {FromClause} WHERE e.active = true ORDER BY e.last_name, e.first_name";

        await using var cmd = new NpgsqlCommand(sql, conn);
        await using var reader = await cmd.ExecuteReaderAsync();

        var employees = new List<Employee>();
        while (await reader.ReadAsync())
        {
            employees.Add(ReadEmployee(reader));
        }
        return employees;
    }

    public async Task<Employee?> GetByIdAsync(Guid id)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(
            $"SELECT {SelectColumns} {FromClause} WHERE e.id = @id", conn);
        cmd.Parameters.AddWithValue("id", id);

        await using var reader = await cmd.ExecuteReaderAsync();
        return await reader.ReadAsync() ? ReadEmployee(reader) : null;
    }

    public async Task<Employee> CreateAsync(CreateEmployeeRequest request, Guid userId)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO employees (email, first_name, last_name, department, role, start_date, status_id, notes, reports_to, supervision_frequency)
            VALUES (@email, @firstName, @lastName, @department, @role, @startDate, @statusId, @notes, @reportsTo, @supervisionFrequency)
            RETURNING id", conn);

        cmd.Parameters.AddWithValue("email", request.Email.ToLowerInvariant());
        cmd.Parameters.AddWithValue("firstName", request.FirstName);
        cmd.Parameters.AddWithValue("lastName", request.LastName);
        cmd.Parameters.AddWithValue("department", (object?)request.Department ?? DBNull.Value);
        cmd.Parameters.AddWithValue("role", request.Role);
        cmd.Parameters.AddWithValue("startDate", request.StartDate);
        cmd.Parameters.Add(new NpgsqlParameter("statusId", NpgsqlTypes.NpgsqlDbType.Uuid) { Value = (object?)request.StatusId ?? DBNull.Value });
        cmd.Parameters.AddWithValue("notes", (object?)request.Notes ?? DBNull.Value);
        cmd.Parameters.Add(new NpgsqlParameter("reportsTo", NpgsqlTypes.NpgsqlDbType.Uuid) { Value = (object?)request.ReportsTo ?? DBNull.Value });
        cmd.Parameters.AddWithValue("supervisionFrequency", request.SupervisionFrequency);

        var id = (Guid)(await cmd.ExecuteScalarAsync())!;
        var employee = (await GetByIdAsync(id))!;

        await _audit.LogAsync("employees", employee.Id, "create", userId, newData: request);

        return employee;
    }

    public async Task<Employee?> UpdateAsync(Guid id, UpdateEmployeeRequest request, Guid userId)
    {
        var existing = await GetByIdAsync(id);
        if (existing == null) return null;

        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            UPDATE employees SET
                email = COALESCE(@email, email),
                first_name = COALESCE(@firstName, first_name),
                last_name = COALESCE(@lastName, last_name),
                department = COALESCE(@department, department),
                role = COALESCE(@role, role),
                start_date = COALESCE(@startDate, start_date),
                active = COALESCE(@active, active),
                status_id = COALESCE(@statusId, status_id),
                notes = COALESCE(@notes, notes),
                reports_to = COALESCE(@reportsTo, reports_to),
                supervision_frequency = COALESCE(@supervisionFrequency, supervision_frequency),
                updated_at = NOW()
            WHERE id = @id", conn);

        cmd.Parameters.AddWithValue("id", id);
        cmd.Parameters.AddWithValue("email", (object?)request.Email?.ToLowerInvariant() ?? DBNull.Value);
        cmd.Parameters.AddWithValue("firstName", (object?)request.FirstName ?? DBNull.Value);
        cmd.Parameters.AddWithValue("lastName", (object?)request.LastName ?? DBNull.Value);
        cmd.Parameters.AddWithValue("department", (object?)request.Department ?? DBNull.Value);
        cmd.Parameters.AddWithValue("role", (object?)request.Role ?? DBNull.Value);
        cmd.Parameters.AddWithValue("startDate", request.StartDate.HasValue ? request.StartDate.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("active", request.Active.HasValue ? request.Active.Value : DBNull.Value);
        cmd.Parameters.Add(new NpgsqlParameter("statusId", NpgsqlTypes.NpgsqlDbType.Uuid) { Value = (object?)request.StatusId ?? DBNull.Value });
        cmd.Parameters.AddWithValue("notes", (object?)request.Notes ?? DBNull.Value);
        cmd.Parameters.Add(new NpgsqlParameter("reportsTo", NpgsqlTypes.NpgsqlDbType.Uuid) { Value = (object?)request.ReportsTo ?? DBNull.Value });
        cmd.Parameters.AddWithValue("supervisionFrequency", request.SupervisionFrequency.HasValue ? request.SupervisionFrequency.Value : DBNull.Value);

        await cmd.ExecuteNonQueryAsync();
        var updated = await GetByIdAsync(id);

        await _audit.LogAsync("employees", id, "update", userId, oldData: existing, newData: request);

        return updated;
    }

    public async Task<bool> SoftDeleteAsync(Guid id, Guid userId)
    {
        var existing = await GetByIdAsync(id);
        if (existing == null) return false;

        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(
            "UPDATE employees SET active = false, updated_at = NOW() WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("id", id);

        var rows = await cmd.ExecuteNonQueryAsync();
        if (rows > 0)
            await _audit.LogAsync("employees", id, "soft_delete", userId, oldData: existing);

        return rows > 0;
    }

    private static Employee ReadEmployee(NpgsqlDataReader reader)
    {
        return new Employee
        {
            Id = reader.GetGuid(0),
            Email = reader.GetString(1),
            FirstName = reader.GetString(2),
            LastName = reader.GetString(3),
            Department = reader.IsDBNull(4) ? null : reader.GetString(4),
            Role = reader.GetString(5),
            StartDate = DateOnly.FromDateTime(reader.GetDateTime(6)),
            Active = reader.GetBoolean(7),
            StatusId = reader.IsDBNull(8) ? null : reader.GetGuid(8),
            StatusName = reader.IsDBNull(9) ? null : reader.GetString(9),
            Notes = reader.IsDBNull(10) ? null : reader.GetString(10),
            ReportsTo = reader.IsDBNull(11) ? null : reader.GetGuid(11),
            SupervisorName = reader.IsDBNull(12) ? null : reader.GetString(12),
            SupervisionFrequency = reader.GetInt32(13),
            CreatedAt = reader.GetDateTime(14),
            UpdatedAt = reader.GetDateTime(15)
        };
    }
}
