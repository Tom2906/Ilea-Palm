namespace EmployeeHub.Api.DTOs;

public record SupervisionRequirementDto(
    Guid Id,
    Guid EmployeeId,
    DateOnly EffectiveFrom,
    int RequiredCount,
    DateTime CreatedAt
);

public record CreateSupervisionRequirementRequest(
    Guid EmployeeId,
    DateOnly EffectiveFrom,
    int RequiredCount
);

public record UpdateSupervisionRequirementRequest(
    DateOnly EffectiveFrom,
    int RequiredCount
);
