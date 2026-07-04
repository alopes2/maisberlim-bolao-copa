using System.Globalization;
using System.Text.Json;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Bolao.Functions.Api;
using Bolao.Functions.Domain;
using Bolao.Functions.Persistence;

namespace Bolao.Functions.Admin;

public class DynamoAdminApi(
    IAmazonDynamoDB client,
    DynamoDbOptions options,
    IPredictionRepository predictions,
    ManualResultRosterValidator rosterValidator) : IAdminApi
{
    public async Task UpdateMatchAsync(
        string matchId,
        UpdateAdminMatchRequest request,
        CancellationToken cancellationToken)
    {
        var updateExpression = "SET Kickoff = :kickoff, "
            + "HomeTeamFifaCode = :home, AwayTeamFifaCode = :away";
        var values = new Dictionary<string, AttributeValue>
        {
            [":kickoff"] = new(request.Kickoff.ToString("O", CultureInfo.InvariantCulture)),
            [":home"] = new(request.HomeTeamFifaCode),
            [":away"] = new(request.AwayTeamFifaCode)
        };
        if (request.PrizeHandedOverAt is not null)
        {
            updateExpression += ", PrizeHandedOverAt = :handedOverAt";
            values[":handedOverAt"] = new(
                request.PrizeHandedOverAt.Value.ToString("O", CultureInfo.InvariantCulture));
        }

        await client.UpdateItemAsync(new UpdateItemRequest
        {
            TableName = options.MatchesTableName,
            Key = Key(matchId),
            UpdateExpression = updateExpression,
            ConditionExpression = "attribute_exists(MatchId)",
            ExpressionAttributeValues = values
        }, cancellationToken);
    }

    public async Task<ManualResultDraft?> GetResultAsync(
        string matchId,
        CancellationToken cancellationToken)
    {
        var item = await GetMatchItemAsync(matchId, cancellationToken);
        if (!item.TryGetValue("ManualResultDraft", out var stored))
        {
            return null;
        }
        return JsonSerializer.Deserialize<ManualResultDraft>(stored.S)!;
    }

    public async Task<LeaderboardResponse> GetProvisionalLeaderboardAsync(
        string matchId,
        CancellationToken cancellationToken)
    {
        var item = await GetMatchItemAsync(matchId, cancellationToken);
        if (!item.TryGetValue("ManualResultDraft", out var stored))
        {
            return new LeaderboardResponse([], null);
        }

        var draft = JsonSerializer.Deserialize<ManualResultDraft>(stored.S)!;
        var result = draft.ToConfirmedResult(
            item["HomeTeamFifaCode"].S,
            item["AwayTeamFifaCode"].S);
        var scored = (await predictions.ListByMatchAsync(matchId, cancellationToken))
            .Select(prediction => new
            {
                Prediction = prediction,
                Score = ScoreCalculator.Score(prediction.Answers, result)
            })
            .OrderByDescending(item => item.Score.Total)
            .ThenByDescending(item => item.Score.ExactScore)
            .ThenByDescending(item => item.Score.FirstScorer == 3)
            .ThenBy(item => item.Prediction.SubmittedAt)
            .ToArray();

        var entries = new List<LeaderboardEntry>(scored.Length);
        for (var index = 0; index < scored.Length; index++)
        {
            var publicName = await GetPublicNameAsync(
                scored[index].Prediction.ParticipantId,
                cancellationToken);
            entries.Add(new LeaderboardEntry(
                index + 1,
                publicName,
                scored[index].Score.Total,
                scored[index].Score.ExactScore ? 1 : 0,
                scored[index].Score.FirstScorer == 3 ? 1 : 0));
        }

        var winner = entries.Count == 0 ? null : new RoundWinner(entries[0].PublicName, entries[0].TotalPoints);
        return new LeaderboardResponse(entries, winner);
    }

    public async Task SaveResultAsync(
        string matchId,
        ManualResultDraft result,
        CancellationToken cancellationToken)
    {
        var match = await GetMatchItemAsync(matchId, cancellationToken);
        _ = result.ToConfirmedResult(
            match["HomeTeamFifaCode"].S,
            match["AwayTeamFifaCode"].S);
        await rosterValidator.ValidateAsync(result, cancellationToken);

        try
        {
            await client.UpdateItemAsync(new UpdateItemRequest
            {
                TableName = options.MatchesTableName,
                Key = Key(matchId),
                UpdateExpression = "SET ManualResultDraft = :result",
                ConditionExpression = "attribute_exists(MatchId) AND "
                    + "(attribute_not_exists(PublishedResultVersion) OR #status = :active)",
                ExpressionAttributeNames = new Dictionary<string, string>
                {
                    ["#status"] = "Status"
                },
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":result"] = new(JsonSerializer.Serialize(result)),
                    [":active"] = new("Active")
                }
            }, cancellationToken);
        }
        catch (ConditionalCheckFailedException)
        {
            throw new ResultAlreadyConfirmedException(matchId);
        }
    }

    private async Task<Dictionary<string, AttributeValue>> GetMatchItemAsync(
        string matchId,
        CancellationToken cancellationToken)
    {
        var response = await client.GetItemAsync(new GetItemRequest
        {
            TableName = options.MatchesTableName,
            Key = Key(matchId),
            ConsistentRead = true
        }, cancellationToken);
        return response.Item is { Count: > 0 }
            ? response.Item
            : throw new MatchNotFoundException(matchId);
    }

    private async Task<string> GetPublicNameAsync(
        string participantId,
        CancellationToken cancellationToken)
    {
        var response = await client.GetItemAsync(new GetItemRequest
        {
            TableName = options.ParticipantsTableName,
            Key = new Dictionary<string, AttributeValue> { ["ParticipantId"] = new(participantId) },
            ProjectionExpression = "PublicName"
        }, cancellationToken);
        return response.Item.GetValueOrDefault("PublicName")?.S ?? "Participante";
    }

    private static Dictionary<string, AttributeValue> Key(string matchId) => new()
    {
        ["MatchId"] = new(matchId)
    };
}

public class DynamoResultConfirmationStore(
    IAmazonDynamoDB client,
    DynamoDbOptions options) : IResultConfirmationStore
{
    public async Task<ManualResultForConfirmation?> GetManualResultAsync(
        string matchId,
        CancellationToken cancellationToken)
    {
        var response = await GetAsync(matchId, cancellationToken);
        if (!response.TryGetValue("ManualResultDraft", out var result))
        {
            return null;
        }

        return new ManualResultForConfirmation(
            response["HomeTeamFifaCode"].S,
            response["AwayTeamFifaCode"].S,
            JsonSerializer.Deserialize<ManualResultDraft>(result.S)!);
    }

    public async Task<ConfirmationClaim> ClaimConfirmationAsync(
        string matchId,
        ConfirmedResult result,
        string confirmedBySub,
        DateTimeOffset confirmedAt,
        CancellationToken cancellationToken)
    {
        try
        {
            var response = await client.UpdateItemAsync(new UpdateItemRequest
            {
                TableName = options.MatchesTableName,
                Key = DynamoAdminApiKey(matchId),
                UpdateExpression = "SET ConfirmedBySub = :sub, ConfirmedAt = :at, "
                    + "ConfirmedSnapshot = :snapshot, ResultVersion = if_not_exists(ResultVersion, :zero) + :one",
                ConditionExpression = "attribute_not_exists(ConfirmedSnapshot)",
                ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":sub"] = new(confirmedBySub),
                    [":at"] = new(confirmedAt.ToString("O", CultureInfo.InvariantCulture)),
                    [":snapshot"] = new(JsonSerializer.Serialize(result)),
                    [":zero"] = new() { N = "0" },
                    [":one"] = new() { N = "1" }
                },
                ReturnValues = ReturnValue.ALL_NEW
            }, cancellationToken);
            return Claim(response.Attributes);
        }
        catch (ConditionalCheckFailedException)
        {
            var existing = await GetAsync(matchId, cancellationToken);
            var claim = Claim(existing);
            if (JsonSerializer.Serialize(claim.Result) == JsonSerializer.Serialize(result))
            {
                return claim;
            }

            if (existing.GetValueOrDefault("Status")?.S != "Active"
                || claim.PreviousResultVersion != claim.ResultVersion
                || claim.PreviousResult is null)
            {
                throw new ResultAlreadyPublishedException(matchId);
            }

            try
            {
                var response = await client.UpdateItemAsync(new UpdateItemRequest
                {
                    TableName = options.MatchesTableName,
                    Key = DynamoAdminApiKey(matchId),
                    UpdateExpression = "SET ConfirmedBySub = :sub, ConfirmedAt = :at, "
                        + "ConfirmedSnapshot = :snapshot, ResultVersion = ResultVersion + :one",
                    ConditionExpression = "#status = :active AND ResultVersion = :currentVersion "
                        + "AND PublishedResultVersion = :publishedVersion "
                        + "AND ConfirmedSnapshot = :previousSnapshot",
                    ExpressionAttributeNames = new Dictionary<string, string>
                    {
                        ["#status"] = "Status"
                    },
                    ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                    {
                        [":sub"] = new(confirmedBySub),
                        [":at"] = new(confirmedAt.ToString("O", CultureInfo.InvariantCulture)),
                        [":snapshot"] = new(JsonSerializer.Serialize(result)),
                        [":previousSnapshot"] = existing["ConfirmedSnapshot"],
                        [":currentVersion"] = new() { N = claim.ResultVersion.ToString(CultureInfo.InvariantCulture) },
                        [":publishedVersion"] = new(claim.PreviousResultVersion.Value.ToString(CultureInfo.InvariantCulture)),
                        [":active"] = new("Active"),
                        [":one"] = new() { N = "1" }
                    },
                    ReturnValues = ReturnValue.ALL_NEW
                }, cancellationToken);
                return Claim(response.Attributes);
            }
            catch (ConditionalCheckFailedException)
            {
                var latest = Claim(await GetAsync(matchId, cancellationToken));
                if (JsonSerializer.Serialize(latest.Result) == JsonSerializer.Serialize(result))
                {
                    return latest;
                }

                throw new ResultAlreadyPublishedException(matchId);
            }
        }
    }

    private async Task<Dictionary<string, AttributeValue>> GetAsync(
        string matchId,
        CancellationToken cancellationToken)
    {
        var response = await client.GetItemAsync(new GetItemRequest
        {
            TableName = options.MatchesTableName,
            Key = DynamoAdminApiKey(matchId),
            ConsistentRead = true
        }, cancellationToken);
        return response.Item is { Count: > 0 }
            ? response.Item
            : throw new MatchNotFoundException(matchId);
    }

    private static ConfirmationClaim Claim(IReadOnlyDictionary<string, AttributeValue> item) => new(
        int.Parse(item["ResultVersion"].N, CultureInfo.InvariantCulture),
        JsonSerializer.Deserialize<ConfirmedResult>(item["ConfirmedSnapshot"].S)!,
        item.TryGetValue("PublishedResultVersion", out var version)
            ? int.Parse(version.S, CultureInfo.InvariantCulture)
            : null,
        item.TryGetValue("ConfirmedResult", out var result)
            ? JsonSerializer.Deserialize<ConfirmedResult>(result.S)
            : null);

    private static Dictionary<string, AttributeValue> DynamoAdminApiKey(string matchId) => new()
    {
        ["MatchId"] = new(matchId)
    };
}
