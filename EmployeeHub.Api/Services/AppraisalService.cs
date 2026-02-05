using EmployeeHub.Api.DTOs;
using Npgsql;

namespace EmployeeHub.Api.Services;

public class AppraisalService : IAppraisalService
{
    private readonly IDbService _db;
    private readonly IAuditService _audit;

    // Milestone type to human-readable label mapping
    private static readonly Dictionary<string, string> MilestoneLabels = new()
    {
        { "3_month", "3 Month Review" },
        { "6_month_probation", "6 Month Probation" },
        { "9_month", "9 Month Review" },
        { "12_month", "12 Month / Annual" },
        { "year2_3month", "Year 2 - 3 Month" },
        { "year2_6month", "Year 2 - 6 Month" },
        { "year2_9month", "Year 2 - 9 Month" },
        { "year2_annual", "Year 2 - Annual" },
        { "year3_3month", "Year 3 - 3 Month" },
        { "year3_6month", "Year 3 - 6 Month" },
        { "year3_9month", "Year 3 - 9 Month" },
        { "year3_appraisal", "Year 3 - Appraisal" }
    };

    // Milestone type to months offset from start date
    private static readonly Dictionary<string, int> MilestoneMonthsOffset = new()
    {
        { "3_month", 3 },
        { "6_month_probation", 6 },
        { "9_month", 9 },
        { "12_month", 12 },
        { "year2_3month", 15 },
        { "year2_6month", 18 },
        { "year2_9month", 21 },
        { "year2_annual", 24 },
        { "year3_3month", 27 },
        { "year3_6month", 30 },
        { "year3_9month", 33 },
        { "year3_appraisal", 36 }
    };

    public AppraisalService(IDbService db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public Dictionary<string, DateOnly> CalculateDueDates(DateOnly employeeStartDate)
    {
        var dueDates = new Dictionary<string, DateOnly>();
        foreach (var (milestoneType, monthsOffset) in MilestoneMonthsOffset)
        {
            dueDates[milestoneType] = employeeStartDate.AddMonths(monthsOffset);
        }
        return dueDates;
    }

    private static string CalculateStatus(DateOnly dueDate, DateOnly? completedDate)
    {
        if (completedDate.HasValue)
            return "completed";

        var today = DateOnly.FromDateTime(DateTime.Today);
        var daysUntilDue = dueDate.DayNumber - today.DayNumber;

        if (daysUntilDue < 0)
            return "overdue";
        if (daysUntilDue <= 30)
            return "due_soon";
        return "not_yet_due";
    }

    private static int? CalculateDaysUntilDue(DateOnly dueDate, DateOnly? completedDate)
    {
        if (completedDate.HasValue)
            return null;

        var today = DateOnly.FromDateTime(DateTime.Today);
        return dueDate.DayNumber - today.DayNumber;
    }

    private static string GetMilestoneLabel(string milestoneType)
    {
        return MilestoneLabels.TryGetValue(milestoneType, out var label) ? label : milestoneType;
    }

    public async Task<List<AppraisalResponse>> GetAllAsync()
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            SELECT
                am.id, am.employee_id, am.milestone_type, am.due_date, am.completed_date,
                am.conducted_by_id, am.notes, am.created_at, am.updated_at,
                e.first_name || ' ' || e.last_name as employee_name,
                c.first_name || ' ' || c.last_name as conducted_by_name
            FROM appraisal_milestones am
            JOIN employees e ON e.id = am.employee_id
            LEFT JOIN employees c ON c.id = am.conducted_by_id
            ORDER BY am.due_date ASC, e.last_name, e.first_name", conn);

        return await ReadAppraisalList(cmd);
    }

    public async Task<List<AppraisalResponse>> GetByEmployeeAsync(Guid employeeId)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            SELECT
                am.id, am.employee_id, am.milestone_type, am.due_date, am.completed_date,
                am.conducted_by_id, am.notes, am.created_at, am.updated_at,
                e.first_name || ' ' || e.last_name as employee_name,
                c.first_name || ' ' || c.last_name as conducted_by_name
            FROM appraisal_milestones am
            JOIN employees e ON e.id = am.employee_id
            LEFT JOIN employees c ON c.id = am.conducted_by_id
            WHERE am.employee_id = @employeeId
            ORDER BY am.due_date ASC", conn);
        cmd.Parameters.AddWithValue("employeeId", employeeId);

        return await ReadAppraisalList(cmd);
    }

    public async Task<List<AppraisalMatrixRow>> GetMatrixAsync()
    {
        await using var conn = await _db.GetConnectionAsync();

        // Get all active employees
        await using var empCmd = new NpgsqlCommand(@"
            SELECT id, first_name, last_name, role, department, start_date
            FROM employees
            WHERE active = true
            ORDER BY last_name, first_name", conn);

        var employees = new Dictionary<Guid, AppraisalMatrixRow>();
        await using (var reader = await empCmd.ExecuteReaderAsync())
        {
            while (await reader.ReadAsync())
            {
                var empId = reader.GetGuid(0);
                employees[empId] = new AppraisalMatrixRow
                {
                    EmployeeId = empId,
                    FirstName = reader.GetString(1),
                    LastName = reader.GetString(2),
                    Role = reader.GetString(3),
                    Department = reader.IsDBNull(4) ? null : reader.GetString(4),
                    StartDate = DateOnly.FromDateTime(reader.GetDateTime(5)),
                    Milestones = new List<AppraisalResponse>()
                };
            }
        }

        // Get all appraisals and group by employee
        var appraisals = await GetAllAsync();
        foreach (var appraisal in appraisals)
        {
            if (employees.TryGetValue(appraisal.EmployeeId, out var row))
            {
                row.Milestones.Add(appraisal);
            }
        }

        return employees.Values.ToList();
    }

    public async Task<AppraisalSummary> GetSummaryAsync()
    {
        var appraisals = await GetAllAsync();

        return new AppraisalSummary
        {
            TotalEmployees = appraisals.Select(a => a.EmployeeId).Distinct().Count(),
            Completed = appraisals.Count(a => a.Status == "completed"),
            DueSoon = appraisals.Count(a => a.Status == "due_soon"),
            Overdue = appraisals.Count(a => a.Status == "overdue"),
            NotYetDue = appraisals.Count(a => a.Status == "not_yet_due")
        };
    }

    public async Task<AppraisalResponse> CreateAsync(CreateAppraisalRequest request, Guid userId)
    {
        await using var conn = await _db.GetConnectionAsync();

        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO appraisal_milestones (employee_id, milestone_type, due_date, completed_date, conducted_by_id, notes)
            VALUES (@employeeId, @milestoneType, @dueDate, @completedDate, @conductedById, @notes)
            RETURNING id, created_at, updated_at", conn);

        cmd.Parameters.AddWithValue("employeeId", request.EmployeeId);
        cmd.Parameters.AddWithValue("milestoneType", request.MilestoneType);
        cmd.Parameters.AddWithValue("dueDate", request.DueDate.ToDateTime(TimeOnly.MinValue));
        cmd.Parameters.AddWithValue("completedDate", request.CompletedDate.HasValue ? request.CompletedDate.Value.ToDateTime(TimeOnly.MinValue) : DBNull.Value);
        cmd.Parameters.AddWithValue("conductedById", request.ConductedById.HasValue ? request.ConductedById.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("notes", (object?)request.Notes ?? DBNull.Value);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();
        var id = reader.GetGuid(0);
        var createdAt = reader.GetDateTime(1);
        var updatedAt = reader.GetDateTime(2);
        await reader.CloseAsync();

        // Get employee and conductor names
        await using var nameCmd = new NpgsqlCommand(@"
            SELECT e.first_name || ' ' || e.last_name,
                   COALESCE((SELECT first_name || ' ' || last_name FROM employees WHERE id = @conductedById), NULL)
            FROM employees e
            WHERE e.id = @employeeId", conn);
        nameCmd.Parameters.AddWithValue("employeeId", request.EmployeeId);
        nameCmd.Parameters.AddWithValue("conductedById", request.ConductedById.HasValue ? request.ConductedById.Value : DBNull.Value);

        await using var nameReader = await nameCmd.ExecuteReaderAsync();
        await nameReader.ReadAsync();
        var employeeName = nameReader.GetString(0);
        var conductedByName = nameReader.IsDBNull(1) ? null : nameReader.GetString(1);
        await nameReader.CloseAsync();

        await _audit.LogAsync("appraisal_milestones", id, "INSERT", userId, null, new { request.EmployeeId, request.MilestoneType, request.DueDate, request.CompletedDate, request.ConductedById, request.Notes });

        return new AppraisalResponse
        {
            Id = id,
            EmployeeId = request.EmployeeId,
            EmployeeName = employeeName,
            MilestoneType = request.MilestoneType,
            MilestoneLabel = GetMilestoneLabel(request.MilestoneType),
            DueDate = request.DueDate,
            CompletedDate = request.CompletedDate,
            ConductedById = request.ConductedById,
            ConductedByName = conductedByName,
            Notes = request.Notes,
            Status = CalculateStatus(request.DueDate, request.CompletedDate),
            DaysUntilDue = CalculateDaysUntilDue(request.DueDate, request.CompletedDate),
            CreatedAt = createdAt,
            UpdatedAt = updatedAt
        };
    }

    public async Task<AppraisalResponse?> UpdateAsync(Guid id, UpdateAppraisalRequest request, Guid userId)
    {
        await using var conn = await _db.GetConnectionAsync();

        // Build dynamic update query based on provided fields
        var updates = new List<string> { "updated_at = NOW()" };
        var cmd = new NpgsqlCommand { Connection = conn };

        if (request.DueDate.HasValue)
        {
            updates.Add("due_date = @dueDate");
            cmd.Parameters.AddWithValue("dueDate", request.DueDate.Value.ToDateTime(TimeOnly.MinValue));
        }
        if (request.CompletedDate.HasValue)
        {
            updates.Add("completed_date = @completedDate");
            cmd.Parameters.AddWithValue("completedDate", request.CompletedDate.Value.ToDateTime(TimeOnly.MinValue));
        }
        else
        {
            // Allow clearing completed_date by explicitly setting to null in request
            // Only clear if the property was explicitly included (we check for default differently)
        }
        if (request.ConductedById.HasValue)
        {
            updates.Add("conducted_by_id = @conductedById");
            cmd.Parameters.AddWithValue("conductedById", request.ConductedById.Value);
        }
        if (request.Notes != null)
        {
            updates.Add("notes = @notes");
            cmd.Parameters.AddWithValue("notes", request.Notes);
        }

        cmd.CommandText = $@"
            UPDATE appraisal_milestones
            SET {string.Join(", ", updates)}
            WHERE id = @id
            RETURNING employee_id, milestone_type, due_date, completed_date, conducted_by_id, notes, created_at, updated_at";
        cmd.Parameters.AddWithValue("id", id);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
            return null;

        var employeeId = reader.GetGuid(0);
        var milestoneType = reader.GetString(1);
        var dueDate = DateOnly.FromDateTime(reader.GetDateTime(2));
        var completedDate = reader.IsDBNull(3) ? (DateOnly?)null : DateOnly.FromDateTime(reader.GetDateTime(3));
        var conductedById = reader.IsDBNull(4) ? (Guid?)null : reader.GetGuid(4);
        var notes = reader.IsDBNull(5) ? null : reader.GetString(5);
        var createdAt = reader.GetDateTime(6);
        var updatedAt = reader.GetDateTime(7);
        await reader.CloseAsync();

        // Get names
        await using var nameCmd = new NpgsqlCommand(@"
            SELECT e.first_name || ' ' || e.last_name,
                   COALESCE((SELECT first_name || ' ' || last_name FROM employees WHERE id = @conductedById), NULL)
            FROM employees e
            WHERE e.id = @employeeId", conn);
        nameCmd.Parameters.AddWithValue("employeeId", employeeId);
        nameCmd.Parameters.AddWithValue("conductedById", conductedById.HasValue ? conductedById.Value : DBNull.Value);

        await using var nameReader = await nameCmd.ExecuteReaderAsync();
        await nameReader.ReadAsync();
        var employeeName = nameReader.GetString(0);
        var conductedByName = nameReader.IsDBNull(1) ? null : nameReader.GetString(1);
        await nameReader.CloseAsync();

        await _audit.LogAsync("appraisal_milestones", id, "UPDATE", userId, null, new { request.DueDate, request.CompletedDate, request.ConductedById, request.Notes });

        return new AppraisalResponse
        {
            Id = id,
            EmployeeId = employeeId,
            EmployeeName = employeeName,
            MilestoneType = milestoneType,
            MilestoneLabel = GetMilestoneLabel(milestoneType),
            DueDate = dueDate,
            CompletedDate = completedDate,
            ConductedById = conductedById,
            ConductedByName = conductedByName,
            Notes = notes,
            Status = CalculateStatus(dueDate, completedDate),
            DaysUntilDue = CalculateDaysUntilDue(dueDate, completedDate),
            CreatedAt = createdAt,
            UpdatedAt = updatedAt
        };
    }

    public async Task<bool> DeleteAsync(Guid id, Guid userId)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand("DELETE FROM appraisal_milestones WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("id", id);

        var rows = await cmd.ExecuteNonQueryAsync();

        if (rows > 0)
            await _audit.LogAsync("appraisal_milestones", id, "DELETE", userId, null, null);

        return rows > 0;
    }

    public async Task<List<AppraisalResponse>> GenerateMilestonesForEmployeeAsync(Guid employeeId, Guid userId)
    {
        await using var conn = await _db.GetConnectionAsync();

        // Get employee start date
        await using var empCmd = new NpgsqlCommand("SELECT start_date FROM employees WHERE id = @employeeId", conn);
        empCmd.Parameters.AddWithValue("employeeId", employeeId);
        var startDateObj = await empCmd.ExecuteScalarAsync();

        if (startDateObj == null)
            throw new ArgumentException("Employee not found");

        var startDate = DateOnly.FromDateTime((DateTime)startDateObj);
        var dueDates = CalculateDueDates(startDate);
        var created = new List<AppraisalResponse>();

        foreach (var (milestoneType, dueDate) in dueDates)
        {
            // Check if milestone already exists (using ON CONFLICT for upsert-like behavior)
            try
            {
                var appraisal = await CreateAsync(new CreateAppraisalRequest
                {
                    EmployeeId = employeeId,
                    MilestoneType = milestoneType,
                    DueDate = dueDate
                }, userId);
                created.Add(appraisal);
            }
            catch (Npgsql.PostgresException ex) when (ex.SqlState == "23505") // Unique violation
            {
                // Milestone already exists, skip
            }
        }

        return created;
    }

    private static async Task<List<AppraisalResponse>> ReadAppraisalList(NpgsqlCommand cmd)
    {
        await using var reader = await cmd.ExecuteReaderAsync();
        var results = new List<AppraisalResponse>();

        while (await reader.ReadAsync())
        {
            var dueDate = DateOnly.FromDateTime(reader.GetDateTime(3));
            var completedDate = reader.IsDBNull(4) ? (DateOnly?)null : DateOnly.FromDateTime(reader.GetDateTime(4));
            var milestoneType = reader.GetString(2);

            results.Add(new AppraisalResponse
            {
                Id = reader.GetGuid(0),
                EmployeeId = reader.GetGuid(1),
                MilestoneType = milestoneType,
                MilestoneLabel = GetMilestoneLabel(milestoneType),
                DueDate = dueDate,
                CompletedDate = completedDate,
                ConductedById = reader.IsDBNull(5) ? null : reader.GetGuid(5),
                Notes = reader.IsDBNull(6) ? null : reader.GetString(6),
                CreatedAt = reader.GetDateTime(7),
                UpdatedAt = reader.GetDateTime(8),
                EmployeeName = reader.GetString(9),
                ConductedByName = reader.IsDBNull(10) ? null : reader.GetString(10),
                Status = CalculateStatus(dueDate, completedDate),
                DaysUntilDue = CalculateDaysUntilDue(dueDate, completedDate)
            });
        }

        return results;
    }
}
