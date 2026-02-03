using System.ComponentModel.DataAnnotations;

namespace EmployeeHub.Api.DTOs;

public class CreateOnboardingItemRequest
{
    [Required]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
}

public class UpdateOnboardingItemRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public int? DisplayOrder { get; set; }
    public bool? Active { get; set; }
}

public class OnboardingItemResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public bool Active { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class OnboardingRecordResponse
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public Guid ItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string? ItemDescription { get; set; }
    public int DisplayOrder { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateOnly? CompletedDate { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpdateOnboardingRecordRequest
{
    [Required]
    public string Status { get; set; } = string.Empty;

    public string? Notes { get; set; }
}
