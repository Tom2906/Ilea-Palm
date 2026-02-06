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

    public AppraisalsController(IAppraisalService appraisalService)
    {
        _appraisalService = appraisalService;
    }

    /// <summary>
    /// Get all appraisal milestones (for matrix view)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        if (User.GetUserId() == null) return Unauthorized();

        var appraisals = await _appraisalService.GetAllAsync();
        return Ok(appraisals);
    }

    /// <summary>
    /// Get appraisal matrix data (employees with their milestones)
    /// </summary>
    [HttpGet("matrix")]
    public async Task<IActionResult> GetMatrix()
    {
        if (User.GetUserId() == null) return Unauthorized();

        var matrix = await _appraisalService.GetMatrixAsync();
        return Ok(matrix);
    }

    /// <summary>
    /// Get appraisal summary statistics
    /// </summary>
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        if (User.GetUserId() == null) return Unauthorized();

        var summary = await _appraisalService.GetSummaryAsync();
        return Ok(summary);
    }

    /// <summary>
    /// Get appraisal milestones for a specific employee
    /// </summary>
    [HttpGet("employee/{employeeId:guid}")]
    public async Task<IActionResult> GetByEmployee(Guid employeeId)
    {
        if (User.GetUserId() == null) return Unauthorized();

        var appraisals = await _appraisalService.GetByEmployeeAsync(employeeId);
        return Ok(appraisals);
    }

    /// <summary>
    /// Create a new appraisal milestone
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAppraisalRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("appraisals.manage")) return StatusCode(403);

        try
        {
            var appraisal = await _appraisalService.CreateAsync(request, userId.Value);
            return CreatedAtAction(nameof(GetByEmployee), new { employeeId = appraisal.EmployeeId }, appraisal);
        }
        catch (Npgsql.PostgresException ex) when (ex.SqlState == "23505")
        {
            return Conflict(new { message = "This milestone already exists for this employee" });
        }
    }

    /// <summary>
    /// Generate all appraisal milestones for an employee based on their start date
    /// </summary>
    [HttpPost("generate/{employeeId:guid}")]
    public async Task<IActionResult> GenerateMilestones(Guid employeeId)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("appraisals.manage")) return StatusCode(403);

        try
        {
            var created = await _appraisalService.GenerateMilestonesForEmployeeAsync(employeeId, userId.Value);
            return Ok(new { message = $"Generated {created.Count} new milestones", milestones = created });
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Update an appraisal milestone (e.g., mark as complete)
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAppraisalRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("appraisals.manage")) return StatusCode(403);

        var appraisal = await _appraisalService.UpdateAsync(id, request, userId.Value);
        if (appraisal == null) return NotFound();

        return Ok(appraisal);
    }

    /// <summary>
    /// Delete an appraisal milestone
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("appraisals.manage")) return StatusCode(403);

        var success = await _appraisalService.DeleteAsync(id, userId.Value);
        if (!success) return NotFound();

        return Ok(new { message = "Appraisal milestone deleted" });
    }
}
