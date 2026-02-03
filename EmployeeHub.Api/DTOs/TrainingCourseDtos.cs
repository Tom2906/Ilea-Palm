using System.ComponentModel.DataAnnotations;

namespace EmployeeHub.Api.DTOs;

public class CreateTrainingCourseRequest
{
    [Required]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required]
    public string Category { get; set; } = string.Empty;

    public int? ValidityMonths { get; set; }
    public int NotificationDaysBefore { get; set; } = 30;
    public bool NotifyEmployee { get; set; } = true;
    public bool NotifyAdmin { get; set; } = true;
    public string[]? MandatoryForRoles { get; set; }
}

public class UpdateTrainingCourseRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public int? ValidityMonths { get; set; }
    public int? NotificationDaysBefore { get; set; }
    public bool? NotifyEmployee { get; set; }
    public bool? NotifyAdmin { get; set; }
    public string[]? MandatoryForRoles { get; set; }
}

public class TrainingCourseResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = string.Empty;
    public int? ValidityMonths { get; set; }
    public int NotificationDaysBefore { get; set; }
    public bool NotifyEmployee { get; set; }
    public bool NotifyAdmin { get; set; }
    public string[]? MandatoryForRoles { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
