using Npgsql;

namespace EmployeeHub.Api.Services;

public class DbService : IDbService
{
    private readonly string _connectionString;

    public DbService(IConfiguration configuration)
    {
        var dbPassword = configuration["Supabase:DbPassword"]
            ?? throw new InvalidOperationException("Supabase:DbPassword not configured");

        // Session pooler connection (IPv4 compatible)
        _connectionString = $"Host=aws-1-eu-west-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.iwycjvbmifcirnyknnlu;Password={dbPassword};SSL Mode=Require;Trust Server Certificate=true";
    }

    public async Task<NpgsqlConnection> GetConnectionAsync()
    {
        var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();
        return connection;
    }
}
