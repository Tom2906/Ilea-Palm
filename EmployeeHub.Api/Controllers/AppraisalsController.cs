using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Middleware;
using EmployeeHub.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/appraisals")]
public class AppraisalsController : ControllerBase
{
    private readonly IAppraisalService _appraisalService;
    private readonly ICompanySettingsService _settingsService;

    public AppraisalsController(IAppraisalService appraisalService, ICompanySettingsService settingsService)
    {
        _appraisalService = appraisalService;
        _settingsService = settingsService;
    }

    [HttpGet("matrix")]
    public async Task<IActionResult> GetMatrix()
    {
        if (User.GetUserId() == null) return Unauthorized();
        if (!User.HasPermission("appraisals.view")) return StatusCode(403);

        var settings = await _settingsService.GetAsync();
        var rows = await _appraisalService.GetMatrixAsync(settings.AppraisalReviewsBack, settings.AppraisalReviewsForward);
        return Ok(new { reviewsBack = settings.AppraisalReviewsBack, rows });
    }

    [HttpGet("employee/{employeeId:guid}")]
    public async Task<IActionResult> GetByEmployee(Guid employeeId)
    {
        if (User.GetUserId() == null) return Unauthorized();
        if (!User.HasPermission("appraisals.view")) return StatusCode(403);

        var appraisals = await _appraisalService.GetByEmployeeAsync(employeeId);
        return Ok(appraisals);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAppraisalRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("appraisals.add")) return StatusCode(403);

        try
        {
            var appraisal = await _appraisalService.CreateAsync(request, userId.Value);
            return CreatedAtAction(nameof(GetByEmployee), new { employeeId = appraisal.EmployeeId }, appraisal);
        }
        catch (Npgsql.PostgresException ex) when (ex.SqlState == "23505")
        {
            return Conflict(new { message = "An appraisal already exists for this employee on this date" });
        }
    }

    [HttpPost("generate/{employeeId:guid}")]
    public async Task<IActionResult> GenerateMilestones(Guid employeeId)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("appraisals.add")) return StatusCode(403);

        try
        {
            var created = await _appraisalService.GenerateMilestonesForEmployeeAsync(employeeId, userId.Value);
            return Ok(new { message = $"Generated {created.Count} new reviews", milestones = created });
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAppraisalRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("appraisals.edit")) return StatusCode(403);

        var appraisal = await _appraisalService.UpdateAsync(id, request, userId.Value);
        if (appraisal == null) return NotFound();

        return Ok(appraisal);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("appraisals.delete")) return StatusCode(403);

        var success = await _appraisalService.DeleteAsync(id, userId.Value);
        if (!success) return NotFound();

        return Ok(new { message = "Appraisal review deleted" });
    }
}
