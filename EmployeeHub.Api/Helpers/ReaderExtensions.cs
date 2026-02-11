using Npgsql;

namespace EmployeeHub.Api.Helpers;

/// <summary>
/// Extension methods for NpgsqlDataReader using named columns instead of positional indices.
/// Eliminates brittle positional indexing and repeated IsDBNull checks.
/// </summary>
public static class ReaderExtensions
{
    public static string GetString(this NpgsqlDataReader r, string col)
        => r.GetString(r.GetOrdinal(col));

    public static string? GetStringOrNull(this NpgsqlDataReader r, string col)
    {
        var ord = r.GetOrdinal(col);
        return r.IsDBNull(ord) ? null : r.GetString(ord);
    }

    public static int GetInt32(this NpgsqlDataReader r, string col)
        => r.GetInt32(r.GetOrdinal(col));

    public static int? GetInt32OrNull(this NpgsqlDataReader r, string col)
    {
        var ord = r.GetOrdinal(col);
        return r.IsDBNull(ord) ? null : r.GetInt32(ord);
    }

    public static decimal GetDecimal(this NpgsqlDataReader r, string col)
        => r.GetDecimal(r.GetOrdinal(col));

    public static decimal? GetDecimalOrNull(this NpgsqlDataReader r, string col)
    {
        var ord = r.GetOrdinal(col);
        return r.IsDBNull(ord) ? null : r.GetDecimal(ord);
    }

    public static bool GetBoolean(this NpgsqlDataReader r, string col)
        => r.GetBoolean(r.GetOrdinal(col));

    public static bool? GetBooleanOrNull(this NpgsqlDataReader r, string col)
    {
        var ord = r.GetOrdinal(col);
        return r.IsDBNull(ord) ? null : r.GetBoolean(ord);
    }

    public static Guid GetGuid(this NpgsqlDataReader r, string col)
        => r.GetGuid(r.GetOrdinal(col));

    public static Guid? GetGuidOrNull(this NpgsqlDataReader r, string col)
    {
        var ord = r.GetOrdinal(col);
        return r.IsDBNull(ord) ? null : r.GetGuid(ord);
    }

    public static DateTime GetDateTime(this NpgsqlDataReader r, string col)
        => r.GetDateTime(r.GetOrdinal(col));

    public static DateTime? GetDateTimeOrNull(this NpgsqlDataReader r, string col)
    {
        var ord = r.GetOrdinal(col);
        return r.IsDBNull(ord) ? null : r.GetDateTime(ord);
    }

    public static DateOnly GetDateOnly(this NpgsqlDataReader r, string col)
        => DateOnly.FromDateTime(r.GetDateTime(r.GetOrdinal(col)));

    public static DateOnly? GetDateOnlyOrNull(this NpgsqlDataReader r, string col)
    {
        var ord = r.GetOrdinal(col);
        return r.IsDBNull(ord) ? null : DateOnly.FromDateTime(r.GetDateTime(ord));
    }
}
