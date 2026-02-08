using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Models;

namespace EmployeeHub.Api.Services;

public interface IAIProviderService
{
    Task<List<AIProvider>> GetAllAsync();
    Task<AIProvider?> GetByIdAsync(Guid id);
    Task<AIProvider> CreateAsync(CreateAIProviderRequest request, Guid userId);
    Task<AIProvider> UpdateAsync(Guid id, UpdateAIProviderRequest request, Guid userId);
    Task DeleteAsync(Guid id, Guid userId);
    Task<List<AIModelResponse>> GetAvailableModelsAsync(Guid providerId);
}
