using EmployeeHub.Api.Middleware;
using EmployeeHub.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/audit-log")]
public class AuditLogController : ControllerBase
{
    private readonly IDbService _db;

    public AuditLogController(IDbService db)
    {
        _db = db;
    }

    [RequirePermission("audit_log.view")]
    [HttpGet]
    public async Task<IActionResult> GetLog([FromQuery] int limit = 100, [FromQuery] string? tableName = null)
    {

        await using var conn = await _db.GetConnectionAsync();

        var sql = "SELECT id, table_name, record_id, action, user_id, old_data, new_data, created_at FROM audit_log";
        if (!string.IsNullOrEmpty(tableName))
            sql += " WHERE table_name = @tableName";
        sql += " ORDER BY created_at DESC LIMIT @limit";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("limit", limit);
        if (!string.IsNullOrEmpty(tableName))
            cmd.Parameters.AddWithValue("tableName", tableName);

        await using var reader = await cmd.ExecuteReaderAsync();
        var entries = new List<object>();
        while (await reader.ReadAsync())
        {
            entries.Add(new
            {
                id = reader.GetGuid(0),
                tableName = reader.GetString(1),
                recordId = reader.GetGuid(2),
                action = reader.GetString(3),
                userId = reader.IsDBNull(4) ? (Guid?)null : reader.GetGuid(4),
                oldData = reader.IsDBNull(5) ? null : reader.GetString(5),
                newData = reader.IsDBNull(6) ? null : reader.GetString(6),
                createdAt = reader.GetDateTime(7)
            });
        }
        return Ok(entries);
    }
}
