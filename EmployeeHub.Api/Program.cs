using System.Threading.RateLimiting;
using EmployeeHub.Api.Middleware;
using EmployeeHub.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Services
builder.Services.AddScoped<IDbService, DbService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddScoped<IEmployeeStatusService, EmployeeStatusService>();
builder.Services.AddScoped<IEmployeeReferenceService, EmployeeReferenceService>();
builder.Services.AddScoped<ITrainingCourseService, TrainingCourseService>();
builder.Services.AddScoped<ITrainingRecordService, TrainingRecordService>();
builder.Services.AddScoped<IOnboardingService, OnboardingService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<ISupervisionService, SupervisionService>();
builder.Services.AddScoped<ISupervisionExceptionService, SupervisionExceptionService>();
builder.Services.AddScoped<ISupervisionRequirementService, SupervisionRequirementService>();
builder.Services.AddScoped<IAppraisalService, AppraisalService>();
builder.Services.AddScoped<ICompanySettingsService, CompanySettingsService>();
builder.Services.AddScoped<IRotaService, RotaService>();
builder.Services.AddScoped<ILeaveService, LeaveService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IUserManagementService, UserManagementService>();
builder.Services.AddScoped<IAIProviderService, AIProviderService>();
builder.Services.AddScoped<IGridViewService, GridViewService>();

// CORS — allow frontend origin(s)
var allowedOrigins = builder.Configuration["AllowedOrigins"]?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? ["http://localhost:5173"];
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Controllers
builder.Services.AddControllers();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "EmployeeHub API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT token. Enter: Bearer {your token}",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Rate limiting
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

var app = builder.Build();

// Middleware pipeline
app.UseMiddleware<ExceptionHandlerMiddleware>();
app.UseCors();
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<JwtAuthMiddleware>();
app.UseRateLimiter();
app.UseDefaultFiles();
app.UseStaticFiles();

// Swagger (dev only)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "EmployeeHub API v1");
        c.RoutePrefix = "swagger";
    });
}

app.MapControllers();
app.MapFallbackToFile("index.html");

// Health check endpoint (includes DB connectivity test)
app.MapGet("/api/health", async (IDbService db) =>
{
    try
    {
        await using var conn = await db.GetConnectionAsync();
        await using var cmd = new Npgsql.NpgsqlCommand("SELECT COUNT(*) FROM users", conn);
        var count = await cmd.ExecuteScalarAsync();
        return Results.Ok(new { status = "healthy", database = "connected", users = count, timestamp = DateTime.UtcNow });
    }
    catch (Exception)
    {
        return Results.Ok(new { status = "unhealthy", database = "failed", error = "database connection failed", timestamp = DateTime.UtcNow });
    }
});

app.Run();
