using EmployeeHub.Api.DTOs;
using MailKit.Net.Smtp;
using MimeKit;
using Npgsql;

namespace EmployeeHub.Api.Services;

public class NotificationService : INotificationService
{
    private readonly IDbService _db;
    private readonly IConfiguration _config;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(IDbService db, IConfiguration config, ILogger<NotificationService> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
    }

    public async Task<List<PendingNotificationResponse>> GetPendingAsync()
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            SELECT employee_id, first_name, last_name, email, course_id, course_name, category,
                   training_record_id, expiry_date, days_until_expiry, status,
                   notify_employee, notify_admin
            FROM training_status
            WHERE status IN ('Expiring Soon', 'Expired')
            ORDER BY expiry_date ASC NULLS LAST, last_name, first_name", conn);

        await using var reader = await cmd.ExecuteReaderAsync();
        var pending = new List<PendingNotificationResponse>();
        while (await reader.ReadAsync())
        {
            pending.Add(new PendingNotificationResponse
            {
                EmployeeId = reader.GetGuid(0),
                EmployeeName = $"{reader.GetString(1)} {reader.GetString(2)}",
                EmployeeEmail = reader.GetString(3),
                CourseId = reader.GetGuid(4),
                CourseName = reader.GetString(5),
                Category = reader.GetString(6),
                TrainingRecordId = reader.IsDBNull(7) ? null : reader.GetGuid(7),
                ExpiryDate = reader.IsDBNull(8) ? null : DateOnly.FromDateTime(reader.GetDateTime(8)),
                DaysUntilExpiry = reader.IsDBNull(9) ? null : reader.GetInt32(9),
                Status = reader.GetString(10),
                NotifyEmployee = reader.GetBoolean(11),
                NotifyAdmin = reader.GetBoolean(12)
            });
        }
        return pending;
    }

    public async Task<SendNotificationsResponse> SendNotificationsAsync(Guid userId)
    {
        var pending = await GetPendingAsync();
        var response = new SendNotificationsResponse();
        var smtpEnabled = _config.GetValue<bool>("Smtp:Enabled");

        // Get admin emails
        var adminEmails = await GetAdminEmailsAsync();

        foreach (var item in pending)
        {
            if (item.TrainingRecordId == null) continue;

            var notificationType = item.Status == "Expired" ? "expired" : "expiry_warning";

            // Send to employee if configured
            if (item.NotifyEmployee)
            {
                var alreadySent = await WasRecentlySentAsync(item.TrainingRecordId.Value, item.EmployeeEmail, notificationType);
                if (alreadySent)
                {
                    response.Skipped++;
                }
                else
                {
                    var subject = BuildSubject(item);
                    var body = BuildBody(item);
                    var sent = await TrySendEmailAsync(item.EmployeeEmail, subject, body, smtpEnabled);

                    if (sent)
                    {
                        await LogNotificationAsync(item, item.EmployeeEmail, "employee", notificationType);
                        response.EmailsSent++;
                    }
                    else
                    {
                        response.Errors.Add($"Failed to send to {item.EmployeeEmail}");
                    }
                }
            }

            // Send to admins if configured
            if (item.NotifyAdmin)
            {
                foreach (var adminEmail in adminEmails)
                {
                    var alreadySent = await WasRecentlySentAsync(item.TrainingRecordId.Value, adminEmail, notificationType);
                    if (alreadySent)
                    {
                        response.Skipped++;
                        continue;
                    }

                    var subject = BuildSubject(item);
                    var body = BuildBody(item);
                    var sent = await TrySendEmailAsync(adminEmail, subject, body, smtpEnabled);

                    if (sent)
                    {
                        await LogNotificationAsync(item, adminEmail, "admin", notificationType);
                        response.EmailsSent++;
                    }
                    else
                    {
                        response.Errors.Add($"Failed to send to {adminEmail}");
                    }
                }
            }
        }

        return response;
    }

    public async Task<List<NotificationLogResponse>> GetLogAsync(int limit = 100)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            SELECT nl.id, nl.training_record_id, nl.employee_id, nl.course_id,
                   nl.recipient_email, nl.recipient_type, nl.notification_type,
                   nl.sent_at, nl.days_until_expiry,
                   e.first_name || ' ' || e.last_name as employee_name,
                   tc.name as course_name
            FROM notification_log nl
            JOIN employees e ON e.id = nl.employee_id
            JOIN training_courses tc ON tc.id = nl.course_id
            ORDER BY nl.sent_at DESC
            LIMIT @limit", conn);
        cmd.Parameters.AddWithValue("limit", limit);

        await using var reader = await cmd.ExecuteReaderAsync();
        var logs = new List<NotificationLogResponse>();
        while (await reader.ReadAsync())
        {
            logs.Add(new NotificationLogResponse
            {
                Id = reader.GetGuid(0),
                TrainingRecordId = reader.GetGuid(1),
                EmployeeId = reader.GetGuid(2),
                CourseId = reader.GetGuid(3),
                RecipientEmail = reader.GetString(4),
                RecipientType = reader.GetString(5),
                NotificationType = reader.GetString(6),
                SentAt = reader.GetDateTime(7),
                DaysUntilExpiry = reader.IsDBNull(8) ? null : reader.GetInt32(8),
                EmployeeName = reader.GetString(9),
                CourseName = reader.GetString(10)
            });
        }
        return logs;
    }

    private async Task<List<string>> GetAdminEmailsAsync()
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(
            "SELECT email FROM users WHERE role = 'admin' AND active = true", conn);

        await using var reader = await cmd.ExecuteReaderAsync();
        var emails = new List<string>();
        while (await reader.ReadAsync())
            emails.Add(reader.GetString(0));
        return emails;
    }

    private async Task<bool> WasRecentlySentAsync(Guid trainingRecordId, string recipientEmail, string notificationType)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            SELECT COUNT(*) FROM notification_log
            WHERE training_record_id = @recordId
              AND recipient_email = @email
              AND notification_type = @type
              AND sent_at > NOW() - INTERVAL '7 days'", conn);

        cmd.Parameters.AddWithValue("recordId", trainingRecordId);
        cmd.Parameters.AddWithValue("email", recipientEmail);
        cmd.Parameters.AddWithValue("type", notificationType);

        var count = (long)(await cmd.ExecuteScalarAsync())!;
        return count > 0;
    }

    private async Task LogNotificationAsync(PendingNotificationResponse item, string recipientEmail, string recipientType, string notificationType)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO notification_log (training_record_id, employee_id, course_id, recipient_email, recipient_type, notification_type, days_until_expiry)
            VALUES (@recordId, @employeeId, @courseId, @email, @recipientType, @notificationType, @days)", conn);

        cmd.Parameters.AddWithValue("recordId", item.TrainingRecordId!.Value);
        cmd.Parameters.AddWithValue("employeeId", item.EmployeeId);
        cmd.Parameters.AddWithValue("courseId", item.CourseId);
        cmd.Parameters.AddWithValue("email", recipientEmail);
        cmd.Parameters.AddWithValue("recipientType", recipientType);
        cmd.Parameters.AddWithValue("notificationType", notificationType);
        cmd.Parameters.AddWithValue("days", item.DaysUntilExpiry.HasValue ? item.DaysUntilExpiry.Value : DBNull.Value);

        await cmd.ExecuteNonQueryAsync();
    }

    private async Task<bool> TrySendEmailAsync(string to, string subject, string body, bool smtpEnabled)
    {
        if (!smtpEnabled)
        {
            _logger.LogInformation("SMTP disabled — would send to {To}: {Subject}", to, subject);
            return true; // Log as sent even when SMTP is off (for testing)
        }

        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(
                _config["Smtp:FromName"] ?? "Employee Training Hub",
                _config["Smtp:FromAddress"] ?? "noreply@example.com"));
            message.To.Add(MailboxAddress.Parse(to));
            message.Subject = subject;
            message.Body = new TextPart("plain") { Text = body };

            using var client = new SmtpClient();
            await client.ConnectAsync(
                _config["Smtp:Host"] ?? "localhost",
                _config.GetValue<int>("Smtp:Port", 587),
                MailKit.Security.SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(
                _config["Smtp:Username"] ?? "",
                _config["Smtp:Password"] ?? "");
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To}", to);
            return false;
        }
    }

    private static string BuildSubject(PendingNotificationResponse item)
    {
        return item.Status == "Expired"
            ? $"EXPIRED: {item.EmployeeName} - {item.CourseName}"
            : $"Expiring Soon: {item.EmployeeName} - {item.CourseName}";
    }

    private static string BuildBody(PendingNotificationResponse item)
    {
        if (item.Status == "Expired")
        {
            return $"{item.EmployeeName}'s {item.CourseName} training expired on {item.ExpiryDate:dd/MM/yyyy}. Immediate action required.";
        }
        return $"{item.EmployeeName}'s {item.CourseName} training expires in {item.DaysUntilExpiry} days (on {item.ExpiryDate:dd/MM/yyyy}). Please arrange renewal.";
    }
}
