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

    [HttpGet("employee/{employeeId:guid}")]
    public async Task<IActionResult> GetByEmployee(Guid employeeId)
    {
        if (User.GetUserId() == null) return Unauthorized();

        var records = await _recordService.GetByEmployeeAsync(employeeId);
        return Ok(records);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTrainingRecordRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();

        var record = await _recordService.CreateAsync(request, userId.Value);
        return CreatedAtAction(nameof(GetByEmployee), new { employeeId = record.EmployeeId }, record);
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetTrainingStatus([FromQuery] string? category = null)
    {
        if (User.GetUserId() == null) return Unauthorized();

        var status = await _recordService.GetTrainingStatusAsync(category);
        return Ok(status);
    }

    [HttpGet("expiring")]
    public async Task<IActionResult> GetExpiring([FromQuery] int days = 30)
    {
        if (User.GetUserId() == null) return Unauthorized();

        var expiring = await _recordService.GetExpiringAsync(days);
        return Ok(expiring);
    }
}
