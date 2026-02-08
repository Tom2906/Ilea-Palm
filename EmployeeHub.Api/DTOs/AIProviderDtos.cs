namespace EmployeeHub.Api.DTOs;

public class AIProviderResponse
{
    public Guid Id { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    // Note: API key is NOT included in responses for security
}

public class CreateAIProviderRequest
{
    public string Provider { get; set; } = string.Empty; // anthropic, openai, gemini
    public string Name { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
}

public class UpdateAIProviderRequest
{
    public string? Name { get; set; }
    public string? ApiKey { get; set; }
    public bool? IsActive { get; set; }
}

public class AIModelResponse
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}
