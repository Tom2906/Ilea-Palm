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

    [HttpGet]
    public async Task<IActionResult> GetMonth([FromQuery] int year, [FromQuery] int month)
    {
        if (User.GetUserId() == null) return Unauthorized();

        if (month < 1 || month > 12 || year < 2000 || year > 2100)
            return BadRequest(new { error = "Invalid year or month" });

        var result = await _rotaService.GetMonthAsync(year, month);
        return Ok(result);
    }

    [HttpGet("shift-types")]
    public async Task<IActionResult> GetShiftTypes()
    {
        if (User.GetUserId() == null) return Unauthorized();

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

    [HttpPost("shifts")]
    public async Task<IActionResult> CreateShift([FromBody] CreateShiftRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("rotas.edit")) return StatusCode(403);

        var shift = await _rotaService.CreateShiftAsync(request, userId.Value);
        if (shift == null) return BadRequest(new { error = "Failed to create shift" });

        return Ok(new ShiftResponse
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
        });
    }

    [HttpPut("shifts/{id:guid}")]
    public async Task<IActionResult> UpdateShift(Guid id, [FromBody] UpdateShiftRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("rotas.edit")) return StatusCode(403);

        var shift = await _rotaService.UpdateShiftAsync(id, request, userId.Value);
        if (shift == null) return NotFound();

        return Ok(new ShiftResponse
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
        });
    }

    [HttpDelete("shifts/{id:guid}")]
    public async Task<IActionResult> DeleteShift(Guid id)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("rotas.edit")) return StatusCode(403);

        var success = await _rotaService.DeleteShiftAsync(id, userId.Value);
        if (!success) return NotFound();

        return Ok(new { message = "Shift deleted" });
    }

    [HttpGet("monthly-hours")]
    public async Task<IActionResult> GetMonthlyHours([FromQuery] int year)
    {
        if (User.GetUserId() == null) return Unauthorized();

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

    [HttpPost("monthly-hours")]
    public async Task<IActionResult> SetMonthlyHours([FromBody] SetMonthlyHoursRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("rotas.edit")) return StatusCode(403);

        if (request.Month < 1 || request.Month > 12 || request.Year < 2000 || request.Year > 2100)
            return BadRequest(new { error = "Invalid year or month" });

        var result = await _rotaService.SetMonthlyHoursAsync(request, userId.Value);
        return Ok(new MonthlyHoursResponse
        {
            Id = result.Id,
            Year = result.Year,
            Month = result.Month,
            ContractedHours = result.ContractedHours
        });
    }
}
