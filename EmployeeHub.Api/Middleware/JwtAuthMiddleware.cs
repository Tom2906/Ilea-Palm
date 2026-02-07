using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace EmployeeHub.Api.Middleware;

public class JwtAuthMiddleware
{
    private readonly RequestDelegate _next;
    private readonly string _secret;
    private readonly string _issuer;

    public JwtAuthMiddleware(RequestDelegate next, IConfiguration config)
    {
        _next = next;
        _secret = config["Jwt:Secret"]
            ?? throw new InvalidOperationException("Jwt:Secret not configured");
        _issuer = config["Jwt:Issuer"] ?? "EmployeeHub";
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var token = context.Request.Headers["Authorization"]
            .FirstOrDefault()?.Replace("Bearer ", "");

        if (!string.IsNullOrEmpty(token))
        {
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));

                var principal = handler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = _issuer,
                    ValidateAudience = true,
                    ValidAudience = _issuer,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = key,
                    ClockSkew = TimeSpan.FromMinutes(1)
                }, out _);

                context.User = principal;
            }
            catch
            {
                // Invalid token — continue as unauthenticated
            }
        }

        await _next(context);
    }
}

// Extension methods for getting user info from claims
public static class ClaimsPrincipalExtensions
{
    public static Guid? GetUserId(this ClaimsPrincipal principal)
    {
        var claim = principal.FindFirst(ClaimTypes.NameIdentifier);
        return claim != null && Guid.TryParse(claim.Value, out var id) ? id : null;
    }

    public static Guid? GetEmployeeId(this ClaimsPrincipal principal)
    {
        var claim = principal.FindFirst("EmployeeId");
        return claim != null && Guid.TryParse(claim.Value, out var id) ? id : null;
    }

    public static bool HasPermission(this ClaimsPrincipal principal, string permission)
    {
        return principal.FindFirst($"Perm:{permission}") != null;
    }

    public static string GetPermissionScope(this ClaimsPrincipal principal, string permission)
    {
        return principal.FindFirst($"Perm:{permission}")?.Value ?? "own";
    }

    public static string GetRoleName(this ClaimsPrincipal principal)
    {
        return principal.FindFirst("RoleName")?.Value ?? "Staff";
    }

    public static Guid? GetRoleId(this ClaimsPrincipal principal)
    {
        var claim = principal.FindFirst("RoleId");
        return claim != null && Guid.TryParse(claim.Value, out var id) ? id : null;
    }
}
