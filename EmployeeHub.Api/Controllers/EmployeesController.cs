using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Middleware;
using EmployeeHub.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/employees")]
public class EmployeesController : ControllerBase
{
    private readonly IEmployeeService _employeeService;
    private readonly IOnboardingService _onboardingService;

    public EmployeesController(IEmployeeService employeeService, IOnboardingService onboardingService)
    {
        _employeeService = employeeService;
        _onboardingService = onboardingService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool includeInactive = false)
    {
        if (User.GetUserId() == null) return Unauthorized();

        var employees = await _employeeService.GetAllAsync(includeInactive);
        var response = employees.Select(e => MapToResponse(e));
        return Ok(response);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        if (User.GetUserId() == null) return Unauthorized();

        var employee = await _employeeService.GetByIdAsync(id);
        if (employee == null) return NotFound();

        return Ok(MapToResponse(employee));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEmployeeRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.IsAdmin()) return Forbid();

        var employee = await _employeeService.CreateAsync(request, userId.Value);

        // Auto-create onboarding records for new employee
        await _onboardingService.CreateRecordsForNewEmployeeAsync(employee.Id, userId.Value);

        return CreatedAtAction(nameof(GetById), new { id = employee.Id }, MapToResponse(employee));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEmployeeRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.IsAdmin()) return Forbid();

        var employee = await _employeeService.UpdateAsync(id, request, userId.Value);
        if (employee == null) return NotFound();

        return Ok(MapToResponse(employee));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.IsAdmin()) return Forbid();

        var success = await _employeeService.SoftDeleteAsync(id, userId.Value);
        if (!success) return NotFound();

        return Ok(new { message = "Employee deactivated" });
    }

    private static EmployeeResponse MapToResponse(Models.Employee e) => new()
    {
        Id = e.Id,
        Email = e.Email,
        FirstName = e.FirstName,
        LastName = e.LastName,
        Department = e.Department,
        Role = e.Role,
        StartDate = e.StartDate,
        Active = e.Active,
        StatusId = e.StatusId,
        StatusName = e.StatusName,
        Notes = e.Notes,
        CreatedAt = e.CreatedAt,
        UpdatedAt = e.UpdatedAt
    };
}
