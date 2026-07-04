using Bolao.Functions.Domain;

namespace Bolao.Functions.Persistence;

public interface IResultRepository
{
    Task PublishAsync(
        string matchId,
        string resultVersion,
        ConfirmedResult result,
        IReadOnlyList<StandingUpdate> updates,
        CancellationToken cancellationToken);

    Task ReviseAsync(
        string matchId,
        string previousResultVersion,
        string resultVersion,
        ConfirmedResult result,
        IReadOnlyList<StandingAdjustment> adjustments,
        CancellationToken cancellationToken);
}

public class ResultAlreadyPublishedException(string matchId)
    : InvalidOperationException($"An official result has already been published for match '{matchId}'.");
