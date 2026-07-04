using Bolao.Functions.Domain;
using Bolao.Functions.Logging;
using Bolao.Functions.Notifications;
using Bolao.Functions.Persistence;

namespace Bolao.Functions.Admin;

public record ConfirmationClaim(int ResultVersion, ConfirmedResult Result);

public class ConfirmedResultPublisher(ResultPublicationService publication)
    : IConfirmedResultPublisher
{
    public Task PublishAsync(
        string matchId,
        string resultVersion,
        ConfirmedResult result,
        CancellationToken cancellationToken) =>
        publication.PublishAsync(matchId, resultVersion, result, cancellationToken);
}

public class ResultConfirmationService(
    IResultConfirmationStore store,
    ManualResultRosterValidator rosterValidator,
    IConfirmedResultPublisher publisher,
    IWinnerNotificationService notifications,
    TimeProvider timeProvider,
    ILogger<ResultConfirmationService> logger)
{
    public async Task<ConfirmationClaim> ConfirmAsync(
        string matchId,
        string confirmedBySub,
        CancellationToken cancellationToken)
    {
        var safeMatchId = LogSanitizer.Sanitize(matchId);
        var safeConfirmedBySub = LogSanitizer.Sanitize(confirmedBySub);
        logger.LogInformation(
            "Confirming result for match {MatchId} requested by {ConfirmedBySub}", safeMatchId, safeConfirmedBySub);

        ManualResultForConfirmation manualResult;
        try
        {
            manualResult = await store.GetManualResultAsync(matchId, cancellationToken)
                ?? throw new ResultValidationException($"No manual result exists for match '{matchId}'.");
            var result = manualResult.Draft.ToConfirmedResult(
                manualResult.HomeTeamFifaCode,
                manualResult.AwayTeamFifaCode);
            await rosterValidator.ValidateAsync(manualResult.Draft, cancellationToken);

            var claim = await store.ClaimConfirmationAsync(
                matchId,
                result,
                confirmedBySub,
                timeProvider.GetUtcNow(),
                cancellationToken);
            await publisher.PublishAsync(
                matchId,
                claim.ResultVersion.ToString(System.Globalization.CultureInfo.InvariantCulture),
                claim.Result,
                cancellationToken);
            await notifications.NotifyAsync(matchId, claim.ResultVersion, cancellationToken);

            logger.LogInformation(
                "Confirmed result for match {MatchId} at version {ResultVersion}", safeMatchId, claim.ResultVersion);
            return claim;
        }
        catch (ResultValidationException exception)
        {
            logger.LogWarning(exception, "Rejected result confirmation for match {MatchId}: invalid result", safeMatchId);
            throw;
        }
        catch (MatchNotFoundException exception)
        {
            logger.LogWarning(exception, "Rejected result confirmation for match {MatchId}: match not found", safeMatchId);
            throw;
        }
        catch (ResultAlreadyPublishedException exception)
        {
            logger.LogWarning(exception, "Rejected result confirmation for match {MatchId}: already confirmed", safeMatchId);
            throw;
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Unexpected error confirming result for match {MatchId}", safeMatchId);
            throw;
        }
    }

}

public class ResultValidationException(string message) : InvalidOperationException(message);
