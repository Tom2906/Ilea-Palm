namespace EmployeeHub.Api.Helpers;

public static class PasswordValidator
{
    /// <summary>
    /// Validates password complexity: min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit.
    /// </summary>
    public static (bool IsValid, string? Error) Validate(string password)
    {
        if (string.IsNullOrEmpty(password) || password.Length < 8)
            return (false, "Password must be at least 8 characters long");

        if (!password.Any(char.IsUpper))
            return (false, "Password must contain at least one uppercase letter");

        if (!password.Any(char.IsLower))
            return (false, "Password must contain at least one lowercase letter");

        if (!password.Any(char.IsDigit))
            return (false, "Password must contain at least one digit");

        return (true, null);
    }
}
