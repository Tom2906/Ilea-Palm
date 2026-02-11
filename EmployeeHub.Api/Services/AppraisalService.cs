using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Helpers;
using Npgsql;

namespace EmployeeHub.Api.Services;

public class AppraisalService : IAppraisalService
{
    private readonly IDbService _db;
    private readonly IAuditService _audit;

    public AppraisalService(IDbService db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
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

    public async Task<List<AppraisalResponse>> GetByEmployeeAsync(Guid employeeId)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            SELECT
                am.id, am.employee_id,
                CAST(ROW_NUMBER() OVER (ORDER BY am.due_date) AS INTEGER) as review_number,
                am.due_date, am.completed_date,
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

    public async Task<List<AppraisalMatrixRow>> GetMatrixAsync(int reviewsBack = 2, int reviewsForward = 2)
    {
        await using var conn = await _db.GetConnectionAsync();

        // Get all active employees
        await using var empCmd = new NpgsqlCommand(@"
            SELECT e.id, e.first_name, e.last_name, e.role, e.department, e.start_date,
                   e.appraisal_frequency_months, es.name as status_name
            FROM employees e
            LEFT JOIN employee_statuses es ON e.status_id = es.id
            WHERE e.active = true
            ORDER BY e.last_name, e.first_name", conn);

        var employees = new List<(Guid Id, string FirstName, string LastName, string Role, string? Department, DateOnly StartDate, int FrequencyMonths, string? EmployeeStatus)>();
        await using (var reader = await empCmd.ExecuteReaderAsync())
        {
            while (await reader.ReadAsync())
            {
                employees.Add((
                    reader.GetGuid("id"),
                    reader.GetString("first_name"),
                    reader.GetString("last_name"),
                    reader.GetString("role"),
                    reader.GetStringOrNull("department"),
                    reader.GetDateOnly("start_date"),
                    reader.GetInt32("appraisal_frequency_months"),
                    reader.GetStringOrNull("status_name")
                ));
            }
        }

        // Get all milestones with conductor names
        await using var milCmd = new NpgsqlCommand(@"
            SELECT am.employee_id, am.id,
                   CAST(ROW_NUMBER() OVER (PARTITION BY am.employee_id ORDER BY am.due_date) AS INTEGER) as review_number,
                   am.due_date, am.completed_date,
                   am.conducted_by_id, am.notes,
                   c.first_name || ' ' || c.last_name as conducted_by_name
            FROM appraisal_milestones am
            LEFT JOIN employees c ON c.id = am.conducted_by_id
            ORDER BY am.employee_id, am.due_date ASC", conn);

        var milestonesByEmployee = new Dictionary<Guid, List<AppraisalCellData>>();
        await using (var reader = await milCmd.ExecuteReaderAsync())
        {
            while (await reader.ReadAsync())
            {
                var empId = reader.GetGuid("employee_id");
                var dueDate = reader.GetDateOnly("due_date");
                var completedDate = reader.GetDateOnlyOrNull("completed_date");

                if (!milestonesByEmployee.ContainsKey(empId))
                    milestonesByEmployee[empId] = new List<AppraisalCellData>();

                milestonesByEmployee[empId].Add(new AppraisalCellData
                {
                    Id = reader.GetGuid("id"),
                    ReviewNumber = reader.GetInt32("review_number"),
                    DueDate = dueDate,
                    CompletedDate = completedDate,
                    ConductedById = reader.GetGuidOrNull("conducted_by_id"),
                    ConductedByName = reader.GetStringOrNull("conducted_by_name"),
                    Notes = reader.GetStringOrNull("notes"),
                    Status = CalculateStatus(dueDate, completedDate),
                    DaysUntilDue = CalculateDaysUntilDue(dueDate, completedDate)
                });
            }
        }

        var results = new List<AppraisalMatrixRow>();

        foreach (var emp in employees)
        {
            var allMilestones = milestonesByEmployee.GetValueOrDefault(emp.Id, new List<AppraisalCellData>());
            var completed = allMilestones.Where(m => m.CompletedDate.HasValue).OrderByDescending(m => m.DueDate).ToList();
            var pending = allMilestones.Where(m => !m.CompletedDate.HasValue).OrderBy(m => m.DueDate).ToList();

            // Last N completed (ascending order), pad left with nulls for grey empty cells
            var backList = completed.Take(reviewsBack).Reverse().ToList();
            var reviews = new List<AppraisalCellData?>();
            for (var p = 0; p < reviewsBack - backList.Count; p++)
                reviews.Add(null);
            reviews.AddRange(backList);

            // Forward: next N pending from DB only, pad with nulls if fewer
            var forwardReviews = pending.Take(reviewsForward).ToList();
            reviews.AddRange(forwardReviews);
            for (var p = forwardReviews.Count; p < reviewsForward; p++)
                reviews.Add(null);

            results.Add(new AppraisalMatrixRow
            {
                EmployeeId = emp.Id,
                FirstName = emp.FirstName,
                LastName = emp.LastName,
                Role = emp.Role,
                Department = emp.Department,
                EmployeeStatus = emp.EmployeeStatus,
                StartDate = emp.StartDate,
                AppraisalFrequencyMonths = emp.FrequencyMonths,
                Reviews = reviews
            });
        }

        return results;
    }

    public async Task<AppraisalResponse> CreateAsync(CreateAppraisalRequest request, Guid userId)
    {
        await using var conn = await _db.GetConnectionAsync();

        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO appraisal_milestones (employee_id, due_date, completed_date, conducted_by_id, notes)
            VALUES (@employeeId, @dueDate, @completedDate, @conductedById, @notes)
            RETURNING id, created_at, updated_at", conn);

        cmd.Parameters.AddWithValue("employeeId", request.EmployeeId);
        cmd.Parameters.AddWithValue("dueDate", request.DueDate.ToDateTime(TimeOnly.MinValue));
        cmd.Parameters.AddWithValue("completedDate", request.CompletedDate.HasValue ? request.CompletedDate.Value.ToDateTime(TimeOnly.MinValue) : DBNull.Value);
        cmd.Parameters.AddWithValue("conductedById", request.ConductedById.HasValue ? request.ConductedById.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("notes", (object?)request.Notes ?? DBNull.Value);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();
        var id = reader.GetGuid("id");
        var createdAt = reader.GetDateTime("created_at");
        var updatedAt = reader.GetDateTime("updated_at");
        await reader.CloseAsync();

        // Calculate review number from chronological position
        await using var rnCmd = new NpgsqlCommand(@"
            SELECT CAST(COUNT(*) AS INTEGER) FROM appraisal_milestones
            WHERE employee_id = @employeeId AND due_date <= @dueDate", conn);
        rnCmd.Parameters.AddWithValue("employeeId", request.EmployeeId);
        rnCmd.Parameters.AddWithValue("dueDate", request.DueDate.ToDateTime(TimeOnly.MinValue));
        var reviewNumber = (int)(await rnCmd.ExecuteScalarAsync())!;

        // Get employee and conductor names
        await using var nameCmd = new NpgsqlCommand(@"
            SELECT e.first_name || ' ' || e.last_name as employee_name,
                   COALESCE((SELECT first_name || ' ' || last_name FROM employees WHERE id = @conductedById), NULL) as conducted_by_name
            FROM employees e
            WHERE e.id = @employeeId", conn);
        nameCmd.Parameters.AddWithValue("employeeId", request.EmployeeId);
        nameCmd.Parameters.AddWithValue("conductedById", request.ConductedById.HasValue ? request.ConductedById.Value : DBNull.Value);

        await using var nameReader = await nameCmd.ExecuteReaderAsync();
        await nameReader.ReadAsync();
        var employeeName = nameReader.GetString("employee_name");
        var conductedByName = nameReader.GetStringOrNull("conducted_by_name");
        await nameReader.CloseAsync();

        await _audit.LogAsync("appraisal_milestones", id, "INSERT", userId, null, new { request.EmployeeId, request.DueDate, request.CompletedDate, request.ConductedById, request.Notes });

        return new AppraisalResponse
        {
            Id = id,
            EmployeeId = request.EmployeeId,
            EmployeeName = employeeName,
            ReviewNumber = reviewNumber,
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

        var updates = new List<string> { "updated_at = NOW()" };
        var cmd = new NpgsqlCommand { Connection = conn };

        if (request.DueDate.HasValue)
        {
            updates.Add("due_date = @dueDate");
            cmd.Parameters.AddWithValue("dueDate", request.DueDate.Value.ToDateTime(TimeOnly.MinValue));
        }
        if (request.ClearCompleted)
        {
            updates.Add("completed_date = NULL");
            updates.Add("conducted_by_id = NULL");
        }
        else
        {
            if (request.CompletedDate.HasValue)
            {
                updates.Add("completed_date = @completedDate");
                cmd.Parameters.AddWithValue("completedDate", request.CompletedDate.Value.ToDateTime(TimeOnly.MinValue));
            }
            if (request.ConductedById.HasValue)
            {
                updates.Add("conducted_by_id = @conductedById");
                cmd.Parameters.AddWithValue("conductedById", request.ConductedById.Value);
            }
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
            RETURNING employee_id, due_date, completed_date, conducted_by_id, notes, created_at, updated_at";
        cmd.Parameters.AddWithValue("id", id);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
            return null;

        var employeeId = reader.GetGuid("employee_id");
        var dueDate = reader.GetDateOnly("due_date");
        var completedDate = reader.GetDateOnlyOrNull("completed_date");
        var conductedById = reader.GetGuidOrNull("conducted_by_id");
        var notes = reader.GetStringOrNull("notes");
        var createdAt = reader.GetDateTime("created_at");
        var updatedAt = reader.GetDateTime("updated_at");
        await reader.CloseAsync();

        // Calculate review number from chronological position
        await using var rnCmd = new NpgsqlCommand(@"
            SELECT CAST(COUNT(*) AS INTEGER) FROM appraisal_milestones
            WHERE employee_id = @empId AND due_date <= @dueDateVal", conn);
        rnCmd.Parameters.AddWithValue("empId", employeeId);
        rnCmd.Parameters.AddWithValue("dueDateVal", dueDate.ToDateTime(TimeOnly.MinValue));
        var reviewNumber = (int)(await rnCmd.ExecuteScalarAsync())!;

        // Get names
        await using var nameCmd = new NpgsqlCommand(@"
            SELECT e.first_name || ' ' || e.last_name as employee_name,
                   COALESCE((SELECT first_name || ' ' || last_name FROM employees WHERE id = @conductedById), NULL) as conducted_by_name
            FROM employees e
            WHERE e.id = @employeeId", conn);
        nameCmd.Parameters.AddWithValue("employeeId", employeeId);
        nameCmd.Parameters.AddWithValue("conductedById", conductedById.HasValue ? conductedById.Value : DBNull.Value);

        await using var nameReader = await nameCmd.ExecuteReaderAsync();
        await nameReader.ReadAsync();
        var employeeName = nameReader.GetString("employee_name");
        var conductedByName = nameReader.GetStringOrNull("conducted_by_name");
        await nameReader.CloseAsync();

        await _audit.LogAsync("appraisal_milestones", id, "UPDATE", userId, null, new { request.DueDate, request.CompletedDate, request.ConductedById, request.Notes });

        return new AppraisalResponse
        {
            Id = id,
            EmployeeId = employeeId,
            EmployeeName = employeeName,
            ReviewNumber = reviewNumber,
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

        // Get employee start date and frequency
        await using var empCmd = new NpgsqlCommand(
            "SELECT start_date, appraisal_frequency_months FROM employees WHERE id = @employeeId", conn);
        empCmd.Parameters.AddWithValue("employeeId", employeeId);

        await using var empReader = await empCmd.ExecuteReaderAsync();
        if (!await empReader.ReadAsync())
            throw new KeyNotFoundException("Employee not found");

        var startDate = empReader.GetDateOnly("start_date");
        var frequencyMonths = empReader.GetInt32("appraisal_frequency_months");
        await empReader.CloseAsync();

        // Count existing milestones to determine next due dates
        await using var countCmd = new NpgsqlCommand(
            "SELECT COUNT(*) FROM appraisal_milestones WHERE employee_id = @employeeId", conn);
        countCmd.Parameters.AddWithValue("employeeId", employeeId);
        var existingCount = (int)(long)(await countCmd.ExecuteScalarAsync())!;

        // Generate next 3 milestones beyond what exists
        var created = new List<AppraisalResponse>();
        for (var i = 1; i <= 3; i++)
        {
            var reviewIndex = existingCount + i;
            var dueDate = startDate.AddMonths(frequencyMonths * reviewIndex);

            try
            {
                var appraisal = await CreateAsync(new CreateAppraisalRequest
                {
                    EmployeeId = employeeId,
                    DueDate = dueDate
                }, userId);
                created.Add(appraisal);
            }
            catch (Npgsql.PostgresException ex) when (ex.SqlState == "23505")
            {
                // Appraisal already exists on this date, skip
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
            var dueDate = reader.GetDateOnly("due_date");
            var completedDate = reader.GetDateOnlyOrNull("completed_date");
            var reviewNumber = reader.GetInt32("review_number");

            results.Add(new AppraisalResponse
            {
                Id = reader.GetGuid("id"),
                EmployeeId = reader.GetGuid("employee_id"),
                ReviewNumber = reviewNumber,
                DueDate = dueDate,
                CompletedDate = completedDate,
                ConductedById = reader.GetGuidOrNull("conducted_by_id"),
                Notes = reader.GetStringOrNull("notes"),
                CreatedAt = reader.GetDateTime("created_at"),
                UpdatedAt = reader.GetDateTime("updated_at"),
                EmployeeName = reader.GetString("employee_name"),
                ConductedByName = reader.GetStringOrNull("conducted_by_name"),
                Status = CalculateStatus(dueDate, completedDate),
                DaysUntilDue = CalculateDaysUntilDue(dueDate, completedDate)
            });
        }

        return results;
    }
}
