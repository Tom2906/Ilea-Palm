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

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? category = null)
    {
        if (User.GetUserId() == null) return Unauthorized();

        var courses = await _courseService.GetAllAsync(category);
        var response = courses.Select(c => MapToResponse(c));
        return Ok(response);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        if (User.GetUserId() == null) return Unauthorized();

        var course = await _courseService.GetByIdAsync(id);
        if (course == null) return NotFound();

        return Ok(MapToResponse(course));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTrainingCourseRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("training_courses.manage")) return StatusCode(403);

        var course = await _courseService.CreateAsync(request, userId.Value);
        return CreatedAtAction(nameof(GetById), new { id = course.Id }, MapToResponse(course));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTrainingCourseRequest request)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("training_courses.manage")) return StatusCode(403);

        var course = await _courseService.UpdateAsync(id, request, userId.Value);
        if (course == null) return NotFound();

        return Ok(MapToResponse(course));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.HasPermission("training_courses.manage")) return StatusCode(403);

        var success = await _courseService.DeleteAsync(id, userId.Value);
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
