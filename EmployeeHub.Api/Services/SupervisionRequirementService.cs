using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Helpers;
using EmployeeHub.Api.Models;
using Npgsql;

namespace EmployeeHub.Api.Services;

public class SupervisionRequirementService : ISupervisionRequirementService
{
    private readonly IDbService _db;
    private readonly IAuditService _audit;

    public SupervisionRequirementService(IDbService db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<List<SupervisionRequirementDto>> GetAllAsync()
    {
        await using var conn = await _db.GetConnectionAsync();

        var sql = @"
            SELECT id, employee_id, effective_from, required_count, created_at
            FROM supervision_requirements
            ORDER BY employee_id, effective_from DESC";

        await using var cmd = new NpgsqlCommand(sql, conn);
        await using var reader = await cmd.ExecuteReaderAsync();
        var requirements = new List<SupervisionRequirementDto>();

        while (await reader.ReadAsync())
        {
            requirements.Add(ReadRequirement(reader));
        }

        return requirements;
    }

    public async Task<List<SupervisionRequirementDto>> GetByEmployeeAsync(Guid employeeId)
    {
        await using var conn = await _db.GetConnectionAsync();

        var sql = @"
            SELECT id, employee_id, effective_from, required_count, created_at
            FROM supervision_requirements
            WHERE employee_id = @employeeId
            ORDER BY effective_from DESC";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("employeeId", employeeId);

        await using var reader = await cmd.ExecuteReaderAsync();
        var requirements = new List<SupervisionRequirementDto>();

        while (await reader.ReadAsync())
        {
            requirements.Add(ReadRequirement(reader));
        }

        return requirements;
    }

    public async Task<SupervisionRequirementDto?> GetByIdAsync(Guid id)
    {
        await using var conn = await _db.GetConnectionAsync();

        var sql = @"
            SELECT id, employee_id, effective_from, required_count, created_at
            FROM supervision_requirements
            WHERE id = @id";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("id", id);

        await using var reader = await cmd.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            return ReadRequirement(reader);
        }

        return null;
    }

    public async Task<int> GetRequirementForMonthAsync(Guid employeeId, DateOnly month)
    {
        await using var conn = await _db.GetConnectionAsync();

        // Find the most recent requirement that is effective on or before the given month
        var sql = @"
            SELECT required_count
            FROM supervision_requirements
            WHERE employee_id = @employeeId
              AND effective_from <= @month
            ORDER BY effective_from DESC
            LIMIT 1";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("employeeId", employeeId);
        cmd.Parameters.AddWithValue("month", month.ToDateTime(TimeOnly.MinValue));

        var result = await cmd.ExecuteScalarAsync();

        // Default to 1 if no requirement found
        return result != null ? Convert.ToInt32(result) : 1;
    }

    public async Task<SupervisionRequirementDto> CreateAsync(CreateSupervisionRequirementRequest request)
    {
        await using var conn = await _db.GetConnectionAsync();

        var sql = @"
            INSERT INTO supervision_requirements (employee_id, effective_from, required_count)
            VALUES (@employeeId, @effectiveFrom, @requiredCount)
            RETURNING id, employee_id, effective_from, required_count, created_at";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("employeeId", request.EmployeeId);
        cmd.Parameters.AddWithValue("effectiveFrom", request.EffectiveFrom.ToDateTime(TimeOnly.MinValue));
        cmd.Parameters.AddWithValue("requiredCount", request.RequiredCount);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();

        var dto = ReadRequirement(reader);

        await _audit.LogAsync("supervision_requirements", dto.Id, "INSERT", null, null, dto);

        return dto;
    }

    public async Task<SupervisionRequirementDto?> UpdateAsync(Guid id, UpdateSupervisionRequirementRequest request)
    {
        var existing = await GetByIdAsync(id);
        if (existing == null) return null;

        await using var conn = await _db.GetConnectionAsync();

        var sql = @"
            UPDATE supervision_requirements
            SET effective_from = @effectiveFrom,
                required_count = @requiredCount,
                updated_at = NOW()
            WHERE id = @id
            RETURNING id, employee_id, effective_from, required_count, created_at";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("id", id);
        cmd.Parameters.AddWithValue("effectiveFrom", request.EffectiveFrom.ToDateTime(TimeOnly.MinValue));
        cmd.Parameters.AddWithValue("requiredCount", request.RequiredCount);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();

        var dto = ReadRequirement(reader);

        await _audit.LogAsync("supervision_requirements", dto.Id, "UPDATE", null, existing, dto);

        return dto;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var existing = await GetByIdAsync(id);
        if (existing == null) return false;

        await using var conn = await _db.GetConnectionAsync();

        var sql = "DELETE FROM supervision_requirements WHERE id = @id";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("id", id);

        var rows = await cmd.ExecuteNonQueryAsync();

        if (rows > 0)
        {
            await _audit.LogAsync("supervision_requirements", id, "DELETE", null, existing, null);
        }

        return rows > 0;
    }

    private static SupervisionRequirementDto ReadRequirement(NpgsqlDataReader reader)
    {
        return new SupervisionRequirementDto(
            reader.GetGuid("id"),
            reader.GetGuid("employee_id"),
            reader.GetDateOnly("effective_from"),
            reader.GetInt32("required_count"),
            reader.GetDateTime("created_at")
        );
    }
}
