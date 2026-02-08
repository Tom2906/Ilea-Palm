using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Middleware;
using EmployeeHub.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/ai-providers")]
public class AIProvidersController : ControllerBase
{
    private readonly IAIProviderService _providerService;

    public AIProvidersController(IAIProviderService providerService)
    {
        _providerService = providerService;
    }

    [HttpGet]
    public async Task<ActionResult<List<AIProviderResponse>>> GetAll()
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("settings.manage")) return StatusCode(403);

        var providers = await _providerService.GetAllAsync();

        // Map to response DTOs (excluding API keys)
        var response = providers.Select(p => new AIProviderResponse
        {
            Id = p.Id,
            Provider = p.Provider,
            Name = p.Name,
            IsActive = p.IsActive,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt
        }).ToList();

        return Ok(response);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AIProviderResponse>> GetById(Guid id)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("settings.manage")) return StatusCode(403);

        var provider = await _providerService.GetByIdAsync(id);
        if (provider == null) return NotFound();

        return Ok(new AIProviderResponse
        {
            Id = provider.Id,
            Provider = provider.Provider,
            Name = provider.Name,
            IsActive = provider.IsActive,
            CreatedAt = provider.CreatedAt,
            UpdatedAt = provider.UpdatedAt
        });
    }

    [HttpPost]
    public async Task<ActionResult<AIProviderResponse>> Create([FromBody] CreateAIProviderRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("settings.manage")) return StatusCode(403);

        var provider = await _providerService.CreateAsync(request, userId.Value);

        return CreatedAtAction(nameof(GetById), new { id = provider.Id }, new AIProviderResponse
        {
            Id = provider.Id,
            Provider = provider.Provider,
            Name = provider.Name,
            IsActive = provider.IsActive,
            CreatedAt = provider.CreatedAt,
            UpdatedAt = provider.UpdatedAt
        });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<AIProviderResponse>> Update(Guid id, [FromBody] UpdateAIProviderRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("settings.manage")) return StatusCode(403);

        var provider = await _providerService.UpdateAsync(id, request, userId.Value);

        return Ok(new AIProviderResponse
        {
            Id = provider.Id,
            Provider = provider.Provider,
            Name = provider.Name,
            IsActive = provider.IsActive,
            CreatedAt = provider.CreatedAt,
            UpdatedAt = provider.UpdatedAt
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("settings.manage")) return StatusCode(403);

        await _providerService.DeleteAsync(id, userId.Value);
        return NoContent();
    }

    [HttpGet("{id}/models")]
    public async Task<ActionResult<List<AIModelResponse>>> GetModels(Guid id)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("settings.manage")) return StatusCode(403);

        var models = await _providerService.GetAvailableModelsAsync(id);
        return Ok(models);
    }
}
