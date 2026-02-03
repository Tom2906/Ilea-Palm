using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Models;

namespace EmployeeHub.Api.Services;

public interface ITrainingRecordService
{
    Task<List<TrainingRecordResponse>> GetByEmployeeAsync(Guid employeeId);
    Task<TrainingRecordResponse> CreateAsync(CreateTrainingRecordRequest request, Guid userId);
    Task<List<TrainingStatusResponse>> GetTrainingStatusAsync(string? category = null);
    Task<List<TrainingStatusResponse>> GetExpiringAsync(int days = 30);
}
