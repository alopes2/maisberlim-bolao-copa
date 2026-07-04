using Bolao.Functions.Domain;

namespace Bolao.Functions.Admin;

public interface IConfirmedResultPublisher
{
    Task PublishAsync(string matchId, string version, ConfirmedResult result, CancellationToken cancellationToken);
    Task ReviseAsync(
        string matchId,
        string previousVersion,
        string version,
        ConfirmedResult result,
        ConfirmedResult previousResult,
        CancellationToken cancellationToken);
}
