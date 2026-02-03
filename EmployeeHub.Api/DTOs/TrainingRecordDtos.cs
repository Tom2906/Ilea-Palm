using System.ComponentModel.DataAnnotations;

namespace EmployeeHub.Api.DTOs;

public class CreateTrainingRecordRequest
{
    [Required]
    public Guid EmployeeId { get; set; }

    [Required]
    public Guid CourseId { get; set; }

    [Required]
    public DateOnly CompletionDate { get; set; }

    public string? CertificateUrl { get; set; }
    public string? Notes { get; set; }
}

public class TrainingRecordResponse
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public string? EmployeeName { get; set; }
    public Guid CourseId { get; set; }
    public string? CourseName { get; set; }
    public DateOnly CompletionDate { get; set; }
    public DateOnly? ExpiryDate { get; set; }
    public string? CertificateUrl { get; set; }
    public string? Notes { get; set; }
    public Guid RecordedBy { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class TrainingStatusResponse
{
    public Guid EmployeeId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Department { get; set; }
    public Guid CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int? ValidityMonths { get; set; }
    public Guid? TrainingRecordId { get; set; }
    public DateOnly? CompletionDate { get; set; }
    public DateOnly? ExpiryDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? DaysUntilExpiry { get; set; }
}
