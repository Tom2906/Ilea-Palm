using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Models;
using Npgsql;

namespace EmployeeHub.Api.Services;

public class TrainingRecordService : ITrainingRecordService
{
    private readonly IDbService _db;
    private readonly IAuditService _audit;

    public TrainingRecordService(IDbService db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<List<TrainingRecordResponse>> GetByEmployeeAsync(Guid employeeId)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            SELECT tr.id, tr.employee_id, tr.course_id, tr.completion_date, tr.expiry_date,
                   tr.certificate_url, tr.notes, tr.recorded_by, tr.created_at,
                   e.first_name || ' ' || e.last_name as employee_name,
                   tc.name as course_name
            FROM training_records tr
            JOIN employees e ON e.id = tr.employee_id
            JOIN training_courses tc ON tc.id = tr.course_id
            WHERE tr.employee_id = @employeeId
            ORDER BY tr.completion_date DESC", conn);
        cmd.Parameters.AddWithValue("employeeId", employeeId);

        await using var reader = await cmd.ExecuteReaderAsync();
        var records = new List<TrainingRecordResponse>();
        while (await reader.ReadAsync())
        {
            records.Add(new TrainingRecordResponse
            {
                Id = reader.GetGuid(0),
                EmployeeId = reader.GetGuid(1),
                CourseId = reader.GetGuid(2),
                CompletionDate = DateOnly.FromDateTime(reader.GetDateTime(3)),
                ExpiryDate = reader.IsDBNull(4) ? null : DateOnly.FromDateTime(reader.GetDateTime(4)),
                CertificateUrl = reader.IsDBNull(5) ? null : reader.GetString(5),
                Notes = reader.IsDBNull(6) ? null : reader.GetString(6),
                RecordedBy = reader.GetGuid(7),
                CreatedAt = reader.GetDateTime(8),
                EmployeeName = reader.GetString(9),
                CourseName = reader.GetString(10)
            });
        }
        return records;
    }

    public async Task<TrainingRecordResponse> CreateAsync(CreateTrainingRecordRequest request, Guid userId)
    {
        // Look up course to calculate expiry
        await using var conn = await _db.GetConnectionAsync();
        await using var courseCmd = new NpgsqlCommand(
            "SELECT validity_months FROM training_courses WHERE id = @courseId", conn);
        courseCmd.Parameters.AddWithValue("courseId", request.CourseId);
        var validityMonths = await courseCmd.ExecuteScalarAsync() as int?;

        DateOnly? expiryDate = null;
        if (validityMonths.HasValue)
        {
            expiryDate = request.CompletionDate.AddMonths(validityMonths.Value);
        }

        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO training_records (employee_id, course_id, completion_date, expiry_date, certificate_url, notes, recorded_by)
            VALUES (@employeeId, @courseId, @completionDate, @expiryDate, @certificateUrl, @notes, @recordedBy)
            RETURNING id, created_at", conn);

        cmd.Parameters.AddWithValue("employeeId", request.EmployeeId);
        cmd.Parameters.AddWithValue("courseId", request.CourseId);
        cmd.Parameters.AddWithValue("completionDate", request.CompletionDate);
        cmd.Parameters.AddWithValue("expiryDate", expiryDate.HasValue ? expiryDate.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("certificateUrl", (object?)request.CertificateUrl ?? DBNull.Value);
        cmd.Parameters.AddWithValue("notes", (object?)request.Notes ?? DBNull.Value);
        cmd.Parameters.AddWithValue("recordedBy", userId);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();
        var id = reader.GetGuid(0);
        var createdAt = reader.GetDateTime(1);
        await reader.CloseAsync();

        // Get employee and course names for response
        await using var nameCmd = new NpgsqlCommand(@"
            SELECT e.first_name || ' ' || e.last_name, tc.name
            FROM employees e, training_courses tc
            WHERE e.id = @eid AND tc.id = @cid", conn);
        nameCmd.Parameters.AddWithValue("eid", request.EmployeeId);
        nameCmd.Parameters.AddWithValue("cid", request.CourseId);

        await using var nameReader = await nameCmd.ExecuteReaderAsync();
        await nameReader.ReadAsync();
        var employeeName = nameReader.GetString(0);
        var courseName = nameReader.GetString(1);
        await nameReader.CloseAsync();

        await _audit.LogAsync("training_records", id, "create", userId, newData: request);

        return new TrainingRecordResponse
        {
            Id = id,
            EmployeeId = request.EmployeeId,
            EmployeeName = employeeName,
            CourseId = request.CourseId,
            CourseName = courseName,
            CompletionDate = request.CompletionDate,
            ExpiryDate = expiryDate,
            CertificateUrl = request.CertificateUrl,
            Notes = request.Notes,
            RecordedBy = userId,
            CreatedAt = createdAt
        };
    }

    public async Task<List<TrainingStatusResponse>> GetTrainingStatusAsync(string? category = null, Guid? employeeId = null)
    {
        await using var conn = await _db.GetConnectionAsync();
        var sql = "SELECT employee_id, first_name, last_name, email, department, course_id, course_name, category, validity_months, training_record_id, completion_date, expiry_date, status, days_until_expiry FROM training_status";
        var conditions = new List<string>();
        if (!string.IsNullOrEmpty(category))
            conditions.Add("category = @category");
        if (employeeId.HasValue)
            conditions.Add("employee_id = @employeeId");
        if (conditions.Count > 0)
            sql += " WHERE " + string.Join(" AND ", conditions);
        sql += " ORDER BY last_name, first_name, course_name";

        await using var cmd = new NpgsqlCommand(sql, conn);
        if (!string.IsNullOrEmpty(category))
            cmd.Parameters.AddWithValue("category", category);
        if (employeeId.HasValue)
            cmd.Parameters.AddWithValue("employeeId", employeeId.Value);

        return await ReadStatusList(cmd);
    }

    public async Task<List<TrainingStatusResponse>> GetExpiringAsync(int days = 30)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            SELECT employee_id, first_name, last_name, email, department, course_id, course_name, category, validity_months, training_record_id, completion_date, expiry_date, status, days_until_expiry
            FROM training_status
            WHERE status IN ('Expiring Soon', 'Expired')
               OR (expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + @days)
            ORDER BY expiry_date ASC NULLS LAST, last_name, first_name", conn);
        cmd.Parameters.AddWithValue("days", days);

        return await ReadStatusList(cmd);
    }

    private static async Task<List<TrainingStatusResponse>> ReadStatusList(NpgsqlCommand cmd)
    {
        await using var reader = await cmd.ExecuteReaderAsync();
        var results = new List<TrainingStatusResponse>();
        while (await reader.ReadAsync())
        {
            results.Add(new TrainingStatusResponse
            {
                EmployeeId = reader.GetGuid(0),
                FirstName = reader.GetString(1),
                LastName = reader.GetString(2),
                Email = reader.GetString(3),
                Department = reader.IsDBNull(4) ? null : reader.GetString(4),
                CourseId = reader.GetGuid(5),
                CourseName = reader.GetString(6),
                Category = reader.GetString(7),
                ValidityMonths = reader.IsDBNull(8) ? null : reader.GetInt32(8),
                TrainingRecordId = reader.IsDBNull(9) ? null : reader.GetGuid(9),
                CompletionDate = reader.IsDBNull(10) ? null : DateOnly.FromDateTime(reader.GetDateTime(10)),
                ExpiryDate = reader.IsDBNull(11) ? null : DateOnly.FromDateTime(reader.GetDateTime(11)),
                Status = reader.GetString(12),
                DaysUntilExpiry = reader.IsDBNull(13) ? null : reader.GetInt32(13)
            });
        }
        return results;
    }
}
