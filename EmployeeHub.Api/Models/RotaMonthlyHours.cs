namespace EmployeeHub.Api.Models;

public class RotaMonthlyHours
{
    public Guid Id { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal ContractedHours { get; set; }
}
