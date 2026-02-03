using System.Text.Json;
using Npgsql;

namespace EmployeeHub.Api.Services;

public class AuditService : IAuditService
{
    private readonly IDbService _db;

    public AuditService(IDbService db)
    {
        _db = db;
    }

    public async Task LogAsync(string tableName, Guid recordId, string action, Guid? userId, object? oldData = null, object? newData = null)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO audit_log (table_name, record_id, action, user_id, old_data, new_data)
            VALUES (@tableName, @recordId, @action, @userId, @oldData::jsonb, @newData::jsonb)", conn);

        cmd.Parameters.AddWithValue("tableName", tableName);
        cmd.Parameters.AddWithValue("recordId", recordId);
        cmd.Parameters.AddWithValue("action", action);
        cmd.Parameters.AddWithValue("userId", userId.HasValue ? userId.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("oldData", oldData != null ? JsonSerializer.Serialize(oldData) : DBNull.Value);
        cmd.Parameters.AddWithValue("newData", newData != null ? JsonSerializer.Serialize(newData) : DBNull.Value);

        await cmd.ExecuteNonQueryAsync();
    }
}
