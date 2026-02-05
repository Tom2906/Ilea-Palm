using EmployeeHub.Api.Middleware;
using EmployeeHub.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeHub.Api.Controllers;

[ApiController]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet("pending")]
    public async Task<IActionResult> GetPending()
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.IsAdmin()) return Forbid();

        var pending = await _notificationService.GetPendingAsync();
        return Ok(pending);
    }

    [HttpPost("send")]
    public async Task<IActionResult> SendNotifications()
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.IsAdmin()) return Forbid();

        var result = await _notificationService.SendNotificationsAsync(userId.Value);
        return Ok(result);
    }

    [HttpDelete("log")]
    public async Task<IActionResult> ClearLog()
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.IsAdmin()) return Forbid();

        await _notificationService.ClearLogAsync();
        return Ok(new { message = "Notification log cleared" });
    }

    [HttpGet("log")]
    public async Task<IActionResult> GetLog([FromQuery] int limit = 100)
    {
        var userId = User.GetUserId();
        if (userId == null) return Unauthorized();
        if (!User.IsAdmin()) return Forbid();

        var log = await _notificationService.GetLogAsync(limit);
        return Ok(log);
    }
}
