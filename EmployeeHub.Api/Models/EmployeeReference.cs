namespace EmployeeHub.Api.Models;

public class EmployeeReference
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public int ReferenceNumber { get; set; }
    public string? ContactName { get; set; }
    public string? ContactCompany { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public bool Received { get; set; }
    public bool VerbalRef { get; set; }
    public DateOnly? DateRequested { get; set; }
    public DateOnly? DateReceived { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
