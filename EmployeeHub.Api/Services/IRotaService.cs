using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Models;

namespace EmployeeHub.Api.Services;

public interface IRotaService
{
    Task<List<ShiftType>> GetShiftTypesAsync();
    Task<RotaMonthResponse> GetMonthAsync(int year, int month);
    Task<Shift?> CreateShiftAsync(CreateShiftRequest request, Guid userId);
    Task<Shift?> UpdateShiftAsync(Guid id, UpdateShiftRequest request, Guid userId);
    Task<bool> DeleteShiftAsync(Guid id, Guid userId);
    Task<List<RotaMonthlyHours>> GetMonthlyHoursAsync(int year);
    Task<RotaMonthlyHours> SetMonthlyHoursAsync(SetMonthlyHoursRequest request, Guid userId);
}
