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

    [RequirePermission("employees.view")]
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool includeInactive = false)
    {

        var employees = await _employeeService.GetAllAsync(includeInactive);
        var response = employees.Select(e => MapToResponse(e));
        return Ok(response);
    }

    [RequirePermission]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        if (!User.HasPermission("employees.view") && User.GetEmployeeId() != id)
            return StatusCode(403);

        var employee = await _employeeService.GetByIdAsync(id);
        if (employee == null) return NotFound();

        return Ok(MapToResponse(employee));
    }

    [RequirePermission]
    [HttpGet("roles")]
    public async Task<IActionResult> GetDistinctRoles()
    {
        var roles = await _employeeService.GetDistinctRolesAsync();
        return Ok(roles);
    }

    [RequirePermission("employees.add")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEmployeeRequest request)
    {
        var userId = User.GetUserId()!.Value;

        var employee = await _employeeService.CreateAsync(request, userId);

        // Auto-create onboarding records for new employee
        await _onboardingService.CreateRecordsForNewEmployeeAsync(employee.Id, userId);

        return CreatedAtAction(nameof(GetById), new { id = employee.Id }, MapToResponse(employee));
    }

    [RequirePermission("employees.edit")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEmployeeRequest request)
    {
        var userId = User.GetUserId()!.Value;

        var employee = await _employeeService.UpdateAsync(id, request, userId);
        if (employee == null) return NotFound();

        return Ok(MapToResponse(employee));
    }

    [RequirePermission("employees.delete")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.GetUserId()!.Value;

        var success = await _employeeService.SoftDeleteAsync(id, userId);
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
