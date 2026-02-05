using EmployeeHub.Api.DTOs;

namespace EmployeeHub.Api.Services;

public interface INotificationService
{
    Task<List<PendingNotificationResponse>> GetPendingAsync();
    Task<SendNotificationsResponse> SendNotificationsAsync(Guid userId);
    Task<List<NotificationLogResponse>> GetLogAsync(int limit = 100);
    Task ClearLogAsync();
}
