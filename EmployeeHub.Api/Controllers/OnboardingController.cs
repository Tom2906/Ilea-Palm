using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Middleware;
using EmployeeHub.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/onboarding")]
public class OnboardingController : ControllerBase
{
    private readonly IOnboardingService _onboardingService;

    public OnboardingController(IOnboardingService onboardingService)
    {
        _onboardingService = onboardingService;
    }

    [HttpGet("items")]
    public async Task<IActionResult> GetItems([FromQuery] bool includeInactive = false)
    {
        if (User.GetUserId() == null) return Unauthorized();

        var items = await _onboardingService.GetItemsAsync(includeInactive);
        var response = items.Select(i => new OnboardingItemResponse
        {
            Id = i.Id, Name = i.Name, Description = i.Description,
            DisplayOrder = i.DisplayOrder, Active = i.Active,
            CreatedAt = i.CreatedAt, UpdatedAt = i.UpdatedAt
        });
        return Ok(response);
    }

    [HttpPost("items")]
    public async Task<IActionResult> CreateItem([FromBody] CreateOnboardingItemRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.IsAdmin()) return Forbid();

        var item = await _onboardingService.CreateItemAsync(request, userId.Value);
        return CreatedAtAction(nameof(GetItems), null, new OnboardingItemResponse
        {
            Id = item.Id, Name = item.Name, Description = item.Description,
            DisplayOrder = item.DisplayOrder, Active = item.Active,
            CreatedAt = item.CreatedAt, UpdatedAt = item.UpdatedAt
        });
    }

    [HttpPut("items/{id:guid}")]
    public async Task<IActionResult> UpdateItem(Guid id, [FromBody] UpdateOnboardingItemRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.IsAdmin()) return Forbid();

        var item = await _onboardingService.UpdateItemAsync(id, request, userId.Value);
        if (item == null) return NotFound();

        return Ok(new OnboardingItemResponse
        {
            Id = item.Id, Name = item.Name, Description = item.Description,
            DisplayOrder = item.DisplayOrder, Active = item.Active,
            CreatedAt = item.CreatedAt, UpdatedAt = item.UpdatedAt
        });
    }

    [HttpDelete("items/{id:guid}")]
    public async Task<IActionResult> DeleteItem(Guid id)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.IsAdmin()) return Forbid();

        var success = await _onboardingService.DeleteItemAsync(id, userId.Value);
        if (!success) return NotFound();

        return Ok(new { message = "Onboarding item deactivated" });
    }

    [HttpGet("employee/{employeeId:guid}")]
    public async Task<IActionResult> GetEmployeeRecords(Guid employeeId)
    {
        if (User.GetUserId() == null) return Unauthorized();

        var records = await _onboardingService.GetEmployeeRecordsAsync(employeeId);
        return Ok(records);
    }

    [HttpPut("employee/{employeeId:guid}/{itemId:guid}")]
    public async Task<IActionResult> UpdateRecord(Guid employeeId, Guid itemId, [FromBody] UpdateOnboardingRecordRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var validStatuses = new[] { "pending", "complete", "not_required" };
        if (!validStatuses.Contains(request.Status))
            return BadRequest(new { error = "Status must be: pending, complete, or not_required" });

        var record = await _onboardingService.UpdateRecordAsync(employeeId, itemId, request, userId.Value);
        if (record == null) return NotFound();

        return Ok(record);
    }
}
