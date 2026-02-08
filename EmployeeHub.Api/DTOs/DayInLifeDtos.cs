using System.ComponentModel.DataAnnotations;

namespace EmployeeHub.Api.DTOs;

public class ChatMessageDto
{
    [Required]
    public string Role { get; set; } = string.Empty; // "user" or "assistant"

    [Required]
    public string Content { get; set; } = string.Empty;
}

public class ChatRequest
{
    [Required]
    public List<ChatMessageDto> Messages { get; set; } = new();

    public string? ChildName { get; set; }
}
