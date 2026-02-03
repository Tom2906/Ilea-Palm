using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Models;

namespace EmployeeHub.Api.Services;

public interface ITrainingCourseService
{
    Task<List<TrainingCourse>> GetAllAsync(string? category = null);
    Task<TrainingCourse?> GetByIdAsync(Guid id);
    Task<TrainingCourse> CreateAsync(CreateTrainingCourseRequest request, Guid userId);
    Task<TrainingCourse?> UpdateAsync(Guid id, UpdateTrainingCourseRequest request, Guid userId);
    Task<bool> DeleteAsync(Guid id, Guid userId);
}
