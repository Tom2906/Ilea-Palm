namespace EmployeeHub.Api.Middleware;

public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    // CSP for API responses (JSON only — strict lockdown)
    private const string ApiCsp = "default-src 'none'; frame-ancestors 'none'";

    // CSP for frontend HTML/static files served from wwwroot
    private const string FrontendCsp =
        "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "connect-src 'self' https://login.microsoftonline.com; " +
        "img-src 'self' data: blob:; " +
        "font-src 'self'; " +
        "frame-ancestors 'none'";

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? "";
        var isApiRequest = path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase);

        context.Response.Headers["X-Content-Type-Options"] = "nosniff";
        context.Response.Headers["X-Frame-Options"] = "DENY";
        context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
        context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
        context.Response.Headers["Content-Security-Policy"] = isApiRequest ? ApiCsp : FrontendCsp;

        // HSTS only when behind a reverse proxy (Cloudflare Tunnel) forwarding HTTPS
        var forwardedProto = context.Request.Headers["X-Forwarded-Proto"].FirstOrDefault();
        if (string.Equals(forwardedProto, "https", StringComparison.OrdinalIgnoreCase))
        {
            context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
        }

        await _next(context);
    }
}
