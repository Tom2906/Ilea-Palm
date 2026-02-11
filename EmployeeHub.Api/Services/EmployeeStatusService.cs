using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Helpers;
using EmployeeHub.Api.Models;
using Npgsql;

namespace EmployeeHub.Api.Services;

public class EmployeeStatusService : IEmployeeStatusService
{
    private readonly IDbService _db;
    private readonly IAuditService _audit;

    public EmployeeStatusService(IDbService db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<List<EmployeeStatus>> GetAllAsync(bool includeInactive = false)
    {
        await using var conn = await _db.GetConnectionAsync();
        var sql = includeInactive
            ? "SELECT id, name, display_order, active, created_at, updated_at FROM employee_statuses ORDER BY display_order"
            : "SELECT id, name, display_order, active, created_at, updated_at FROM employee_statuses WHERE active = true ORDER BY display_order";

        await using var cmd = new NpgsqlCommand(sql, conn);
        await using var reader = await cmd.ExecuteReaderAsync();

        var statuses = new List<EmployeeStatus>();
        while (await reader.ReadAsync())
        {
            statuses.Add(ReadStatus(reader));
        }
        return statuses;
    }

    public async Task<EmployeeStatus?> GetByIdAsync(Guid id)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(
            "SELECT id, name, display_order, active, created_at, updated_at FROM employee_statuses WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("id", id);

        await using var reader = await cmd.ExecuteReaderAsync();
        return await reader.ReadAsync() ? ReadStatus(reader) : null;
    }

    public async Task<EmployeeStatus> CreateAsync(CreateEmployeeStatusRequest request, Guid userId)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO employee_statuses (name, display_order)
            VALUES (@name, @displayOrder)
            RETURNING id, name, display_order, active, created_at, updated_at", conn);

        cmd.Parameters.AddWithValue("name", request.Name);
        cmd.Parameters.AddWithValue("displayOrder", request.DisplayOrder);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();
        var status = ReadStatus(reader);

        await reader.CloseAsync();
        await _audit.LogAsync("employee_statuses", status.Id, "create", userId, newData: request);

        return status;
    }

    public async Task<EmployeeStatus?> UpdateAsync(Guid id, UpdateEmployeeStatusRequest request, Guid userId)
    {
        var existing = await GetByIdAsync(id);
        if (existing == null) return null;

        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            UPDATE employee_statuses SET
                name = COALESCE(@name, name),
                display_order = COALESCE(@displayOrder, display_order),
                active = COALESCE(@active, active),
                updated_at = NOW()
            WHERE id = @id
            RETURNING id, name, display_order, active, created_at, updated_at", conn);

        cmd.Parameters.AddWithValue("id", id);
        cmd.Parameters.AddWithValue("name", (object?)request.Name ?? DBNull.Value);
        cmd.Parameters.AddWithValue("displayOrder", request.DisplayOrder.HasValue ? request.DisplayOrder.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("active", request.Active.HasValue ? request.Active.Value : DBNull.Value);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;
        var updated = ReadStatus(reader);

        await reader.CloseAsync();
        await _audit.LogAsync("employee_statuses", id, "update", userId, oldData: existing, newData: request);

        return updated;
    }

    private static EmployeeStatus ReadStatus(NpgsqlDataReader reader)
    {
        return new EmployeeStatus
        {
            Id = reader.GetGuid("id"),
            Name = reader.GetString("name"),
            DisplayOrder = reader.GetInt32("display_order"),
            Active = reader.GetBoolean("active"),
            CreatedAt = reader.GetDateTime("created_at"),
            UpdatedAt = reader.GetDateTime("updated_at")
        };
    }
}
