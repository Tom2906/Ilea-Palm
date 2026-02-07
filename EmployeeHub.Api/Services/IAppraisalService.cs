using EmployeeHub.Api.DTOs;

namespace EmployeeHub.Api.Services;

public interface IAppraisalService
{
    Task<List<AppraisalResponse>> GetByEmployeeAsync(Guid employeeId);
    Task<List<AppraisalMatrixRow>> GetMatrixAsync(int reviewsBack = 2, int reviewsForward = 2);
    Task<AppraisalResponse> CreateAsync(CreateAppraisalRequest request, Guid userId);
    Task<AppraisalResponse?> UpdateAsync(Guid id, UpdateAppraisalRequest request, Guid userId);
    Task<bool> DeleteAsync(Guid id, Guid userId);
    Task<List<AppraisalResponse>> GenerateMilestonesForEmployeeAsync(Guid employeeId, Guid userId);
}
