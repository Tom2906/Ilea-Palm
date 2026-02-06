using EmployeeHub.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/seed")]
public class SeedController : ControllerBase
{
    private readonly IDbService _db;

    public SeedController(IDbService db)
    {
        _db = db;
    }

    /// <summary>
    /// Creates the initial admin user. Only works if no users exist.
    /// </summary>
    [HttpPost("admin")]
    public async Task<IActionResult> SeedAdmin()
    {
        await using var conn = await _db.GetConnectionAsync();

        // Check if any users exist
        await using var checkCmd = new NpgsqlCommand("SELECT COUNT(*) FROM users", conn);
        var count = (long)(await checkCmd.ExecuteScalarAsync())!;
        if (count > 0)
            return BadRequest(new { error = "Users already exist. Seed is only for initial setup." });

        // Create admin user with default password (must be changed on first login)
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!");

        // Get Administrator role ID
        await using var roleCmd = new NpgsqlCommand(
            "SELECT id FROM roles WHERE name = 'Administrator'", conn);
        var roleId = await roleCmd.ExecuteScalarAsync() as Guid?;
        if (roleId == null)
            return BadRequest(new { error = "Administrator role not found. Run the permissions migration first." });

        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO users (email, password_hash, display_name, role_id)
            VALUES (@email, @hash, @name, @roleId)
            RETURNING id, email, display_name", conn);
        cmd.Parameters.AddWithValue("email", "admin@ileapalm.co.uk");
        cmd.Parameters.AddWithValue("hash", passwordHash);
        cmd.Parameters.AddWithValue("name", "Admin");
        cmd.Parameters.AddWithValue("roleId", roleId.Value);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();

        return Ok(new
        {
            message = "Admin user created. Change the password after first login.",
            email = reader.GetString(1),
            defaultPassword = "Admin123!",
            id = reader.GetGuid(0)
        });
    }

    /// <summary>
    /// Seeds training courses and onboarding items. Only works if no courses exist.
    /// </summary>
    [HttpPost("data")]
    public async Task<IActionResult> SeedData()
    {
        await using var conn = await _db.GetConnectionAsync();

        await using var checkCmd = new NpgsqlCommand("SELECT COUNT(*) FROM training_courses", conn);
        var count = (long)(await checkCmd.ExecuteScalarAsync())!;
        if (count > 0)
            return BadRequest(new { error = "Training courses already exist. Seed is only for initial setup." });

        // Online Mandatory
        var onlineMandatory = new (string Name, int? Months)[]
        {
            ("Anti-Bullying", 36), ("CSE", 36), ("COSHH", 36), ("Covid 19", null),
            ("Equality & Diversity", 36), ("FGM", 36), ("Fire Safety", 12),
            ("First Aid Paediatric", 36), ("Emergency First Aid L2", 36),
            ("Food Safety & Hygiene (Advanced)", 36), ("GDPR", 36), ("GDPR - Office", 36),
            ("Health & Nutrition", 36), ("Health & Safety (Advanced)", 12),
            ("Infection Control", 36), ("Internet Safety", 36), ("Manual Handling", 36),
            ("Medication (Advanced)", 12), ("Psychological First Aid", 36),
            ("Radicalisation & Extremism", 36), ("Reporting & Recording", 36),
            ("Risk Management", 36), ("Self-Harm", 36), ("Safeguarding Level 2/3/4", 12)
        };

        var f2fMandatory = new (string Name, int? Months)[]
        {
            ("PRICE (Physical Intervention)", 12), ("Emergency First Aid at Work", 36),
            ("Fire Warden", 36), ("Introduction to PACE", null), ("IOSH", null)
        };

        var additional = new (string Name, int? Months)[]
        {
            ("Distressed Behaviours", null), ("Compassion Fatigue", null),
            ("Workshops - Reporting & Recording (Occurrences, PIs, MFC)", null),
            ("Workshops - Behaviour Management", null), ("ADHD Training", null),
            ("Childhood Development", null), ("Trauma and Attachment", null),
            ("Reflective Supervision", null), ("Self Harm (Additional)", null)
        };

        int courseCount = 0;
        foreach (var (name, months) in onlineMandatory)
        {
            await InsertCourse(conn, name, "Online Mandatory", months);
            courseCount++;
        }
        foreach (var (name, months) in f2fMandatory)
        {
            await InsertCourse(conn, name, "F2F Mandatory", months);
            courseCount++;
        }
        foreach (var (name, months) in additional)
        {
            await InsertCourse(conn, name, "Additional", months);
            courseCount++;
        }

        // Onboarding items
        var onboardingItems = new[]
        {
            "Job Application (gaps explained)", "Interview Questions", "ID Photo",
            "Contract", "Training Contract", "Employee Handbook",
            "Job Description & Person Spec", "GDPR Consent", "Emergency Contact Details",
            "Induction Booklet", "Personal Information", "Observation Day Checklist"
        };

        for (int i = 0; i < onboardingItems.Length; i++)
        {
            await using var itemCmd = new NpgsqlCommand(@"
                INSERT INTO onboarding_items (name, display_order) VALUES (@name, @order)", conn);
            itemCmd.Parameters.AddWithValue("name", onboardingItems[i]);
            itemCmd.Parameters.AddWithValue("order", i + 1);
            await itemCmd.ExecuteNonQueryAsync();
        }

        return Ok(new
        {
            message = "Seed data created.",
            coursesCreated = courseCount,
            onboardingItemsCreated = onboardingItems.Length
        });
    }

    private static async Task InsertCourse(NpgsqlConnection conn, string name, string category, int? validityMonths)
    {
        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO training_courses (name, category, validity_months, notification_days_before)
            VALUES (@name, @category, @months, 30)", conn);
        cmd.Parameters.AddWithValue("name", name);
        cmd.Parameters.AddWithValue("category", category);
        cmd.Parameters.AddWithValue("months", validityMonths.HasValue ? validityMonths.Value : DBNull.Value);
        await cmd.ExecuteNonQueryAsync();
    }
}
