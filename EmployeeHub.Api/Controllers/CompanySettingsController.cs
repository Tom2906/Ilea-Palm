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

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        if (User.GetUserId() == null) return Unauthorized();

        var settings = await _service.GetAsync();
        return Ok(settings);
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateCompanySettingsRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("settings.manage")) return StatusCode(403);

        var settings = await _service.UpdateAsync(request, userId.Value);
        return Ok(settings);
    }
}
