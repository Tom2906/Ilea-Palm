using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace EmployeeHub.Api.Middleware;

/// <summary>
/// Requires the request to have a valid authenticated user.
/// Optionally checks for a specific permission.
/// After this filter runs, User.GetUserId() is guaranteed non-null.
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = true)]
public class RequirePermissionAttribute : Attribute, IAuthorizationFilter
{
    private readonly string? _permission;

    /// <summary>Auth-only: no permission check, just requires a valid user.</summary>
    public RequirePermissionAttribute() => _permission = null;

    /// <summary>Auth + permission: requires a valid user with the given permission.</summary>
    public RequirePermissionAttribute(string permission) => _permission = permission;

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var userId = context.HttpContext.User.GetUserId();
        if (userId == null)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        if (_permission != null && !context.HttpContext.User.HasPermission(_permission))
        {
            context.Result = new StatusCodeResult(403);
        }
    }
}
