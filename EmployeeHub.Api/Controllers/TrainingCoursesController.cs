using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Middleware;
using EmployeeHub.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/training-courses")]
public class TrainingCoursesController : ControllerBase
{
    private readonly ITrainingCourseService _courseService;

    public TrainingCoursesController(ITrainingCourseService courseService)
    {
        _courseService = courseService;
    }

    [RequirePermission]
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? category = null)
    {
        var courses = await _courseService.GetAllAsync(category);
        var response = courses.Select(c => MapToResponse(c));
        return Ok(response);
    }

    [RequirePermission]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var course = await _courseService.GetByIdAsync(id);
        if (course == null) return NotFound();

        return Ok(MapToResponse(course));
    }

    [RequirePermission("training_courses.add")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTrainingCourseRequest request)
    {
        var userId = User.GetUserId()!.Value;

        var course = await _courseService.CreateAsync(request, userId);
        return CreatedAtAction(nameof(GetById), new { id = course.Id }, MapToResponse(course));
    }

    [RequirePermission("training_courses.edit")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTrainingCourseRequest request)
    {
        var userId = User.GetUserId()!.Value;

        var course = await _courseService.UpdateAsync(id, request, userId);
        if (course == null) return NotFound();

        return Ok(MapToResponse(course));
    }

    [RequirePermission("training_courses.delete")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.GetUserId()!.Value;

        var success = await _courseService.DeleteAsync(id, userId);
        if (!success) return NotFound();

        return Ok(new { message = "Training course deleted" });
    }

    private static TrainingCourseResponse MapToResponse(Models.TrainingCourse c) => new()
    {
        Id = c.Id,
        Name = c.Name,
        Description = c.Description,
        Category = c.Category,
        ValidityMonths = c.ValidityMonths,
        NotificationDaysBefore = c.NotificationDaysBefore,
        ReminderFrequencyDays = c.ReminderFrequencyDays,
        NotifyEmployee = c.NotifyEmployee,
        NotifyAdmin = c.NotifyAdmin,
        MandatoryForRoles = c.MandatoryForRoles,
        CreatedAt = c.CreatedAt,
        UpdatedAt = c.UpdatedAt
    };
}
