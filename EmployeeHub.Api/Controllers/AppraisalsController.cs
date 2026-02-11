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

    [RequirePermission("appraisals.view")]
    [HttpGet("matrix")]
    public async Task<IActionResult> GetMatrix()
    {

        var settings = await _settingsService.GetAsync();
        var rows = await _appraisalService.GetMatrixAsync(settings.AppraisalReviewsBack, settings.AppraisalReviewsForward);
        return Ok(new { reviewsBack = settings.AppraisalReviewsBack, rows });
    }

    [RequirePermission("appraisals.view")]
    [HttpGet("employee/{employeeId:guid}")]
    public async Task<IActionResult> GetByEmployee(Guid employeeId)
    {

        var appraisals = await _appraisalService.GetByEmployeeAsync(employeeId);
        return Ok(appraisals);
    }

    [RequirePermission("appraisals.add")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAppraisalRequest request)
    {
        var userId = User.GetUserId()!.Value;

        try
        {
            var appraisal = await _appraisalService.CreateAsync(request, userId);
            return CreatedAtAction(nameof(GetByEmployee), new { employeeId = appraisal.EmployeeId }, appraisal);
        }
        catch (Npgsql.PostgresException ex) when (ex.SqlState == "23505")
        {
            return Conflict(new { message = "An appraisal already exists for this employee on this date" });
        }
    }

    [RequirePermission("appraisals.add")]
    [HttpPost("generate/{employeeId:guid}")]
    public async Task<IActionResult> GenerateMilestones(Guid employeeId)
    {
        var userId = User.GetUserId()!.Value;

        var created = await _appraisalService.GenerateMilestonesForEmployeeAsync(employeeId, userId);
        return Ok(new { message = $"Generated {created.Count} new reviews", milestones = created });
    }

    [RequirePermission("appraisals.edit")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAppraisalRequest request)
    {
        var userId = User.GetUserId()!.Value;

        var appraisal = await _appraisalService.UpdateAsync(id, request, userId);
        if (appraisal == null) return NotFound();

        return Ok(appraisal);
    }

    [RequirePermission("appraisals.delete")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.GetUserId()!.Value;

        var success = await _appraisalService.DeleteAsync(id, userId);
        if (!success) return NotFound();

        return Ok(new { message = "Appraisal review deleted" });
    }
}
