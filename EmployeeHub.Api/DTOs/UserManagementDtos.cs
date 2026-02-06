using System.ComponentModel.DataAnnotations;

namespace EmployeeHub.Api.DTOs;

public class UserListResponse
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public Guid RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public Guid? EmployeeId { get; set; }
    public string? EmployeeName { get; set; }
    public bool Active { get; set; }
    public DateTime? LastLogin { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateUserRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string DisplayName { get; set; } = string.Empty;

    [Required, MinLength(8)]
    public string Password { get; set; } = string.Empty;

    [Required]
    public Guid RoleId { get; set; }

    public Guid? EmployeeId { get; set; }
}

public class UpdateUserRequest
{
    [Required]
    public Guid RoleId { get; set; }

    public Guid? EmployeeId { get; set; }

    public bool? Active { get; set; }
}

public class ResetPasswordRequest
{
    [Required, MinLength(8)]
    public string NewPassword { get; set; } = string.Empty;
}
