namespace Bolao.Functions.Logging;

/// <summary>
/// Removes characters that could be used to forge log entries (e.g. embedded newlines)
/// from values that originate from user input before they are written to logs.
/// </summary>
public static class LogSanitizer
{
    public static string Sanitize(string value) =>
        value.Replace("\r", string.Empty).Replace("\n", string.Empty);
}
