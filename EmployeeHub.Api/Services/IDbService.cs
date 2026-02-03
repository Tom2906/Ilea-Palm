using Npgsql;

namespace EmployeeHub.Api.Services;

public interface IDbService
{
    Task<NpgsqlConnection> GetConnectionAsync();
}
