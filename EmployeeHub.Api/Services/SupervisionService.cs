using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Helpers;
using EmployeeHub.Api.Models;
using Npgsql;

namespace EmployeeHub.Api.Services;

public class SupervisionService : ISupervisionService
{
    private readonly IDbService _db;
    private readonly IAuditService _audit;

    public SupervisionService(IDbService db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<List<SupervisionResponse>> GetAllAsync(Guid? employeeId = null, Guid? supervisorId = null, string? period = null)
    {
        await using var conn = await _db.GetConnectionAsync();

        var sql = @"
            SELECT
                sr.id, sr.employee_id, sr.conducted_by_id, sr.supervision_date,
                sr.period, sr.notes, sr.created_at, sr.is_completed, sr.required_count,
                e.first_name || ' ' || e.last_name as employee_name,
                s.first_name || ' ' || s.last_name as conducted_by_name
            FROM supervision_records sr
            JOIN employees e ON e.id = sr.employee_id
            JOIN employees s ON s.id = sr.conducted_by_id
            WHERE 1=1";

        if (employeeId.HasValue)
            sql += " AND sr.employee_id = @employeeId";
        if (supervisorId.HasValue)
            sql += " AND sr.conducted_by_id = @supervisorId";
        if (!string.IsNullOrEmpty(period))
            sql += " AND sr.period = @period";

        sql += " ORDER BY sr.supervision_date DESC";

        await using var cmd = new NpgsqlCommand(sql, conn);
        if (employeeId.HasValue) cmd.Parameters.AddWithValue("employeeId", employeeId.Value);
        if (supervisorId.HasValue) cmd.Parameters.AddWithValue("supervisorId", supervisorId.Value);
        if (!string.IsNullOrEmpty(period)) cmd.Parameters.AddWithValue("period", period);

        await using var reader = await cmd.ExecuteReaderAsync();
        var supervisions = new List<SupervisionResponse>();

        while (await reader.ReadAsync())
        {
            supervisions.Add(new SupervisionResponse
            {
                Id = reader.GetGuid("id"),
                EmployeeId = reader.GetGuid("employee_id"),
                ConductedById = reader.GetGuid("conducted_by_id"),
                SupervisionDate = reader.GetDateOnly("supervision_date"),
                Period = reader.GetString("period"),
                Notes = reader.GetStringOrNull("notes"),
                CreatedAt = reader.GetDateTime("created_at"),
                IsCompleted = reader.GetBoolean("is_completed"),
                RequiredCount = reader.GetInt32("required_count"),
                EmployeeName = reader.GetString("employee_name"),
                ConductedByName = reader.GetString("conducted_by_name")
            });
        }

        return supervisions;
    }

    public async Task<List<SupervisionResponse>> GetByEmployeeAsync(Guid employeeId)
    {
        return await GetAllAsync(employeeId: employeeId);
    }

    public async Task<List<SupervisionResponse>> GetBySupervisorAsync(Guid supervisorId)
    {
        return await GetAllAsync(supervisorId: supervisorId);
    }

    public async Task<List<SupervisionStatusResponse>> GetStatusSummaryAsync()
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand("SELECT * FROM supervision_status ORDER BY status DESC, last_name, first_name", conn);
        await using var reader = await cmd.ExecuteReaderAsync();

        var statuses = new List<SupervisionStatusResponse>();
        while (await reader.ReadAsync())
        {
            statuses.Add(new SupervisionStatusResponse
            {
                EmployeeId = reader.GetGuid("employee_id"),
                FirstName = reader.GetString("first_name"),
                LastName = reader.GetString("last_name"),
                Email = reader.GetString("email"),
                Role = reader.GetString("role"),
                Department = reader.GetStringOrNull("department"),
                ReportsTo = reader.GetGuidOrNull("reports_to"),
                SupervisionFrequency = reader.GetInt32("supervision_frequency"),
                SupervisorName = reader.GetStringOrNull("supervisor_name"),
                LastSupervisionDate = reader.GetDateOnlyOrNull("last_supervision_date"),
                DaysSinceLastSupervision = reader.GetInt32OrNull("days_since_last_supervision"),
                Status = reader.GetString("status"),
                StartDate = reader.GetDateOnly("start_date"),
                EmployeeStatus = reader.GetStringOrNull("employee_status")
            });
        }

        return statuses;
    }

    public async Task<SupervisionSummary> GetSummaryStatsAsync()
    {
        var statuses = await GetStatusSummaryAsync();

        return new SupervisionSummary
        {
            TotalEmployees = statuses.Count,
            NeverSupervised = statuses.Count(s => s.Status == "Never"),
            Ok = statuses.Count(s => s.Status == "OK"),
            DueSoon = statuses.Count(s => s.Status == "Due Soon"),
            Overdue = statuses.Count(s => s.Status == "Overdue")
        };
    }

    public async Task<SupervisionResponse> CreateAsync(CreateSupervisionRequest request, Guid recordedBy)
    {
        await using var conn = await _db.GetConnectionAsync();

        var period = $"{request.SupervisionDate.Year:0000}-{request.SupervisionDate.Month:00}";

        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO supervision_records (employee_id, conducted_by_id, supervision_date, period, notes, is_completed, required_count)
            VALUES (@employeeId, @conductedById, @supervisionDate, @period, @notes, @isCompleted, @requiredCount)
            RETURNING id, created_at", conn);

        cmd.Parameters.AddWithValue("employeeId", request.EmployeeId);
        cmd.Parameters.AddWithValue("conductedById", request.ConductedById);
        cmd.Parameters.AddWithValue("supervisionDate", request.SupervisionDate.ToDateTime(TimeOnly.MinValue));
        cmd.Parameters.AddWithValue("period", period);
        cmd.Parameters.AddWithValue("notes", (object?)request.Notes ?? DBNull.Value);
        cmd.Parameters.AddWithValue("isCompleted", request.IsCompleted);
        cmd.Parameters.AddWithValue("requiredCount", request.RequiredCount);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();
        var id = reader.GetGuid("id");
        var createdAt = reader.GetDateTime("created_at");
        await reader.CloseAsync();

        await _audit.LogAsync("supervision_records", id, "INSERT", recordedBy, null, new { request.EmployeeId, request.ConductedById, request.SupervisionDate, period, request.Notes });

        // Get the full record with names
        var supervisions = await GetAllAsync();
        return supervisions.First(s => s.Id == id);
    }

    public async Task<SupervisionResponse?> UpdateAsync(Guid id, UpdateSupervisionRequest request, Guid recordedBy)
    {
        await using var conn = await _db.GetConnectionAsync();

        var period = $"{request.SupervisionDate.Year:0000}-{request.SupervisionDate.Month:00}";

        await using var cmd = new NpgsqlCommand(@"
            UPDATE supervision_records
            SET conducted_by_id = @conductedById,
                supervision_date = @supervisionDate,
                period = @period,
                notes = @notes,
                is_completed = @isCompleted,
                required_count = @requiredCount,
                updated_at = NOW()
            WHERE id = @id
            RETURNING employee_id, conducted_by_id", conn);

        cmd.Parameters.AddWithValue("id", id);
        cmd.Parameters.AddWithValue("conductedById", request.ConductedById);
        cmd.Parameters.AddWithValue("supervisionDate", request.SupervisionDate.ToDateTime(TimeOnly.MinValue));
        cmd.Parameters.AddWithValue("period", period);
        cmd.Parameters.AddWithValue("notes", (object?)request.Notes ?? DBNull.Value);
        cmd.Parameters.AddWithValue("isCompleted", request.IsCompleted);
        cmd.Parameters.AddWithValue("requiredCount", request.RequiredCount);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
            return null;

        await reader.CloseAsync();

        await _audit.LogAsync("supervision_records", id, "UPDATE", recordedBy, null, new { request.ConductedById, request.SupervisionDate, period, request.Notes });

        var supervisions = await GetAllAsync();
        return supervisions.FirstOrDefault(s => s.Id == id);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid recordedBy)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand("DELETE FROM supervision_records WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("id", id);

        var rows = await cmd.ExecuteNonQueryAsync();

        if (rows > 0)
            await _audit.LogAsync("supervision_records", id, "DELETE", recordedBy, null, null);

        return rows > 0;
    }

    public async Task<int> UpdateRequiredCountAsync(Guid employeeId, string period, int requiredCount, Guid recordedBy)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            UPDATE supervision_records
            SET required_count = @requiredCount, updated_at = NOW()
            WHERE employee_id = @employeeId AND period = @period", conn);

        cmd.Parameters.AddWithValue("requiredCount", requiredCount);
        cmd.Parameters.AddWithValue("employeeId", employeeId);
        cmd.Parameters.AddWithValue("period", period);

        var rows = await cmd.ExecuteNonQueryAsync();

        if (rows > 0)
            await _audit.LogAsync("supervision_records", employeeId, "UPDATE_REQUIRED_COUNT", recordedBy, null, new { employeeId, period, requiredCount });

        return rows;
    }
}
