using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Models;
using Npgsql;

namespace EmployeeHub.Api.Services;

public class RotaService : IRotaService
{
    private readonly IDbService _db;
    private readonly IAuditService _audit;
    private readonly ILeaveService _leaveService;

    public RotaService(IDbService db, IAuditService audit, ILeaveService leaveService)
    {
        _db = db;
        _audit = audit;
        _leaveService = leaveService;
    }

    public async Task<List<ShiftType>> GetShiftTypesAsync()
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(
            "SELECT id, code, name, default_hours, includes_sleep, display_color, sort_order, is_active FROM shift_types WHERE is_active = true ORDER BY sort_order",
            conn);

        await using var reader = await cmd.ExecuteReaderAsync();
        var types = new List<ShiftType>();
        while (await reader.ReadAsync())
        {
            types.Add(new ShiftType
            {
                Id = reader.GetGuid(0),
                Code = reader.GetString(1),
                Name = reader.GetString(2),
                DefaultHours = reader.GetDecimal(3),
                IncludesSleep = reader.GetBoolean(4),
                DisplayColor = reader.IsDBNull(5) ? null : reader.GetString(5),
                SortOrder = reader.GetInt32(6),
                IsActive = reader.GetBoolean(7)
            });
        }
        return types;
    }

    public async Task<RotaMonthResponse> GetMonthAsync(int year, int month)
    {
        var daysInMonth = DateTime.DaysInMonth(year, month);
        var startDate = new DateOnly(year, month, 1);
        var endDate = new DateOnly(year, month, daysInMonth);

        var shiftTypes = await GetShiftTypesAsync();

        await using var conn = await _db.GetConnectionAsync();

        // Get monthly contracted hours
        decimal? contractedHours = null;
        await using (var hoursCmd = new NpgsqlCommand(
            "SELECT contracted_hours FROM rota_monthly_hours WHERE year = @year AND month = @month", conn))
        {
            hoursCmd.Parameters.AddWithValue("year", year);
            hoursCmd.Parameters.AddWithValue("month", month);
            var result = await hoursCmd.ExecuteScalarAsync();
            if (result != null && result != DBNull.Value)
                contractedHours = (decimal)result;
        }

        // Get active employees
        await using var empCmd = new NpgsqlCommand(@"
            SELECT id, first_name, last_name, role
            FROM employees
            WHERE active = true
            ORDER BY last_name, first_name", conn);

        var employees = new List<RotaEmployeeResponse>();
        await using (var reader = await empCmd.ExecuteReaderAsync())
        {
            while (await reader.ReadAsync())
            {
                employees.Add(new RotaEmployeeResponse
                {
                    EmployeeId = reader.GetGuid(0),
                    FirstName = reader.GetString(1),
                    LastName = reader.GetString(2),
                    Role = reader.GetString(3)
                });
            }
        }

        // Get all shifts for the month
        await using var shiftCmd = new NpgsqlCommand(@"
            SELECT s.id, s.employee_id, s.date, s.shift_type_id, st.code,
                   COALESCE(s.hours, st.default_hours) as hours, st.includes_sleep,
                   st.display_color, s.notes
            FROM shifts s
            JOIN shift_types st ON s.shift_type_id = st.id
            WHERE s.date >= @startDate AND s.date <= @endDate
            ORDER BY s.employee_id, s.date", conn);

        shiftCmd.Parameters.AddWithValue("startDate", startDate);
        shiftCmd.Parameters.AddWithValue("endDate", endDate);

        var shiftsByEmployee = new Dictionary<Guid, Dictionary<string, ShiftResponse>>();
        await using (var reader = await shiftCmd.ExecuteReaderAsync())
        {
            while (await reader.ReadAsync())
            {
                var employeeId = reader.GetGuid(1);
                var date = DateOnly.FromDateTime(reader.GetDateTime(2));
                var dateKey = date.ToString("yyyy-MM-dd");

                if (!shiftsByEmployee.ContainsKey(employeeId))
                    shiftsByEmployee[employeeId] = new Dictionary<string, ShiftResponse>();

                shiftsByEmployee[employeeId][dateKey] = new ShiftResponse
                {
                    Id = reader.GetGuid(0),
                    EmployeeId = employeeId,
                    Date = date,
                    ShiftTypeId = reader.GetGuid(3),
                    ShiftTypeCode = reader.GetString(4),
                    Hours = reader.GetDecimal(5),
                    IncludesSleep = reader.GetBoolean(6),
                    DisplayColor = reader.IsDBNull(7) ? null : reader.GetString(7),
                    Notes = reader.IsDBNull(8) ? null : reader.GetString(8)
                };
            }
        }

        // Get approved leave dates for the month
        var leaveDatesByEmployee = await _leaveService.GetApprovedLeaveDatesForMonthAsync(year, month);

        // Assemble per-employee data
        foreach (var emp in employees)
        {
            if (shiftsByEmployee.TryGetValue(emp.EmployeeId, out var shifts))
            {
                emp.Shifts = shifts;
                emp.Summary.TotalHours = shifts.Values.Sum(s => s.Hours);
                emp.Summary.TotalSleeps = shifts.Values.Count(s => s.IncludesSleep);

                if (contractedHours.HasValue)
                {
                    emp.Summary.OverUnder = emp.Summary.TotalHours - contractedHours.Value;
                }
            }

            if (leaveDatesByEmployee.TryGetValue(emp.EmployeeId, out var leaveDates))
            {
                emp.LeaveDates = leaveDates;
                emp.Summary.AnnualLeaveDays = leaveDates.Count;
            }
        }

        return new RotaMonthResponse
        {
            Month = month,
            Year = year,
            DaysInMonth = daysInMonth,
            ContractedHours = contractedHours,
            Staff = employees,
            ShiftTypes = shiftTypes.Select(st => new ShiftTypeResponse
            {
                Id = st.Id,
                Code = st.Code,
                Name = st.Name,
                DefaultHours = st.DefaultHours,
                IncludesSleep = st.IncludesSleep,
                DisplayColor = st.DisplayColor,
                SortOrder = st.SortOrder
            }).ToList()
        };
    }

    public async Task<Shift?> CreateShiftAsync(CreateShiftRequest request, Guid userId)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO shifts (employee_id, date, shift_type_id, hours, notes)
            VALUES (@employeeId, @date, @shiftTypeId, @hours, @notes)
            ON CONFLICT (employee_id, date) DO UPDATE SET
                shift_type_id = @shiftTypeId,
                hours = @hours,
                notes = @notes,
                updated_at = NOW()
            RETURNING id", conn);

        cmd.Parameters.AddWithValue("employeeId", request.EmployeeId);
        cmd.Parameters.AddWithValue("date", request.Date);
        cmd.Parameters.AddWithValue("shiftTypeId", request.ShiftTypeId);
        cmd.Parameters.AddWithValue("hours", request.Hours.HasValue ? request.Hours.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("notes", (object?)request.Notes ?? DBNull.Value);

        var id = (Guid)(await cmd.ExecuteScalarAsync())!;
        var shift = await GetShiftByIdAsync(conn, id);

        await _audit.LogAsync("shifts", id, "create", userId, newData: request);

        return shift;
    }

    public async Task<Shift?> UpdateShiftAsync(Guid id, UpdateShiftRequest request, Guid userId)
    {
        await using var conn = await _db.GetConnectionAsync();

        var existing = await GetShiftByIdAsync(conn, id);
        if (existing == null) return null;

        await using var cmd = new NpgsqlCommand(@"
            UPDATE shifts SET
                shift_type_id = COALESCE(@shiftTypeId, shift_type_id),
                hours = COALESCE(@hours, hours),
                notes = COALESCE(@notes, notes),
                updated_at = NOW()
            WHERE id = @id", conn);

        cmd.Parameters.AddWithValue("id", id);
        cmd.Parameters.AddWithValue("shiftTypeId", (object?)request.ShiftTypeId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("hours", request.Hours.HasValue ? request.Hours.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("notes", (object?)request.Notes ?? DBNull.Value);

        await cmd.ExecuteNonQueryAsync();

        await _audit.LogAsync("shifts", id, "update", userId, oldData: existing, newData: request);

        return await GetShiftByIdAsync(conn, id);
    }

    public async Task<bool> DeleteShiftAsync(Guid id, Guid userId)
    {
        await using var conn = await _db.GetConnectionAsync();

        var existing = await GetShiftByIdAsync(conn, id);
        if (existing == null) return false;

        await using var cmd = new NpgsqlCommand("DELETE FROM shifts WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("id", id);

        var rows = await cmd.ExecuteNonQueryAsync();
        if (rows > 0)
            await _audit.LogAsync("shifts", id, "delete", userId, oldData: existing);

        return rows > 0;
    }

    public async Task<List<RotaMonthlyHours>> GetMonthlyHoursAsync(int year)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(
            "SELECT id, year, month, contracted_hours FROM rota_monthly_hours WHERE year = @year ORDER BY month",
            conn);
        cmd.Parameters.AddWithValue("year", year);

        await using var reader = await cmd.ExecuteReaderAsync();
        var hours = new List<RotaMonthlyHours>();
        while (await reader.ReadAsync())
        {
            hours.Add(new RotaMonthlyHours
            {
                Id = reader.GetGuid(0),
                Year = reader.GetInt32(1),
                Month = reader.GetInt32(2),
                ContractedHours = reader.GetDecimal(3)
            });
        }
        return hours;
    }

    public async Task<RotaMonthlyHours> SetMonthlyHoursAsync(SetMonthlyHoursRequest request, Guid userId)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO rota_monthly_hours (year, month, contracted_hours)
            VALUES (@year, @month, @contractedHours)
            ON CONFLICT (year, month) DO UPDATE SET contracted_hours = @contractedHours
            RETURNING id", conn);

        cmd.Parameters.AddWithValue("year", request.Year);
        cmd.Parameters.AddWithValue("month", request.Month);
        cmd.Parameters.AddWithValue("contractedHours", request.ContractedHours);

        var id = (Guid)(await cmd.ExecuteScalarAsync())!;

        await _audit.LogAsync("rota_monthly_hours", id, "upsert", userId, newData: request);

        return new RotaMonthlyHours
        {
            Id = id,
            Year = request.Year,
            Month = request.Month,
            ContractedHours = request.ContractedHours
        };
    }

    private async Task<Shift?> GetShiftByIdAsync(NpgsqlConnection conn, Guid id)
    {
        await using var cmd = new NpgsqlCommand(@"
            SELECT s.id, s.employee_id, s.date, s.shift_type_id, st.code, st.name,
                   COALESCE(s.hours, st.default_hours) as hours, st.default_hours,
                   st.includes_sleep, st.display_color, s.notes, s.created_at, s.updated_at
            FROM shifts s
            JOIN shift_types st ON s.shift_type_id = st.id
            WHERE s.id = @id", conn);

        cmd.Parameters.AddWithValue("id", id);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;

        return new Shift
        {
            Id = reader.GetGuid(0),
            EmployeeId = reader.GetGuid(1),
            Date = DateOnly.FromDateTime(reader.GetDateTime(2)),
            ShiftTypeId = reader.GetGuid(3),
            ShiftTypeCode = reader.GetString(4),
            ShiftTypeName = reader.GetString(5),
            Hours = reader.GetDecimal(6),
            DefaultHours = reader.GetDecimal(7),
            IncludesSleep = reader.GetBoolean(8),
            DisplayColor = reader.IsDBNull(9) ? null : reader.GetString(9),
            Notes = reader.IsDBNull(10) ? null : reader.GetString(10),
            CreatedAt = reader.GetDateTime(11),
            UpdatedAt = reader.GetDateTime(12)
        };
    }
}
