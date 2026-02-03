namespace EmployeeHub.Api.Services;

public interface IAuditService
{
    Task LogAsync(string tableName, Guid recordId, string action, Guid? userId, object? oldData = null, object? newData = null);
}
