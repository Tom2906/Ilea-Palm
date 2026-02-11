namespace EmployeeHub.Api.Models;

public class UserGridView
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string GridType { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Config { get; set; } = "{}";
    public bool IsDefault { get; set; }
    public bool IsCompanyDefault { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
