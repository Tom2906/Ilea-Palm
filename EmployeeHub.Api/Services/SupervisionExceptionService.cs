using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Helpers;
using Npgsql;

namespace EmployeeHub.Api.Services;

public class SupervisionExceptionService : ISupervisionExceptionService
{
    private readonly IDbService _db;
    private readonly IAuditService _audit;

    public SupervisionExceptionService(IDbService db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<List<SupervisionExceptionResponse>> GetAllAsync(Guid? employeeId = null, string? period = null)
    {
        await using var conn = await _db.GetConnectionAsync();

        var sql = @"
            SELECT
                se.id, se.employee_id, se.period, se.exception_type,
                se.notes, se.created_by, se.created_at,
                e.first_name || ' ' || e.last_name as employee_name,
                u.email as created_by_name
            FROM supervision_exceptions se
            JOIN employees e ON e.id = se.employee_id
            LEFT JOIN users u ON u.id = se.created_by
            WHERE 1=1";

        if (employeeId.HasValue)
            sql += " AND se.employee_id = @employeeId";
        if (!string.IsNullOrEmpty(period))
            sql += " AND se.period = @period";

        sql += " ORDER BY se.period DESC, e.last_name, e.first_name";

        await using var cmd = new NpgsqlCommand(sql, conn);
        if (employeeId.HasValue) cmd.Parameters.AddWithValue("employeeId", employeeId.Value);
        if (!string.IsNullOrEmpty(period)) cmd.Parameters.AddWithValue("period", period);

        await using var reader = await cmd.ExecuteReaderAsync();
        var exceptions = new List<SupervisionExceptionResponse>();

        while (await reader.ReadAsync())
        {
            exceptions.Add(new SupervisionExceptionResponse
            {
                Id = reader.GetGuid("id"),
                EmployeeId = reader.GetGuid("employee_id"),
                Period = reader.GetString("period"),
                ExceptionType = reader.GetString("exception_type"),
                Notes = reader.GetStringOrNull("notes"),
                CreatedBy = reader.GetGuidOrNull("created_by"),
                CreatedAt = reader.GetDateTime("created_at"),
                EmployeeName = reader.GetString("employee_name"),
                CreatedByName = reader.GetStringOrNull("created_by_name")
            });
        }

        return exceptions;
    }

    public async Task<List<SupervisionExceptionResponse>> GetByEmployeeAsync(Guid employeeId)
    {
        return await GetAllAsync(employeeId: employeeId);
    }

    public async Task<List<SupervisionExceptionResponse>> GetByPeriodAsync(string period)
    {
        return await GetAllAsync(period: period);
    }

    public async Task<SupervisionExceptionResponse> CreateAsync(CreateSupervisionExceptionRequest request, Guid userId)
    {
        await using var conn = await _db.GetConnectionAsync();

        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO supervision_exceptions (employee_id, period, exception_type, notes, created_by)
            VALUES (@employeeId, @period, @exceptionType, @notes, @createdBy)
            RETURNING id, created_at", conn);

        cmd.Parameters.AddWithValue("employeeId", request.EmployeeId);
        cmd.Parameters.AddWithValue("period", request.Period);
        cmd.Parameters.AddWithValue("exceptionType", request.ExceptionType);
        cmd.Parameters.AddWithValue("notes", (object?)request.Notes ?? DBNull.Value);
        cmd.Parameters.AddWithValue("createdBy", userId);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();
        var id = reader.GetGuid("id");
        var createdAt = reader.GetDateTime("created_at");
        await reader.CloseAsync();

        await _audit.LogAsync("supervision_exceptions", id, "INSERT", userId, null, new { request.EmployeeId, request.Period, request.ExceptionType, request.Notes });

        // Get the full record with names
        var exceptions = await GetAllAsync(employeeId: request.EmployeeId, period: request.Period);
        return exceptions.First(e => e.Id == id);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid userId)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand("DELETE FROM supervision_exceptions WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("id", id);

        var rows = await cmd.ExecuteNonQueryAsync();

        if (rows > 0)
            await _audit.LogAsync("supervision_exceptions", id, "DELETE", userId, null, null);

        return rows > 0;
    }
}
