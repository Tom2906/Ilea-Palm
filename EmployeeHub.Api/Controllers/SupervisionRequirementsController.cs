using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Middleware;
using EmployeeHub.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/supervision-requirements")]
public class SupervisionRequirementsController : ControllerBase
{
    private readonly ISupervisionRequirementService _service;

    public SupervisionRequirementsController(ISupervisionRequirementService service)
    {
        _service = service;
    }

    [RequirePermission("supervisions.view")]
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var requirements = await _service.GetAllAsync();
        return Ok(requirements);
    }

    [RequirePermission("supervisions.view")]
    [HttpGet("employee/{employeeId:guid}")]
    public async Task<IActionResult> GetByEmployee(Guid employeeId)
    {
        var requirements = await _service.GetByEmployeeAsync(employeeId);
        return Ok(requirements);
    }

    [RequirePermission("supervisions.view")]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var requirement = await _service.GetByIdAsync(id);
        if (requirement == null) return NotFound();
        return Ok(requirement);
    }

    [RequirePermission("supervisions.view")]
    [HttpGet("employee/{employeeId:guid}/month/{month}")]
    public async Task<IActionResult> GetRequirementForMonth(Guid employeeId, string month)
    {
        // month format: "YYYY-MM"
        if (!DateOnly.TryParse(month + "-01", out var date))
            return BadRequest("Invalid month format. Use YYYY-MM");

        var requirement = await _service.GetRequirementForMonthAsync(employeeId, date);
        return Ok(requirement);
    }

    [RequirePermission("supervisions.edit")]
    [HttpPost]
    public async Task<IActionResult> Create(CreateSupervisionRequirementRequest request)
    {

        var requirement = await _service.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = requirement.Id }, requirement);
    }

    [RequirePermission("supervisions.edit")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateSupervisionRequirementRequest request)
    {

        var requirement = await _service.UpdateAsync(id, request);
        if (requirement == null) return NotFound();
        return Ok(requirement);
    }

    [RequirePermission("supervisions.delete")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {

        var deleted = await _service.DeleteAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
