using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Models;

namespace EmployeeHub.Api.Services;

public interface IOnboardingService
{
    Task<List<OnboardingItem>> GetItemsAsync(bool includeInactive = false);
    Task<OnboardingItem> CreateItemAsync(CreateOnboardingItemRequest request, Guid userId);
    Task<OnboardingItem?> UpdateItemAsync(Guid id, UpdateOnboardingItemRequest request, Guid userId);
    Task<bool> DeleteItemAsync(Guid id, Guid userId);
    Task<List<OnboardingRecordResponse>> GetEmployeeRecordsAsync(Guid employeeId);
    Task<OnboardingRecordResponse?> UpdateRecordAsync(Guid employeeId, Guid itemId, UpdateOnboardingRecordRequest request, Guid userId);
    Task CreateRecordsForNewEmployeeAsync(Guid employeeId, Guid userId);
}
