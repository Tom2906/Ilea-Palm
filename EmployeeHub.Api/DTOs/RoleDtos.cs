using System.ComponentModel.DataAnnotations;

namespace EmployeeHub.Api.DTOs;

public class RoleResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string DataScope { get; set; } = "own";
    public bool IsSystem { get; set; }
    public List<string> Permissions { get; set; } = new();
    public int UserCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateRoleRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    public string DataScope { get; set; } = "own";

    public List<string> Permissions { get; set; } = new();
}

public class UpdateRoleRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    public string DataScope { get; set; } = "own";

    public List<string> Permissions { get; set; } = new();
}
