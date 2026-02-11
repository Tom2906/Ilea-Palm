using System.Text.Json;
using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Helpers;
using Npgsql;
using NpgsqlTypes;

namespace EmployeeHub.Api.Services;

public class GridViewService : IGridViewService
{
    private readonly IDbService _db;

    public GridViewService(IDbService db)
    {
        _db = db;
    }

    private const string SelectColumns = @"
        id, user_id, grid_type, name, config, is_default, is_company_default, created_at, updated_at";

    public async Task<List<GridViewResponse>> GetByUserAndGridAsync(Guid userId, string gridType)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand($@"
            SELECT {SelectColumns}
            FROM user_grid_views
            WHERE grid_type = @gridType
              AND (user_id = @userId OR is_company_default = true)
            ORDER BY
                CASE
                    WHEN user_id = @userId AND is_default = true THEN 0
                    WHEN is_company_default = true THEN 1
                    WHEN user_id = @userId THEN 2
                    ELSE 3
                END,
                name", conn);

        cmd.Parameters.AddWithValue("userId", userId);
        cmd.Parameters.AddWithValue("gridType", gridType);

        await using var reader = await cmd.ExecuteReaderAsync();
        var views = new List<GridViewResponse>();
        while (await reader.ReadAsync())
        {
            views.Add(ReadView(reader));
        }
        return views;
    }

    public async Task<GridViewResponse?> GetByIdAsync(Guid id, Guid userId)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand($@"
            SELECT {SelectColumns}
            FROM user_grid_views
            WHERE id = @id AND (user_id = @userId OR is_company_default = true)", conn);

        cmd.Parameters.AddWithValue("id", id);
        cmd.Parameters.AddWithValue("userId", userId);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return ReadView(reader);
        }
        return null;
    }

    public async Task<GridViewResponse> CreateAsync(CreateGridViewRequest request, Guid userId)
    {
        await using var conn = await _db.GetConnectionAsync();

        // If setting as default, clear existing default for this user+gridType
        if (request.IsDefault)
        {
            await ClearDefaultAsync(conn, userId, request.GridType);
        }

        // If setting as company default, clear existing company default for this gridType
        if (request.IsCompanyDefault)
        {
            await ClearCompanyDefaultAsync(conn, request.GridType);
        }

        var configJson = request.Config.HasValue
            ? request.Config.Value.GetRawText()
            : "{}";

        await using var cmd = new NpgsqlCommand($@"
            INSERT INTO user_grid_views (user_id, grid_type, name, config, is_default, is_company_default)
            VALUES (@userId, @gridType, @name, @config::jsonb, @isDefault, @isCompanyDefault)
            RETURNING {SelectColumns}", conn);

        cmd.Parameters.AddWithValue("userId", userId);
        cmd.Parameters.AddWithValue("gridType", request.GridType);
        cmd.Parameters.AddWithValue("name", request.Name);
        cmd.Parameters.AddWithValue("config", NpgsqlDbType.Text, configJson);
        cmd.Parameters.AddWithValue("isDefault", request.IsDefault);
        cmd.Parameters.AddWithValue("isCompanyDefault", request.IsCompanyDefault);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();
        return ReadView(reader);
    }

    public async Task<GridViewResponse> UpdateAsync(Guid id, UpdateGridViewRequest request, Guid userId)
    {
        await using var conn = await _db.GetConnectionAsync();

        // If setting as default, clear existing default first
        if (request.IsDefault == true)
        {
            // Need to know the grid_type for this view
            var gridType = await GetGridTypeAsync(conn, id, userId);
            if (gridType == null)
                throw new KeyNotFoundException("View not found");

            await ClearDefaultAsync(conn, userId, gridType);
        }

        // If setting as company default, clear existing company default first
        if (request.IsCompanyDefault == true)
        {
            // Need to know the grid_type for this view
            var gridType = await GetGridTypeAsync(conn, id, userId);
            if (gridType == null)
                throw new KeyNotFoundException("View not found");

            await ClearCompanyDefaultAsync(conn, gridType);
        }

        var configJson = request.Config.HasValue
            ? request.Config.Value.GetRawText()
            : null;

        await using var cmd = new NpgsqlCommand($@"
            UPDATE user_grid_views SET
                name = COALESCE(@name, name),
                config = COALESCE(@config::jsonb, config),
                is_default = COALESCE(@isDefault, is_default),
                is_company_default = COALESCE(@isCompanyDefault, is_company_default),
                updated_at = NOW()
            WHERE id = @id AND (user_id = @userId OR is_company_default = true)
            RETURNING {SelectColumns}", conn);

        cmd.Parameters.AddWithValue("id", id);
        cmd.Parameters.AddWithValue("userId", userId);
        cmd.Parameters.AddWithValue("name", (object?)request.Name ?? DBNull.Value);
        cmd.Parameters.AddWithValue("config", NpgsqlDbType.Text, (object?)configJson ?? DBNull.Value);
        cmd.Parameters.AddWithValue("isDefault", request.IsDefault.HasValue ? request.IsDefault.Value : DBNull.Value);
        cmd.Parameters.AddWithValue("isCompanyDefault", request.IsCompanyDefault.HasValue ? request.IsCompanyDefault.Value : DBNull.Value);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
            throw new KeyNotFoundException("View not found");

        return ReadView(reader);
    }

    public async Task DeleteAsync(Guid id, Guid userId)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            DELETE FROM user_grid_views
            WHERE id = @id AND (user_id = @userId OR is_company_default = true)", conn);

        cmd.Parameters.AddWithValue("id", id);
        cmd.Parameters.AddWithValue("userId", userId);

        var rows = await cmd.ExecuteNonQueryAsync();
        if (rows == 0)
            throw new KeyNotFoundException("View not found");
    }

    private static async Task ClearDefaultAsync(NpgsqlConnection conn, Guid userId, string gridType)
    {
        await using var cmd = new NpgsqlCommand(@"
            UPDATE user_grid_views
            SET is_default = false, updated_at = NOW()
            WHERE user_id = @userId AND grid_type = @gridType AND is_default = true", conn);

        cmd.Parameters.AddWithValue("userId", userId);
        cmd.Parameters.AddWithValue("gridType", gridType);
        await cmd.ExecuteNonQueryAsync();
    }

    private static async Task ClearCompanyDefaultAsync(NpgsqlConnection conn, string gridType)
    {
        await using var cmd = new NpgsqlCommand(@"
            UPDATE user_grid_views
            SET is_company_default = false, updated_at = NOW()
            WHERE grid_type = @gridType AND is_company_default = true", conn);

        cmd.Parameters.AddWithValue("gridType", gridType);
        await cmd.ExecuteNonQueryAsync();
    }

    private static async Task<string?> GetGridTypeAsync(NpgsqlConnection conn, Guid id, Guid userId)
    {
        await using var cmd = new NpgsqlCommand(@"
            SELECT grid_type FROM user_grid_views
            WHERE id = @id AND (user_id = @userId OR is_company_default = true)", conn);

        cmd.Parameters.AddWithValue("id", id);
        cmd.Parameters.AddWithValue("userId", userId);
        return (string?)await cmd.ExecuteScalarAsync();
    }

    private static GridViewResponse ReadView(NpgsqlDataReader reader)
    {
        var configJson = reader.GetString("config");
        return new GridViewResponse
        {
            Id = reader.GetGuid("id"),
            UserId = reader.GetGuid("user_id"),
            GridType = reader.GetString("grid_type"),
            Name = reader.GetString("name"),
            Config = JsonDocument.Parse(configJson).RootElement,
            IsDefault = reader.GetBoolean("is_default"),
            IsCompanyDefault = reader.GetBoolean("is_company_default"),
            CreatedAt = reader.GetDateTime("created_at"),
            UpdatedAt = reader.GetDateTime("updated_at")
        };
    }
}
