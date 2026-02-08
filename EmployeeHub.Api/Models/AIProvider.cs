namespace EmployeeHub.Api.Models;

public class AIProvider
{
    public Guid Id { get; set; }
    public string Provider { get; set; } = string.Empty; // anthropic, openai, gemini
    public string Name { get; set; } = string.Empty; // User-friendly name
    public string ApiKey { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
