using EmployeeHub.Api.DTOs;
using EmployeeHub.Api.Models;
using Npgsql;

namespace EmployeeHub.Api.Services;

public class AIProviderService : IAIProviderService
{
    private readonly IDbService _db;
    private readonly IAuditService _audit;

    public AIProviderService(IDbService db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<List<AIProvider>> GetAllAsync()
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            SELECT id, provider, name, api_key, is_active, created_at, updated_at
            FROM ai_providers
            ORDER BY created_at DESC", conn);

        var providers = new List<AIProvider>();
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            providers.Add(new AIProvider
            {
                Id = reader.GetGuid(0),
                Provider = reader.GetString(1),
                Name = reader.GetString(2),
                ApiKey = reader.GetString(3),
                IsActive = reader.GetBoolean(4),
                CreatedAt = reader.GetDateTime(5),
                UpdatedAt = reader.GetDateTime(6)
            });
        }
        return providers;
    }

    public async Task<AIProvider?> GetByIdAsync(Guid id)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            SELECT id, provider, name, api_key, is_active, created_at, updated_at
            FROM ai_providers
            WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("id", id);

        await using var reader = await cmd.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return new AIProvider
            {
                Id = reader.GetGuid(0),
                Provider = reader.GetString(1),
                Name = reader.GetString(2),
                ApiKey = reader.GetString(3),
                IsActive = reader.GetBoolean(4),
                CreatedAt = reader.GetDateTime(5),
                UpdatedAt = reader.GetDateTime(6)
            };
        }
        return null;
    }

    public async Task<AIProvider> CreateAsync(CreateAIProviderRequest request, Guid userId)
    {
        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            INSERT INTO ai_providers (provider, name, api_key, is_active)
            VALUES (@provider, @name, @apiKey, true)
            RETURNING id, provider, name, api_key, is_active, created_at, updated_at", conn);

        cmd.Parameters.AddWithValue("provider", request.Provider);
        cmd.Parameters.AddWithValue("name", request.Name);
        cmd.Parameters.AddWithValue("apiKey", request.ApiKey);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();

        var created = new AIProvider
        {
            Id = reader.GetGuid(0),
            Provider = reader.GetString(1),
            Name = reader.GetString(2),
            ApiKey = reader.GetString(3),
            IsActive = reader.GetBoolean(4),
            CreatedAt = reader.GetDateTime(5),
            UpdatedAt = reader.GetDateTime(6)
        };

        await reader.CloseAsync();
        await _audit.LogAsync("ai_providers", created.Id, "create", userId, oldData: null, newData: request);

        return created;
    }

    public async Task<AIProvider> UpdateAsync(Guid id, UpdateAIProviderRequest request, Guid userId)
    {
        var existing = await GetByIdAsync(id);
        if (existing == null) throw new InvalidOperationException("Provider not found");

        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand(@"
            UPDATE ai_providers SET
                name = COALESCE(@name, name),
                api_key = COALESCE(@apiKey, api_key),
                is_active = COALESCE(@isActive, is_active),
                updated_at = NOW()
            WHERE id = @id
            RETURNING id, provider, name, api_key, is_active, created_at, updated_at", conn);

        cmd.Parameters.AddWithValue("id", id);
        cmd.Parameters.AddWithValue("name", (object?)request.Name ?? DBNull.Value);
        cmd.Parameters.AddWithValue("apiKey", (object?)request.ApiKey ?? DBNull.Value);
        cmd.Parameters.AddWithValue("isActive", request.IsActive.HasValue ? request.IsActive.Value : DBNull.Value);

        await using var reader = await cmd.ExecuteReaderAsync();
        await reader.ReadAsync();

        var updated = new AIProvider
        {
            Id = reader.GetGuid(0),
            Provider = reader.GetString(1),
            Name = reader.GetString(2),
            ApiKey = reader.GetString(3),
            IsActive = reader.GetBoolean(4),
            CreatedAt = reader.GetDateTime(5),
            UpdatedAt = reader.GetDateTime(6)
        };

        await reader.CloseAsync();
        await _audit.LogAsync("ai_providers", id, "update", userId, oldData: existing, newData: request);

        return updated;
    }

    public async Task DeleteAsync(Guid id, Guid userId)
    {
        var existing = await GetByIdAsync(id);
        if (existing == null) throw new InvalidOperationException("Provider not found");

        await using var conn = await _db.GetConnectionAsync();
        await using var cmd = new NpgsqlCommand("DELETE FROM ai_providers WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("id", id);
        await cmd.ExecuteNonQueryAsync();

        await _audit.LogAsync("ai_providers", id, "delete", userId, oldData: existing, newData: null);
    }

    public async Task<List<AIModelResponse>> GetAvailableModelsAsync(Guid providerId)
    {
        var provider = await GetByIdAsync(providerId);
        if (provider == null) throw new InvalidOperationException("Provider not found");

        var providerType = provider.Provider.ToLowerInvariant();

        // Fetch real models from provider APIs
        if (providerType == "gemini")
        {
            try
            {
                using var httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Add("x-goog-api-key", provider.ApiKey);

                var response = await httpClient.GetAsync("https://generativelanguage.googleapis.com/v1beta/models");
                response.EnsureSuccessStatusCode();

                var json = await response.Content.ReadAsStringAsync();
                var data = System.Text.Json.JsonDocument.Parse(json);

                var models = new List<AIModelResponse>();
                if (data.RootElement.TryGetProperty("models", out var modelsArray))
                {
                    foreach (var model in modelsArray.EnumerateArray())
                    {
                        var name = model.TryGetProperty("name", out var n) ? n.GetString() : null;
                        var displayName = model.TryGetProperty("displayName", out var dn) ? dn.GetString() : null;
                        var description = model.TryGetProperty("description", out var d) ? d.GetString() : null;

                        if (name != null)
                        {
                            models.Add(new AIModelResponse
                            {
                                Id = name.Replace("models/", ""),
                                Name = displayName ?? name.Replace("models/", ""),
                                Description = description
                            });
                        }
                    }
                }

                return models.Where(m => m.Id.Contains("gemini")).ToList();
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Failed to fetch Gemini models: {ex.Message}", ex);
            }
        }

        // Fallback for other providers (hardcoded for now)
        return providerType switch
        {
            "anthropic" => new List<AIModelResponse>
            {
                new() { Id = "claude-opus-4-6-20250514", Name = "Claude Opus 4.6", Description = "Most capable model" },
                new() { Id = "claude-sonnet-4-5-20250929", Name = "Claude Sonnet 4.5", Description = "Balanced performance and cost" },
                new() { Id = "claude-haiku-4-5-20250929", Name = "Claude Haiku 4.5", Description = "Fast and affordable" }
            },
            "openai" => new List<AIModelResponse>
            {
                new() { Id = "gpt-4o", Name = "GPT-4o", Description = "Most capable model" },
                new() { Id = "gpt-4o-mini", Name = "GPT-4o Mini", Description = "Fast and affordable" },
                new() { Id = "gpt-4-turbo", Name = "GPT-4 Turbo", Description = "Previous generation" }
            },
            _ => new List<AIModelResponse>()
        };
    }
}
