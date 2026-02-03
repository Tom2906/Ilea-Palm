using System.ComponentModel.DataAnnotations;

namespace EmployeeHub.Api.DTOs;

public class CreateEmployeeStatusRequest
{
    [Required]
    public string Name { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}

public class UpdateEmployeeStatusRequest
{
    public string? Name { get; set; }
    public int? DisplayOrder { get; set; }
    public bool? Active { get; set; }
}

public class EmployeeStatusResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool Active { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
