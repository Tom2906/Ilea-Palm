using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Models;
using Npgsql;

namespace EmployeeHub.Api.Services;

public class EmployeeReferenceService : IEmployeeReferenceService
{
    private readonly IDbService _db;
    private readonly IAuditService _audit;

    public EmployeeReferenceService(IDbService db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<List<EmployeeReference>> GetByEmployeeAsync(Guid employeeId)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            SELECT id, employee_id, reference_number, contact_name, contact_company,
                   contact_email, contact_phone, received, verbal_ref,
                   date_requested, date_received, notes, created_at, updated_at
            FROM employee_references
            WHERE employee_id = @employeeId
            ORDER BY reference_number", conn);
        cmd.Parameters.AddWithValue("employeeId", employeeId);

        await using var reader = await cmd.ExecuteReaderAsync();
        var refs = new List<EmployeeReference>();
        while (await reader.ReadAsync())
        {
            refs.Add(ReadReference(reader));
        }
        return refs;
    }

    public async Task<EmployeeReference?> GetByIdAsync(Guid id)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            SELECT id, employee_id, reference_number, contact_name, contact_company,
                   contact_email, contact_phone, received, verbal_ref,
                   date_requested, date_received, notes, created_at, updated_at
            FROM employee_references WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("id", id);

        await using var reader = await cmd.ExecuteReaderAsync();
        return await reader.ReadAsync() ? ReadReference(reader) : null;
    }

    public async Task<EmployeeReference> CreateAsync(Guid employeeId, CreateEmployeeReferenceRequest request, Guid userId)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO employee_references
                (employee_id, reference_number, contact_name, contact_company,
                 contact_email, contact_phone, received, verbal_ref,
                 date_requested, date_received, notes)
            VALUES (@employeeId, @refNum, @contactName, @contactCompany,
                    @contactEmail, @contactPhone, @received, @verbalRef,
                    @dateRequested, @dateReceived, @notes)
            RETURNING id, employee_id, reference_number, contact_name, contact_company,
                      contact_email, contact_phone, received, verbal_ref,
                      date_requested, date_received, notes, created_at, updated_at", conn);

        cmd.Parameters.AddWithValue("employeeId", employeeId);
        cmd.Parameters.AddWithValue("refNum", request.ReferenceNumber);
        cmd.Parameters.AddWithValue("contactName", (object?)request.ContactName ?? DBNull.Value);
        cmd.Parameters.AddWithValue("contactCompany", (object?)request.ContactCompany ?? DBNull.Value);
        cmd.Parameters.AddWithValue("contactEmail", (object?)request.ContactEmail ?? DBNull.Value);
        cmd.Parameters.AddWithValue("contactPhone", (object?)request.ContactPhone ?? DBNull.Value);
        cmd.Parameters.AddWithValue("received", request.Received);
        cmd.Parameters.AddWithValue("verbalRef", request.VerbalRef);
        cmd.Parameters.AddWithValue("dateRequested", request.DateRequested.HasValue ? request.DateRequested.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("dateReceived", request.DateReceived.HasValue ? request.DateReceived.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("notes", (object?)request.Notes ?? DBNull.Value);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();
        var reference = ReadReference(reader);

        await reader.CloseAsync();
        await _audit.LogAsync("employee_references", reference.Id, "create", userId, newData: request);

        return reference;
    }

    public async Task<EmployeeReference?> UpdateAsync(Guid id, UpdateEmployeeReferenceRequest request, Guid userId)
    {
        var existing = await GetByIdAsync(id);
        if (existing == null) return null;

        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            UPDATE employee_references SET
                contact_name = COALESCE(@contactName, contact_name),
                contact_company = COALESCE(@contactCompany, contact_company),
                contact_email = COALESCE(@contactEmail, contact_email),
                contact_phone = COALESCE(@contactPhone, contact_phone),
                received = COALESCE(@received, received),
                verbal_ref = COALESCE(@verbalRef, verbal_ref),
                date_requested = COALESCE(@dateRequested, date_requested),
                date_received = COALESCE(@dateReceived, date_received),
                notes = COALESCE(@notes, notes),
                updated_at = NOW()
            WHERE id = @id
            RETURNING id, employee_id, reference_number, contact_name, contact_company,
                      contact_email, contact_phone, received, verbal_ref,
                      date_requested, date_received, notes, created_at, updated_at", conn);

        cmd.Parameters.AddWithValue("id", id);
        cmd.Parameters.AddWithValue("contactName", (object?)request.ContactName ?? DBNull.Value);
        cmd.Parameters.AddWithValue("contactCompany", (object?)request.ContactCompany ?? DBNull.Value);
        cmd.Parameters.AddWithValue("contactEmail", (object?)request.ContactEmail ?? DBNull.Value);
        cmd.Parameters.AddWithValue("contactPhone", (object?)request.ContactPhone ?? DBNull.Value);
        cmd.Parameters.AddWithValue("received", request.Received.HasValue ? request.Received.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("verbalRef", request.VerbalRef.HasValue ? request.VerbalRef.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("dateRequested", request.DateRequested.HasValue ? request.DateRequested.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("dateReceived", request.DateReceived.HasValue ? request.DateReceived.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("notes", (object?)request.Notes ?? DBNull.Value);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;
        var updated = ReadReference(reader);

        await reader.CloseAsync();
        await _audit.LogAsync("employee_references", id, "update", userId, oldData: existing, newData: request);

        return updated;
    }

    public async Task<bool> DeleteAsync(Guid id, Guid userId)
    {
        var existing = await GetByIdAsync(id);
        if (existing == null) return false;

        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(
            "DELETE FROM employee_references WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("id", id);

        var rows = await cmd.ExecuteNonQueryAsync();
        if (rows > 0)
            await _audit.LogAsync("employee_references", id, "delete", userId, oldData: existing);

        return rows > 0;
    }

    private static EmployeeReference ReadReference(NpgsqlDataReader reader)
    {
        return new EmployeeReference
        {
            Id = reader.GetGuid(0),
            EmployeeId = reader.GetGuid(1),
            ReferenceNumber = reader.GetInt32(2),
            ContactName = reader.IsDBNull(3) ? null : reader.GetString(3),
            ContactCompany = reader.IsDBNull(4) ? null : reader.GetString(4),
            ContactEmail = reader.IsDBNull(5) ? null : reader.GetString(5),
            ContactPhone = reader.IsDBNull(6) ? null : reader.GetString(6),
            Received = reader.GetBoolean(7),
            VerbalRef = reader.GetBoolean(8),
            DateRequested = reader.IsDBNull(9) ? null : DateOnly.FromDateTime(reader.GetDateTime(9)),
            DateReceived = reader.IsDBNull(10) ? null : DateOnly.FromDateTime(reader.GetDateTime(10)),
            Notes = reader.IsDBNull(11) ? null : reader.GetString(11),
            CreatedAt = reader.GetDateTime(12),
            UpdatedAt = reader.GetDateTime(13)
        };
    }
}
