using Bolao.Functions.Persistence;

namespace Bolao.Functions.Domain;

public class ResultPublicationService(
    IPredictionRepository predictions,
    IResultRepository results)
{
    public async Task PublishAsync(
        string matchId,
        string resultVersion,
        ConfirmedResult result,
        CancellationToken cancellationToken)
    {
        var storedPredictions = await predictions.ListByMatchAsync(matchId, cancellationToken);
        var updates = storedPredictions
            .Select(prediction => new StandingUpdate(
                prediction.ParticipantId,
                ScoreCalculator.Score(prediction.Answers, result),
                prediction.SubmittedAt))
            .ToArray();

        await results.PublishAsync(matchId, resultVersion, result, updates, cancellationToken);
    }

    public async Task PublishAsync(
        string matchId,
        string resultVersion,
        ConfirmedResult result,
        string previousResultVersion,
        ConfirmedResult previousResult,
        CancellationToken cancellationToken)
    {
        var storedPredictions = await predictions.ListByMatchAsync(matchId, cancellationToken);
        var adjustments = storedPredictions
            .Select(prediction =>
            {
                var previousScore = ScoreCalculator.Score(prediction.Answers, previousResult);
                var revisedScore = ScoreCalculator.Score(prediction.Answers, result);
                return new StandingAdjustment(
                    prediction.ParticipantId,
                    revisedScore.Total - previousScore.Total,
                    Convert.ToInt32(revisedScore.ExactScore) - Convert.ToInt32(previousScore.ExactScore),
                    Convert.ToInt32(revisedScore.FirstScorer == 3) - Convert.ToInt32(previousScore.FirstScorer == 3));
            })
            .ToArray();

        await results.ReviseAsync(
            matchId,
            previousResultVersion,
            resultVersion,
            result,
            adjustments,
            cancellationToken);
    }
}
