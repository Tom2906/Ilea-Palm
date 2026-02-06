using EmployeeHub.Api.DTOs;
using Npgsql;

namespace EmployeeHub.Api.Services;

public class LeaveService : ILeaveService
{
    private readonly IDbService _db;
    private readonly IAuditService _audit;

    public LeaveService(IDbService db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<List<LeaveRequestResponse>> GetRequestsAsync(Guid? employeeId = null, string? status = null)
    {
        await using var conn = await _db.GetConnectionAsync();

        var sql = @"
            SELECT lr.id, lr.employee_id, e.first_name || ' ' || e.last_name AS employee_name,
                   lr.start_date, lr.end_date, lr.total_days, lr.status,
                   lr.requested_by, ru.display_name AS requested_by_name,
                   lr.approved_by, au.display_name AS approved_by_name,
                   lr.approved_at, lr.notes, lr.created_at
            FROM leave_requests lr
            JOIN employees e ON lr.employee_id = e.id
            JOIN users ru ON lr.requested_by = ru.id
            LEFT JOIN users au ON lr.approved_by = au.id
            WHERE 1=1";

        if (employeeId.HasValue)
            sql += " AND lr.employee_id = @employeeId";
        if (!string.IsNullOrEmpty(status))
            sql += " AND lr.status = @status";

        sql += " ORDER BY lr.created_at DESC";

        await using var cmd = new NpgsqlCommand(sql, conn);
        if (employeeId.HasValue)
            cmd.Parameters.AddWithValue("employeeId", employeeId.Value);
        if (!string.IsNullOrEmpty(status))
            cmd.Parameters.AddWithValue("status", status);

        var results = new List<LeaveRequestResponse>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            results.Add(ReadLeaveRequest(reader));
        }
        return results;
    }

    public async Task<LeaveRequestResponse?> GetRequestByIdAsync(Guid id)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            SELECT lr.id, lr.employee_id, e.first_name || ' ' || e.last_name AS employee_name,
                   lr.start_date, lr.end_date, lr.total_days, lr.status,
                   lr.requested_by, ru.display_name AS requested_by_name,
                   lr.approved_by, au.display_name AS approved_by_name,
                   lr.approved_at, lr.notes, lr.created_at
            FROM leave_requests lr
            JOIN employees e ON lr.employee_id = e.id
            JOIN users ru ON lr.requested_by = ru.id
            LEFT JOIN users au ON lr.approved_by = au.id
            WHERE lr.id = @id", conn);

        cmd.Parameters.AddWithValue("id", id);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;
        return ReadLeaveRequest(reader);
    }

    public async Task<LeaveRequestResponse> CreateRequestAsync(CreateLeaveRequestRequest request, Guid userId)
    {
        var startDate = DateOnly.Parse(request.StartDate);
        var endDate = DateOnly.Parse(request.EndDate);

        if (endDate < startDate)
            throw new ArgumentException("End date must be on or after start date");

        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO leave_requests (employee_id, start_date, end_date, total_days, requested_by, notes)
            VALUES (@employeeId, @startDate, @endDate, @totalDays, @requestedBy, @notes)
            RETURNING id", conn);

        cmd.Parameters.AddWithValue("employeeId", request.EmployeeId);
        cmd.Parameters.AddWithValue("startDate", startDate);
        cmd.Parameters.AddWithValue("endDate", endDate);
        cmd.Parameters.AddWithValue("totalDays", request.TotalDays);
        cmd.Parameters.AddWithValue("requestedBy", userId);
        cmd.Parameters.AddWithValue("notes", (object?)request.Notes ?? DBNull.Value);

        var id = (Guid)(await cmd.ExecuteScalarAsync())!;

        await _audit.LogAsync("leave_requests", id, "create", userId, newData: request);

        return (await GetRequestByIdAsync(id))!;
    }

    public async Task<LeaveRequestResponse?> UpdateStatusAsync(Guid id, UpdateLeaveStatusRequest request, Guid userId)
    {
        var validStatuses = new[] { "approved", "rejected", "cancelled" };
        if (!validStatuses.Contains(request.Status))
            throw new ArgumentException($"Invalid status: {request.Status}");

        await using var conn = await _db.GetConnectionAsync();

        // Verify current status allows transition
        await using var checkCmd = new NpgsqlCommand(
            "SELECT status FROM leave_requests WHERE id = @id", conn);
        checkCmd.Parameters.AddWithValue("id", id);
        var currentStatus = await checkCmd.ExecuteScalarAsync() as string;
        if (currentStatus == null) return null;

        // Only pending can be approved/rejected; approved can be cancelled
        if (currentStatus == "pending" && request.Status is not ("approved" or "rejected"))
            throw new ArgumentException("Pending requests can only be approved or rejected");
        if (currentStatus == "approved" && request.Status != "cancelled")
            throw new ArgumentException("Approved requests can only be cancelled");
        if (currentStatus is "rejected" or "cancelled")
            throw new ArgumentException($"Cannot change status of {currentStatus} requests");

        var sql = @"
            UPDATE leave_requests SET
                status = @status,
                approved_by = @approvedBy,
                approved_at = CASE WHEN @status IN ('approved', 'rejected') THEN NOW() ELSE approved_at END,
                notes = COALESCE(@notes, notes),
                updated_at = NOW()
            WHERE id = @id";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("id", id);
        cmd.Parameters.AddWithValue("status", request.Status);
        cmd.Parameters.AddWithValue("approvedBy", userId);
        cmd.Parameters.AddWithValue("notes", (object?)request.Notes ?? DBNull.Value);

        await cmd.ExecuteNonQueryAsync();

        await _audit.LogAsync("leave_requests", id, $"status_{request.Status}", userId, newData: request);

        return await GetRequestByIdAsync(id);
    }

    public async Task<LeaveBalanceResponse> GetBalanceAsync(Guid employeeId, int year)
    {
        await using var conn = await _db.GetConnectionAsync();

        // Get entitlement
        decimal totalEntitlement = 28; // default
        decimal carriedOver = 0;

        await using (var entCmd = new NpgsqlCommand(
            "SELECT total_days, carried_over FROM leave_entitlements WHERE employee_id = @empId AND year = @year", conn))
        {
            entCmd.Parameters.AddWithValue("empId", employeeId);
            entCmd.Parameters.AddWithValue("year", year);
            await using var reader = await entCmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                totalEntitlement = reader.GetDecimal(0);
                carriedOver = reader.GetDecimal(1);
            }
        }

        // Get approved days taken
        decimal approvedDays = 0;
        await using (var appCmd = new NpgsqlCommand(@"
            SELECT COALESCE(SUM(total_days), 0) FROM leave_requests
            WHERE employee_id = @empId AND status = 'approved'
            AND EXTRACT(YEAR FROM start_date) = @year", conn))
        {
            appCmd.Parameters.AddWithValue("empId", employeeId);
            appCmd.Parameters.AddWithValue("year", year);
            approvedDays = (decimal)(await appCmd.ExecuteScalarAsync())!;
        }

        // Get pending days
        decimal pendingDays = 0;
        await using (var penCmd = new NpgsqlCommand(@"
            SELECT COALESCE(SUM(total_days), 0) FROM leave_requests
            WHERE employee_id = @empId AND status = 'pending'
            AND EXTRACT(YEAR FROM start_date) = @year", conn))
        {
            penCmd.Parameters.AddWithValue("empId", employeeId);
            penCmd.Parameters.AddWithValue("year", year);
            pendingDays = (decimal)(await penCmd.ExecuteScalarAsync())!;
        }

        return new LeaveBalanceResponse
        {
            TotalEntitlement = totalEntitlement,
            CarriedOver = carriedOver,
            ApprovedDaysTaken = approvedDays,
            PendingDays = pendingDays,
            Remaining = totalEntitlement + carriedOver - approvedDays
        };
    }

    public async Task<LeaveEntitlementResponse> SetEntitlementAsync(SetLeaveEntitlementRequest request, Guid userId)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO leave_entitlements (employee_id, year, total_days, carried_over, notes)
            VALUES (@employeeId, @year, @totalDays, @carriedOver, @notes)
            ON CONFLICT (employee_id, year) DO UPDATE SET
                total_days = @totalDays,
                carried_over = @carriedOver,
                notes = @notes,
                updated_at = NOW()
            RETURNING id", conn);

        cmd.Parameters.AddWithValue("employeeId", request.EmployeeId);
        cmd.Parameters.AddWithValue("year", request.Year);
        cmd.Parameters.AddWithValue("totalDays", request.TotalDays);
        cmd.Parameters.AddWithValue("carriedOver", request.CarriedOver);
        cmd.Parameters.AddWithValue("notes", (object?)request.Notes ?? DBNull.Value);

        var id = (Guid)(await cmd.ExecuteScalarAsync())!;

        await _audit.LogAsync("leave_entitlements", id, "upsert", userId, newData: request);

        // Return with calculated values
        var balance = await GetBalanceAsync(request.EmployeeId, request.Year);

        // Get employee name
        await using var nameCmd = new NpgsqlCommand(
            "SELECT first_name || ' ' || last_name FROM employees WHERE id = @id", conn);
        nameCmd.Parameters.AddWithValue("id", request.EmployeeId);
        var empName = (await nameCmd.ExecuteScalarAsync()) as string ?? "";

        return new LeaveEntitlementResponse
        {
            Id = id,
            EmployeeId = request.EmployeeId,
            EmployeeName = empName,
            Year = request.Year,
            TotalDays = request.TotalDays,
            CarriedOver = request.CarriedOver,
            ApprovedDays = balance.ApprovedDaysTaken,
            RemainingDays = balance.Remaining,
            Notes = request.Notes
        };
    }

    public async Task<List<LeaveEntitlementResponse>> GetEntitlementsAsync(int year)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            SELECT le.id, le.employee_id, e.first_name || ' ' || e.last_name AS employee_name,
                   le.year, le.total_days, le.carried_over, le.notes,
                   COALESCE((SELECT SUM(lr.total_days) FROM leave_requests lr
                             WHERE lr.employee_id = le.employee_id AND lr.status = 'approved'
                             AND EXTRACT(YEAR FROM lr.start_date) = le.year), 0) AS approved_days
            FROM leave_entitlements le
            JOIN employees e ON le.employee_id = e.id
            WHERE le.year = @year
            ORDER BY e.last_name, e.first_name", conn);

        cmd.Parameters.AddWithValue("year", year);

        var results = new List<LeaveEntitlementResponse>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var totalDays = reader.GetDecimal(4);
            var carriedOver = reader.GetDecimal(5);
            var approvedDays = reader.GetDecimal(7);
            results.Add(new LeaveEntitlementResponse
            {
                Id = reader.GetGuid(0),
                EmployeeId = reader.GetGuid(1),
                EmployeeName = reader.GetString(2),
                Year = reader.GetInt32(3),
                TotalDays = totalDays,
                CarriedOver = carriedOver,
                Notes = reader.IsDBNull(6) ? null : reader.GetString(6),
                ApprovedDays = approvedDays,
                RemainingDays = totalDays + carriedOver - approvedDays
            });
        }
        return results;
    }

    public async Task<Dictionary<Guid, HashSet<string>>> GetApprovedLeaveDatesForMonthAsync(int year, int month)
    {
        var daysInMonth = DateTime.DaysInMonth(year, month);
        var monthStart = new DateOnly(year, month, 1);
        var monthEnd = new DateOnly(year, month, daysInMonth);

        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            SELECT employee_id, start_date, end_date
            FROM leave_requests
            WHERE status = 'approved'
            AND start_date <= @monthEnd AND end_date >= @monthStart", conn);

        cmd.Parameters.AddWithValue("monthStart", monthStart);
        cmd.Parameters.AddWithValue("monthEnd", monthEnd);

        var result = new Dictionary<Guid, HashSet<string>>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var empId = reader.GetGuid(0);
            var start = DateOnly.FromDateTime(reader.GetDateTime(1));
            var end = DateOnly.FromDateTime(reader.GetDateTime(2));

            // Clamp to month boundaries
            if (start < monthStart) start = monthStart;
            if (end > monthEnd) end = monthEnd;

            if (!result.ContainsKey(empId))
                result[empId] = new HashSet<string>();

            for (var d = start; d <= end; d = d.AddDays(1))
            {
                result[empId].Add(d.ToString("yyyy-MM-dd"));
            }
        }

        return result;
    }

    private static LeaveRequestResponse ReadLeaveRequest(NpgsqlDataReader reader)
    {
        return new LeaveRequestResponse
        {
            Id = reader.GetGuid(0),
            EmployeeId = reader.GetGuid(1),
            EmployeeName = reader.GetString(2),
            StartDate = DateOnly.FromDateTime(reader.GetDateTime(3)).ToString("yyyy-MM-dd"),
            EndDate = DateOnly.FromDateTime(reader.GetDateTime(4)).ToString("yyyy-MM-dd"),
            TotalDays = reader.GetDecimal(5),
            Status = reader.GetString(6),
            RequestedBy = reader.GetGuid(7),
            RequestedByName = reader.GetString(8),
            ApprovedBy = reader.IsDBNull(9) ? null : reader.GetGuid(9),
            ApprovedByName = reader.IsDBNull(10) ? null : reader.GetString(10),
            ApprovedAt = reader.IsDBNull(11) ? null : reader.GetDateTime(11).ToString("o"),
            Notes = reader.IsDBNull(12) ? null : reader.GetString(12),
            CreatedAt = reader.GetDateTime(13).ToString("o")
        };
    }
}
