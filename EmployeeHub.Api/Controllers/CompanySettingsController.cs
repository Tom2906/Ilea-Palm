using Microsoft.AspNetCore.Mvc;
using EmployeeHub.Api.Middleware;
using EmployeeHub.Api.Services;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CompanySettingsController : ControllerBase
{
    private readonly ICompanySettingsService _service;

    public CompanySettingsController(ICompanySettingsService service)
    {
        _service = service;
    }

    [RequirePermission]
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var settings = await _service.GetAsync();

        // Never send API keys to the browser
        settings.AiApiKey = null;
        settings.AnthropicApiKey = null;
        settings.OpenaiApiKey = null;
        settings.GeminiApiKey = null;

        return Ok(settings);
    }

    [RequirePermission("settings.manage")]
    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateCompanySettingsRequest request)
    {
        var userId = User.GetUserId()!.Value;

        var settings = await _service.UpdateAsync(request, userId);

        // Never send API keys to the browser
        settings.AiApiKey = null;
        settings.AnthropicApiKey = null;
        settings.OpenaiApiKey = null;
        settings.GeminiApiKey = null;

        return Ok(settings);
    }
}
