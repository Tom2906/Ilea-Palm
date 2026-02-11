using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Helpers;
using EmployeeHub.Api.Models;
using Npgsql;

namespace EmployeeHub.Api.Services;

public class OnboardingService : IOnboardingService
{
    private readonly IDbService _db;
    private readonly IAuditService _audit;

    public OnboardingService(IDbService db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<List<OnboardingItem>> GetItemsAsync(bool includeInactive = false)
    {
        await using var conn = await _db.GetConnectionAsync();
        var sql = includeInactive
            ? "SELECT id, name, description, display_order, active, created_at, updated_at FROM onboarding_items ORDER BY display_order, name"
            : "SELECT id, name, description, display_order, active, created_at, updated_at FROM onboarding_items WHERE active = true ORDER BY display_order, name";

        await using var cmd = new NpgsqlCommand(sql, conn);
        await using var reader = await cmd.ExecuteReaderAsync();

        var items = new List<OnboardingItem>();
        while (await reader.ReadAsync())
        {
            items.Add(ReadItem(reader));
        }
        return items;
    }

    public async Task<OnboardingItem> CreateItemAsync(CreateOnboardingItemRequest request, Guid userId)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO onboarding_items (name, description, display_order)
            VALUES (@name, @description, @displayOrder)
            RETURNING id, name, description, display_order, active, created_at, updated_at", conn);

        cmd.Parameters.AddWithValue("name", request.Name);
        cmd.Parameters.AddWithValue("description", (object?)request.Description ?? DBNull.Value);
        cmd.Parameters.AddWithValue("displayOrder", request.DisplayOrder);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();
        var item = ReadItem(reader);

        await reader.CloseAsync();
        await _audit.LogAsync("onboarding_items", item.Id, "create", userId, newData: request);

        return item;
    }

    public async Task<OnboardingItem?> UpdateItemAsync(Guid id, UpdateOnboardingItemRequest request, Guid userId)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            UPDATE onboarding_items SET
                name = COALESCE(@name, name),
                description = COALESCE(@description, description),
                display_order = COALESCE(@displayOrder, display_order),
                active = COALESCE(@active, active),
                updated_at = NOW()
            WHERE id = @id
            RETURNING id, name, description, display_order, active, created_at, updated_at", conn);

        cmd.Parameters.AddWithValue("id", id);
        cmd.Parameters.AddWithValue("name", (object?)request.Name ?? DBNull.Value);
        cmd.Parameters.AddWithValue("description", (object?)request.Description ?? DBNull.Value);
        cmd.Parameters.AddWithValue("displayOrder", request.DisplayOrder.HasValue ? request.DisplayOrder.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("active", request.Active.HasValue ? request.Active.Value : DBNull.Value);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;
        var item = ReadItem(reader);

        await reader.CloseAsync();
        await _audit.LogAsync("onboarding_items", id, "update", userId, newData: request);

        return item;
    }

    public async Task<bool> DeleteItemAsync(Guid id, Guid userId)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(
            "UPDATE onboarding_items SET active = false, updated_at = NOW() WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("id", id);

        var rows = await cmd.ExecuteNonQueryAsync();
        if (rows > 0)
            await _audit.LogAsync("onboarding_items", id, "soft_delete", userId);
        return rows > 0;
    }

    public async Task<List<OnboardingRecordResponse>> GetEmployeeRecordsAsync(Guid employeeId)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            SELECT r.id, r.employee_id, r.item_id, i.name, i.description, i.display_order,
                   r.status, r.completed_date, r.notes, r.created_at, r.updated_at
            FROM onboarding_records r
            JOIN onboarding_items i ON i.id = r.item_id
            WHERE r.employee_id = @employeeId
            ORDER BY i.display_order, i.name", conn);
        cmd.Parameters.AddWithValue("employeeId", employeeId);

        await using var reader = await cmd.ExecuteReaderAsync();
        var records = new List<OnboardingRecordResponse>();
        while (await reader.ReadAsync())
        {
            records.Add(new OnboardingRecordResponse
            {
                Id = reader.GetGuid("id"),
                EmployeeId = reader.GetGuid("employee_id"),
                ItemId = reader.GetGuid("item_id"),
                ItemName = reader.GetString("name"),
                ItemDescription = reader.GetStringOrNull("description"),
                DisplayOrder = reader.GetInt32("display_order"),
                Status = reader.GetString("status"),
                CompletedDate = reader.GetDateOnlyOrNull("completed_date"),
                Notes = reader.GetStringOrNull("notes"),
                CreatedAt = reader.GetDateTime("created_at"),
                UpdatedAt = reader.GetDateTime("updated_at")
            });
        }
        return records;
    }

    public async Task<OnboardingRecordResponse?> UpdateRecordAsync(Guid employeeId, Guid itemId, UpdateOnboardingRecordRequest request, Guid userId)
    {
        await using var conn = await _db.GetConnectionAsync();

        var completedDate = request.Status == "complete" ? DateOnly.FromDateTime(DateTime.UtcNow) : (DateOnly?)null;

        await using var cmd = new NpgsqlCommand(@"
            UPDATE onboarding_records SET
                status = @status,
                completed_date = @completedDate,
                notes = COALESCE(@notes, notes),
                recorded_by = @recordedBy,
                updated_at = NOW()
            WHERE employee_id = @employeeId AND item_id = @itemId
            RETURNING id, created_at, updated_at", conn);

        cmd.Parameters.AddWithValue("employeeId", employeeId);
        cmd.Parameters.AddWithValue("itemId", itemId);
        cmd.Parameters.AddWithValue("status", request.Status);
        cmd.Parameters.AddWithValue("completedDate", completedDate.HasValue ? completedDate.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("notes", (object?)request.Notes ?? DBNull.Value);
        cmd.Parameters.AddWithValue("recordedBy", userId);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;

        var id = reader.GetGuid("id");
        await reader.CloseAsync();

        await _audit.LogAsync("onboarding_records", id, "update", userId, newData: request);

        // Return full record
        var records = await GetEmployeeRecordsAsync(employeeId);
        return records.FirstOrDefault(r => r.ItemId == itemId);
    }

    public async Task CreateRecordsForNewEmployeeAsync(Guid employeeId, Guid userId)
    {
        var items = await GetItemsAsync();
        if (items.Count == 0) return;

        await using var conn = await _db.GetConnectionAsync();
        foreach (var item in items)
        {
            await using var cmd = new NpgsqlCommand(@"
                INSERT INTO onboarding_records (employee_id, item_id, status, recorded_by)
                VALUES (@employeeId, @itemId, 'pending', @recordedBy)
                ON CONFLICT (employee_id, item_id) DO NOTHING", conn);

            cmd.Parameters.AddWithValue("employeeId", employeeId);
            cmd.Parameters.AddWithValue("itemId", item.Id);
            cmd.Parameters.AddWithValue("recordedBy", userId);

            await cmd.ExecuteNonQueryAsync();
        }
    }

    private static OnboardingItem ReadItem(NpgsqlDataReader reader)
    {
        return new OnboardingItem
        {
            Id = reader.GetGuid("id"),
            Name = reader.GetString("name"),
            Description = reader.GetStringOrNull("description"),
            DisplayOrder = reader.GetInt32("display_order"),
            Active = reader.GetBoolean("active"),
            CreatedAt = reader.GetDateTime("created_at"),
            UpdatedAt = reader.GetDateTime("updated_at")
        };
    }
}
