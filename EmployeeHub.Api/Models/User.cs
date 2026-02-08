namespace EmployeeHub.Api.Models;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? PasswordHash { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string AuthMethod { get; set; } = "password";
    public Guid RoleId { get; set; }
    public Guid? EmployeeId { get; set; }
    public bool Active { get; set; } = true;
    public DateTime? LastLogin { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Populated from join — not stored on users table
    public string RoleName { get; set; } = string.Empty;
    public Dictionary<string, string> Permissions { get; set; } = new();
}
