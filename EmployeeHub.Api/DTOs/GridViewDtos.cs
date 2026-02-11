using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace EmployeeHub.Api.DTOs;

public class GridViewResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string GridType { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public JsonElement Config { get; set; }
    public bool IsDefault { get; set; }
    public bool IsCompanyDefault { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateGridViewRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string GridType { get; set; } = string.Empty;

    public JsonElement? Config { get; set; }
    public bool IsDefault { get; set; }
    public bool IsCompanyDefault { get; set; }
}

public class UpdateGridViewRequest
{
    [MaxLength(100)]
    public string? Name { get; set; }

    public JsonElement? Config { get; set; }
    public bool? IsDefault { get; set; }
    public bool? IsCompanyDefault { get; set; }
}
