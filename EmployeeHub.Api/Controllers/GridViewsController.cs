using Microsoft.AspNetCore.Mvc;
using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Middleware;
using EmployeeHub.Api.Services;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/gridviews")]
public class GridViewsController : ControllerBase
{
    private readonly IGridViewService _service;

    public GridViewsController(IGridViewService service)
    {
        _service = service;
    }

    [RequirePermission]
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string gridType)
    {
        if (string.IsNullOrWhiteSpace(gridType))
            return BadRequest(new { error = "gridType is required" });

        var userId = User.GetUserId()!.Value;
        var views = await _service.GetByUserAndGridAsync(userId, gridType);

        if (!User.HasPermission("gridviews.personal.manage"))
            views = views.Where(v => v.IsCompanyDefault).ToList();

        return Ok(views);
    }

    [RequirePermission]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateGridViewRequest request)
    {
        if (request.IsCompanyDefault)
        {
            if (!User.HasPermission("gridviews.manage"))
                return StatusCode(403);
        }
        else if (!User.HasPermission("gridviews.personal.manage"))
        {
            return StatusCode(403);
        }

        var userId = User.GetUserId()!.Value;
        var view = await _service.CreateAsync(request, userId);
        return Created($"/api/gridviews/{view.Id}", view);
    }

    [RequirePermission]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateGridViewRequest request)
    {
        var userId = User.GetUserId()!.Value;
        var existing = await _service.GetByIdAsync(id, userId);
        if (existing == null)
            return NotFound(new { error = "View not found" });

        var canManageCompany = User.HasPermission("gridviews.manage");
        var canManagePersonal = User.HasPermission("gridviews.personal.manage");

        if (existing.IsCompanyDefault)
        {
            if (!canManageCompany)
                return StatusCode(403);
        }
        else
        {
            if (!canManagePersonal)
                return StatusCode(403);
        }

        if (request.IsCompanyDefault == true && !canManageCompany)
            return StatusCode(403);

        var view = await _service.UpdateAsync(id, request, userId);
        return Ok(view);
    }

    [RequirePermission]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.GetUserId()!.Value;
        var existing = await _service.GetByIdAsync(id, userId);
        if (existing == null)
            return NotFound(new { error = "View not found" });

        if (existing.IsCompanyDefault)
        {
            if (!User.HasPermission("gridviews.manage"))
                return StatusCode(403);
        }
        else if (!User.HasPermission("gridviews.personal.manage"))
        {
            return StatusCode(403);
        }

        await _service.DeleteAsync(id, userId);
        return NoContent();
    }
}
