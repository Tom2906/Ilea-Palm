using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Middleware;
using EmployeeHub.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/rota")]
public class RotaController : ControllerBase
{
    private readonly IRotaService _rotaService;

    public RotaController(IRotaService rotaService)
    {
        _rotaService = rotaService;
    }

    [RequirePermission]
    [HttpGet]
    public async Task<IActionResult> GetMonth([FromQuery] int year, [FromQuery] int month)
    {
        if (month < 1 || month > 12 || year < 2000 || year > 2100)
            return BadRequest(new { error = "Invalid year or month" });

        var result = await _rotaService.GetMonthAsync(year, month);

        // Self-service: users without rotas.view can only see their own shifts
        if (!User.HasPermission("rotas.view"))
        {
            var myEmpId = User.GetEmployeeId();
            if (myEmpId == null) return StatusCode(403);
            result.Staff = result.Staff.Where(s => s.EmployeeId == myEmpId).ToList();
        }

        return Ok(result);
    }

    [RequirePermission]
    [HttpGet("shift-types")]
    public async Task<IActionResult> GetShiftTypes()
    {
        var types = await _rotaService.GetShiftTypesAsync();
        var response = types.Select(st => new ShiftTypeResponse
        {
            Id = st.Id,
            Code = st.Code,
            Name = st.Name,
            DefaultHours = st.DefaultHours,
            IncludesSleep = st.IncludesSleep,
            DisplayColor = st.DisplayColor,
            SortOrder = st.SortOrder
        });
        return Ok(response);
    }

    [RequirePermission("rotas.add")]
    [HttpPost("shifts")]
    public async Task<IActionResult> CreateShift([FromBody] CreateShiftRequest request)
    {
        var userId = User.GetUserId()!.Value;

        var shift = await _rotaService.CreateShiftAsync(request, userId);
        if (shift == null) return BadRequest(new { error = "Failed to create shift" });

        return Ok(ToShiftResponse(shift));
    }

    [RequirePermission("rotas.edit")]
    [HttpPut("shifts/{id:guid}")]
    public async Task<IActionResult> UpdateShift(Guid id, [FromBody] UpdateShiftRequest request)
    {
        var userId = User.GetUserId()!.Value;

        var shift = await _rotaService.UpdateShiftAsync(id, request, userId);
        if (shift == null) return NotFound();

        return Ok(ToShiftResponse(shift));
    }

    [RequirePermission("rotas.delete")]
    [HttpDelete("shifts/{id:guid}")]
    public async Task<IActionResult> DeleteShift(Guid id)
    {
        var userId = User.GetUserId()!.Value;

        var success = await _rotaService.DeleteShiftAsync(id, userId);
        if (!success) return NotFound();

        return Ok(new { message = "Shift deleted" });
    }

    [RequirePermission]
    [HttpGet("monthly-hours")]
    public async Task<IActionResult> GetMonthlyHours([FromQuery] int year)
    {
        var hours = await _rotaService.GetMonthlyHoursAsync(year);
        var response = hours.Select(h => new MonthlyHoursResponse
        {
            Id = h.Id,
            Year = h.Year,
            Month = h.Month,
            ContractedHours = h.ContractedHours
        });
        return Ok(response);
    }

    [RequirePermission("rotas.edit")]
    [HttpPost("monthly-hours")]
    public async Task<IActionResult> SetMonthlyHours([FromBody] SetMonthlyHoursRequest request)
    {
        var userId = User.GetUserId()!.Value;

        if (request.Month < 1 || request.Month > 12 || request.Year < 2000 || request.Year > 2100)
            return BadRequest(new { error = "Invalid year or month" });

        var result = await _rotaService.SetMonthlyHoursAsync(request, userId);
        return Ok(new MonthlyHoursResponse
        {
            Id = result.Id,
            Year = result.Year,
            Month = result.Month,
            ContractedHours = result.ContractedHours
        });
    }

    // Map a Shift model to its API response
    private static ShiftResponse ToShiftResponse(Models.Shift shift) => new()
    {
        Id = shift.Id,
        EmployeeId = shift.EmployeeId,
        Date = shift.Date,
        ShiftTypeId = shift.ShiftTypeId,
        ShiftTypeCode = shift.ShiftTypeCode,
        Hours = shift.Hours ?? shift.DefaultHours,
        IncludesSleep = shift.IncludesSleep,
        DisplayColor = shift.DisplayColor,
        Notes = shift.Notes
    };
}
