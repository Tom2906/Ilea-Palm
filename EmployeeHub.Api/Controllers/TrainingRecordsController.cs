using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Middleware;
using EmployeeHub.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/training-records")]
public class TrainingRecordsController : ControllerBase
{
    private readonly ITrainingRecordService _recordService;

    public TrainingRecordsController(ITrainingRecordService recordService)
    {
        _recordService = recordService;
    }

    [RequirePermission]
    [HttpGet("employee/{employeeId:guid}")]
    public async Task<IActionResult> GetByEmployee(Guid employeeId)
    {
        if (!User.HasPermission("training_matrix.view") && User.GetEmployeeId() != employeeId)
            return StatusCode(403);

        var records = await _recordService.GetByEmployeeAsync(employeeId);
        return Ok(records);
    }

    [RequirePermission]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTrainingRecordRequest request)
    {
        var userId = User.GetUserId()!.Value;

        // Self-service: users can record their own training
        var isOwnRecord = User.GetEmployeeId() == request.EmployeeId;
        if (!User.HasPermission("training_records.record") && !isOwnRecord)
            return StatusCode(403);

        var record = await _recordService.CreateAsync(request, userId);
        return CreatedAtAction(nameof(GetByEmployee), new { employeeId = record.EmployeeId }, record);
    }

    [RequirePermission]
    [HttpGet("status")]
    public async Task<IActionResult> GetTrainingStatus([FromQuery] string? category = null)
    {
        Guid? employeeFilter = null;
        if (!User.HasPermission("training_matrix.view"))
        {
            var myEmpId = User.GetEmployeeId();
            if (myEmpId == null) return StatusCode(403);
            employeeFilter = myEmpId;
        }

        var status = await _recordService.GetTrainingStatusAsync(category, employeeFilter);
        return Ok(status);
    }

    [RequirePermission("training_matrix.view")]
    [HttpGet("expiring")]
    public async Task<IActionResult> GetExpiring([FromQuery] int days = 30)
    {

        var expiring = await _recordService.GetExpiringAsync(days);
        return Ok(expiring);
    }
}
