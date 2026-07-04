using System.Globalization;
using System.Text.Json;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Bolao.Functions.Domain;

namespace Bolao.Functions.Persistence;

public class DynamoResultRepository(
    IAmazonDynamoDB client,
    DynamoDbOptions options) : IResultRepository
{
    public async Task PublishAsync(
        string matchId,
        string resultVersion,
        ConfirmedResult result,
        IReadOnlyList<StandingUpdate> updates,
        CancellationToken cancellationToken)
    {
        var publishedVersion = await GetPublishedVersionAsync(matchId, cancellationToken);
        if (publishedVersion == resultVersion)
        {
            return;
        }

        if (publishedVersion is not null)
        {
            throw new ResultAlreadyPublishedException(matchId);
        }

        if (updates.Count <= 99)
        {
            await PublishTransactionAsync(matchId, resultVersion, result, updates, cancellationToken);
            return;
        }

        foreach (var update in updates)
        {
            try
            {
                await client.UpdateItemAsync(
                    ToUpdateItemRequest(StandingRequest(matchId, resultVersion, update)),
                    cancellationToken);
            }
            catch (ConditionalCheckFailedException)
            {
                // This participant was already applied by an earlier attempt.
            }
        }

        await MarkPublishedAsync(matchId, resultVersion, result, cancellationToken);
    }

    public async Task ReviseAsync(
        string matchId,
        string previousResultVersion,
        string resultVersion,
        ConfirmedResult result,
        IReadOnlyList<StandingAdjustment> adjustments,
        CancellationToken cancellationToken)
    {
        var publishedVersion = await GetPublishedVersionAsync(matchId, cancellationToken);
        if (publishedVersion == resultVersion)
        {
            return;
        }
        if (publishedVersion != previousResultVersion)
        {
            throw new ResultAlreadyPublishedException(matchId);
        }

        if (adjustments.Count <= 99)
        {
            var transaction = adjustments
                .Select(adjustment => new TransactWriteItem
                {
                    Update = RevisionStandingRequest(
                        matchId, previousResultVersion, resultVersion, adjustment)
                })
                .Append(new TransactWriteItem
                {
                    Update = RevisionMatchRequest(
                        matchId, previousResultVersion, resultVersion, result)
                })
                .ToList();
            try
            {
                await client.TransactWriteItemsAsync(
                    new TransactWriteItemsRequest { TransactItems = transaction },
                    cancellationToken);
            }
            catch (TransactionCanceledException)
            {
                await ResolvePublicationRaceAsync(matchId, resultVersion, cancellationToken);
            }
            return;
        }

        foreach (var adjustment in adjustments)
        {
            try
            {
                await client.UpdateItemAsync(
                    ToUpdateItemRequest(RevisionStandingRequest(
                        matchId, previousResultVersion, resultVersion, adjustment)),
                    cancellationToken);
            }
            catch (ConditionalCheckFailedException)
            {
                // This participant was already adjusted by an earlier attempt.
            }
        }

        try
        {
            await client.UpdateItemAsync(
                ToUpdateItemRequest(RevisionMatchRequest(
                    matchId, previousResultVersion, resultVersion, result)),
                cancellationToken);
        }
        catch (ConditionalCheckFailedException)
        {
            await ResolvePublicationRaceAsync(matchId, resultVersion, cancellationToken);
        }
    }

    private async Task PublishTransactionAsync(
        string matchId,
        string resultVersion,
        ConfirmedResult result,
        IReadOnlyList<StandingUpdate> updates,
        CancellationToken cancellationToken)
    {
        var transaction = updates
            .Select(update => new TransactWriteItem { Update = StandingRequest(matchId, resultVersion, update) })
            .Append(new TransactWriteItem { Update = MatchRequest(matchId, resultVersion, result) })
            .ToList();

        try
        {
            await client.TransactWriteItemsAsync(
                new TransactWriteItemsRequest { TransactItems = transaction },
                cancellationToken);
        }
        catch (TransactionCanceledException)
        {
            await ResolvePublicationRaceAsync(matchId, resultVersion, cancellationToken);
        }
    }

    private async Task MarkPublishedAsync(
        string matchId,
        string resultVersion,
        ConfirmedResult result,
        CancellationToken cancellationToken)
    {
        try
        {
            await client.UpdateItemAsync(
                ToUpdateItemRequest(MatchRequest(matchId, resultVersion, result)),
                cancellationToken);
        }
        catch (ConditionalCheckFailedException)
        {
            await ResolvePublicationRaceAsync(matchId, resultVersion, cancellationToken);
        }
    }

    private async Task ResolvePublicationRaceAsync(
        string matchId,
        string resultVersion,
        CancellationToken cancellationToken)
    {
        var publishedVersion = await GetPublishedVersionAsync(matchId, cancellationToken);
        if (publishedVersion == resultVersion)
        {
            return;
        }

        if (publishedVersion is not null)
        {
            throw new ResultAlreadyPublishedException(matchId);
        }

        throw new InvalidOperationException($"Publishing result for match '{matchId}' was canceled.");
    }

    private async Task<string?> GetPublishedVersionAsync(
        string matchId,
        CancellationToken cancellationToken)
    {
        var response = await client.GetItemAsync(
            new GetItemRequest
            {
                TableName = options.MatchesTableName,
                Key = MatchKey(matchId),
                ProjectionExpression = "PublishedResultVersion",
                ConsistentRead = true
            },
            cancellationToken);

        return response.Item is not null
            && response.Item.TryGetValue("PublishedResultVersion", out var version)
                ? version.S
                : null;
    }

    private Update StandingRequest(string matchId, string resultVersion, StandingUpdate update)
    {
        return new Update
        {
            TableName = options.StandingsTableName,
            Key = new Dictionary<string, AttributeValue>
            {
                ["ParticipantId"] = new(update.ParticipantId)
            },
            UpdateExpression = "SET TotalPoints = if_not_exists(TotalPoints, :zero) + :points, "
                + "ExactScoreCount = if_not_exists(ExactScoreCount, :zero) + :exact, "
                + "FirstScorerCount = if_not_exists(FirstScorerCount, :zero) + :first, "
                + "FinalSubmissionAt = if_not_exists(FinalSubmissionAt, :submittedAt), "
                + "#appliedVersion = :version "
                + "ADD AppliedMatches :appliedMatch",
            ConditionExpression = "attribute_not_exists(AppliedMatches) OR NOT contains(AppliedMatches, :matchId)",
            ExpressionAttributeNames = new Dictionary<string, string>
            {
                ["#appliedVersion"] = AppliedVersionAttribute(matchId)
            },
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                [":zero"] = Number(0),
                [":points"] = Number(update.Score.Total),
                [":exact"] = Number(update.Score.ExactScore ? 1 : 0),
                [":first"] = Number(update.Score.FirstScorer == 3 ? 1 : 0),
                [":submittedAt"] = new(update.SubmittedAt.ToString("O", CultureInfo.InvariantCulture)),
                [":matchId"] = new(matchId),
                [":appliedMatch"] = new() { SS = [matchId] },
                [":version"] = new(resultVersion)
            }
        };
    }

    private Update RevisionStandingRequest(
        string matchId,
        string previousResultVersion,
        string resultVersion,
        StandingAdjustment adjustment) => new()
    {
        TableName = options.StandingsTableName,
        Key = new Dictionary<string, AttributeValue>
        {
            ["ParticipantId"] = new(adjustment.ParticipantId)
        },
        UpdateExpression = "SET TotalPoints = TotalPoints + :points, "
            + "ExactScoreCount = ExactScoreCount + :exact, "
            + "FirstScorerCount = FirstScorerCount + :first, "
            + "#appliedVersion = :version",
        ConditionExpression = "contains(AppliedMatches, :matchId) AND "
            + "(attribute_not_exists(#appliedVersion) OR #appliedVersion = :previousVersion)",
        ExpressionAttributeNames = new Dictionary<string, string>
        {
            ["#appliedVersion"] = AppliedVersionAttribute(matchId)
        },
        ExpressionAttributeValues = new Dictionary<string, AttributeValue>
        {
            [":points"] = Number(adjustment.Points),
            [":exact"] = Number(adjustment.ExactScoreCount),
            [":first"] = Number(adjustment.FirstScorerCount),
            [":matchId"] = new(matchId),
            [":previousVersion"] = new(previousResultVersion),
            [":version"] = new(resultVersion)
        }
    };

    private Update MatchRequest(string matchId, string resultVersion, ConfirmedResult result)
    {
        return new Update
        {
            TableName = options.MatchesTableName,
            Key = MatchKey(matchId),
            UpdateExpression = "SET ConfirmedResult = :result, PublishedResultVersion = :version",
            ConditionExpression = "attribute_not_exists(PublishedResultVersion)",
            ExpressionAttributeValues = new Dictionary<string, AttributeValue>
            {
                [":result"] = new(JsonSerializer.Serialize(result)),
                [":version"] = new(resultVersion)
            }
        };
    }

    private Update RevisionMatchRequest(
        string matchId,
        string previousResultVersion,
        string resultVersion,
        ConfirmedResult result) => new()
    {
        TableName = options.MatchesTableName,
        Key = MatchKey(matchId),
        UpdateExpression = "SET ConfirmedResult = :result, PublishedResultVersion = :version",
        ConditionExpression = "PublishedResultVersion = :previousVersion",
        ExpressionAttributeValues = new Dictionary<string, AttributeValue>
        {
            [":result"] = new(JsonSerializer.Serialize(result)),
            [":previousVersion"] = new(previousResultVersion),
            [":version"] = new(resultVersion)
        }
    };

    private static string AppliedVersionAttribute(string matchId) => $"AppliedResultVersion:{matchId}";

    private static Dictionary<string, AttributeValue> MatchKey(string matchId)
    {
        return new Dictionary<string, AttributeValue>
        {
            ["MatchId"] = new(matchId)
        };
    }

    private static AttributeValue Number(int value)
    {
        return new AttributeValue { N = value.ToString(CultureInfo.InvariantCulture) };
    }

    private static UpdateItemRequest ToUpdateItemRequest(Update update)
    {
        return new UpdateItemRequest
        {
            TableName = update.TableName,
            Key = update.Key,
            UpdateExpression = update.UpdateExpression,
            ConditionExpression = update.ConditionExpression,
            ExpressionAttributeNames = update.ExpressionAttributeNames,
            ExpressionAttributeValues = update.ExpressionAttributeValues
        };
    }
}
