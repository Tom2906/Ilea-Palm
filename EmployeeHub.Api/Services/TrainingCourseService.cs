using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Models;
using Npgsql;
using NpgsqlTypes;

namespace EmployeeHub.Api.Services;

public class TrainingCourseService : ITrainingCourseService
{
    private readonly IDbService _db;
    private readonly IAuditService _audit;

    public TrainingCourseService(IDbService db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<List<TrainingCourse>> GetAllAsync(string? category = null)
    {
        await using var conn = await _db.GetConnectionAsync();
        var sql = "SELECT id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin, mandatory_for_roles, created_at, updated_at FROM training_courses";
        if (!string.IsNullOrEmpty(category))
            sql += " WHERE category = @category";
        sql += " ORDER BY category, name";

        await using var cmd = new NpgsqlCommand(sql, conn);
        if (!string.IsNullOrEmpty(category))
            cmd.Parameters.AddWithValue("category", category);

        await using var reader = await cmd.ExecuteReaderAsync();
        var courses = new List<TrainingCourse>();
        while (await reader.ReadAsync())
        {
            courses.Add(ReadCourse(reader));
        }
        return courses;
    }

    public async Task<TrainingCourse?> GetByIdAsync(Guid id)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(
            "SELECT id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin, mandatory_for_roles, created_at, updated_at FROM training_courses WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("id", id);

        await using var reader = await cmd.ExecuteReaderAsync();
        return await reader.ReadAsync() ? ReadCourse(reader) : null;
    }

    public async Task<TrainingCourse> CreateAsync(CreateTrainingCourseRequest request, Guid userId)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO training_courses (name, description, category, validity_months, notification_days_before, notify_employee, notify_admin, mandatory_for_roles)
            VALUES (@name, @description, @category, @validityMonths, @notificationDaysBefore, @notifyEmployee, @notifyAdmin, @mandatoryForRoles)
            RETURNING id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin, mandatory_for_roles, created_at, updated_at", conn);

        cmd.Parameters.AddWithValue("name", request.Name);
        cmd.Parameters.AddWithValue("description", (object?)request.Description ?? DBNull.Value);
        cmd.Parameters.AddWithValue("category", request.Category);
        cmd.Parameters.AddWithValue("validityMonths", request.ValidityMonths.HasValue ? request.ValidityMonths.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("notificationDaysBefore", request.NotificationDaysBefore);
        cmd.Parameters.AddWithValue("notifyEmployee", request.NotifyEmployee);
        cmd.Parameters.AddWithValue("notifyAdmin", request.NotifyAdmin);

        var rolesParam = new NpgsqlParameter("mandatoryForRoles", NpgsqlDbType.Array | NpgsqlDbType.Text);
        rolesParam.Value = (object?)request.MandatoryForRoles ?? DBNull.Value;
        cmd.Parameters.Add(rolesParam);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();
        var course = ReadCourse(reader);

        await reader.CloseAsync();
        await _audit.LogAsync("training_courses", course.Id, "create", userId, newData: request);

        return course;
    }

    public async Task<TrainingCourse?> UpdateAsync(Guid id, UpdateTrainingCourseRequest request, Guid userId)
    {
        var existing = await GetByIdAsync(id);
        if (existing == null) return null;

        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            UPDATE training_courses SET
                name = COALESCE(@name, name),
                description = COALESCE(@description, description),
                category = COALESCE(@category, category),
                validity_months = COALESCE(@validityMonths, validity_months),
                notification_days_before = COALESCE(@notificationDaysBefore, notification_days_before),
                notify_employee = COALESCE(@notifyEmployee, notify_employee),
                notify_admin = COALESCE(@notifyAdmin, notify_admin),
                mandatory_for_roles = COALESCE(@mandatoryForRoles, mandatory_for_roles),
                updated_at = NOW()
            WHERE id = @id
            RETURNING id, name, description, category, validity_months, notification_days_before, notify_employee, notify_admin, mandatory_for_roles, created_at, updated_at", conn);

        cmd.Parameters.AddWithValue("id", id);
        cmd.Parameters.AddWithValue("name", (object?)request.Name ?? DBNull.Value);
        cmd.Parameters.AddWithValue("description", (object?)request.Description ?? DBNull.Value);
        cmd.Parameters.AddWithValue("category", (object?)request.Category ?? DBNull.Value);
        cmd.Parameters.AddWithValue("validityMonths", request.ValidityMonths.HasValue ? request.ValidityMonths.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("notificationDaysBefore", request.NotificationDaysBefore.HasValue ? request.NotificationDaysBefore.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("notifyEmployee", request.NotifyEmployee.HasValue ? request.NotifyEmployee.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("notifyAdmin", request.NotifyAdmin.HasValue ? request.NotifyAdmin.Value : DBNull.Value);

        var rolesParam = new NpgsqlParameter("mandatoryForRoles", NpgsqlDbType.Array | NpgsqlDbType.Text);
        rolesParam.Value = (object?)request.MandatoryForRoles ?? DBNull.Value;
        cmd.Parameters.Add(rolesParam);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;
        var updated = ReadCourse(reader);

        await reader.CloseAsync();
        await _audit.LogAsync("training_courses", id, "update", userId, oldData: existing, newData: request);

        return updated;
    }

    public async Task<bool> DeleteAsync(Guid id, Guid userId)
    {
        var existing = await GetByIdAsync(id);
        if (existing == null) return false;

        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand("DELETE FROM training_courses WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("id", id);

        var rows = await cmd.ExecuteNonQueryAsync();
        if (rows > 0)
            await _audit.LogAsync("training_courses", id, "delete", userId, oldData: existing);

        return rows > 0;
    }

    private static TrainingCourse ReadCourse(NpgsqlDataReader reader)
    {
        return new TrainingCourse
        {
            Id = reader.GetGuid(0),
            Name = reader.GetString(1),
            Description = reader.IsDBNull(2) ? null : reader.GetString(2),
            Category = reader.GetString(3),
            ValidityMonths = reader.IsDBNull(4) ? null : reader.GetInt32(4),
            NotificationDaysBefore = reader.GetInt32(5),
            NotifyEmployee = reader.GetBoolean(6),
            NotifyAdmin = reader.GetBoolean(7),
            MandatoryForRoles = reader.IsDBNull(8) ? null : reader.GetFieldValue<string[]>(8),
            CreatedAt = reader.GetDateTime(9),
            UpdatedAt = reader.GetDateTime(10)
        };
    }
}
