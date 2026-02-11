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

    [RequirePermission("notifications.manage")]
    [HttpGet("pending")]
    public async Task<IActionResult> GetPending()
    {

        var pending = await _notificationService.GetPendingAsync();
        return Ok(pending);
    }

    [RequirePermission("notifications.manage")]
    [HttpPost("send")]
    public async Task<IActionResult> SendNotifications()
    {
        var userId = User.GetUserId()!.Value;

        var result = await _notificationService.SendNotificationsAsync(userId);
        return Ok(result);
    }

    [RequirePermission("notifications.manage")]
    [HttpDelete("log")]
    public async Task<IActionResult> ClearLog()
    {

        await _notificationService.ClearLogAsync();
        return Ok(new { message = "Notification log cleared" });
    }

    [RequirePermission("notifications.manage")]
    [HttpGet("log")]
    public async Task<IActionResult> GetLog([FromQuery] int limit = 100)
    {

        var log = await _notificationService.GetLogAsync(limit);
        return Ok(log);
    }
}
