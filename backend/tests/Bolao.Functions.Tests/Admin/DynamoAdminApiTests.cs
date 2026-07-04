using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Bolao.Functions.Admin;
using Bolao.Functions.Api;
using Bolao.Functions.Domain;
using Bolao.Functions.Persistence;
using Bolao.Functions.Rosters;
using NSubstitute;
using FluentAssertions;
using System.Text.Json;

namespace Bolao.Functions.Tests.Admin;

public class DynamoAdminApiTests
{
    [Fact]
    public async Task UpdateChangesOnlyManualMatchAttributes()
    {
        var client = Substitute.For<IAmazonDynamoDB>();
        client.UpdateItemAsync(Arg.Any<UpdateItemRequest>(), default)
            .Returns(new UpdateItemResponse());
        var service = new DynamoAdminApi(
            client,
            Options(),
            Substitute.For<IPredictionRepository>(),
            RosterValidator());

        await service.UpdateMatchAsync(
            "archived",
            new UpdateAdminMatchRequest(
                DateTimeOffset.Parse("2026-07-10T18:00:00Z"), "BRA", "ARG",
                DateTimeOffset.Parse("2026-07-11T18:00:00Z")),
            default);

        await client.Received(1).UpdateItemAsync(
            Arg.Is<UpdateItemRequest>(request =>
                request.ConditionExpression == "attribute_exists(MatchId)"
                && request.UpdateExpression.Contains("PrizeHandedOverAt")), default);
    }

    [Fact]
    public async Task SaveResultValidatesAgainstStoredMatchTeamsBeforeWriting()
    {
        var client = Substitute.For<IAmazonDynamoDB>();
        client.GetItemAsync(Arg.Any<GetItemRequest>(), default).Returns(new GetItemResponse
        {
            Item = MatchItem()
        });
        var service = Service(client);

        var action = () => service.SaveResultAsync(
            "match-1", new ManualResultDraft([new("GER", "GER:9")], 0, 0, 0, 0, null), default);

        await action.Should().ThrowAsync<ResultValidationException>();
        await client.DidNotReceiveWithAnyArgs().UpdateItemAsync(default!, default);
    }

    [Fact]
    public async Task SaveResultRejectsSyntacticallyValidPlayerMissingFromRoster()
    {
        var client = Substitute.For<IAmazonDynamoDB>();
        client.GetItemAsync(Arg.Any<GetItemRequest>(), default).Returns(new GetItemResponse
        {
            Item = MatchItem()
        });

        var action = () => Service(client).SaveResultAsync(
            "match-1", new ManualResultDraft([new("BRA", "BRA:999")], 0, 0, 0, 0, null), default);

        await action.Should().ThrowAsync<ResultValidationException>().WithMessage("*BRA:999*roster*");
        await client.DidNotReceiveWithAnyArgs().UpdateItemAsync(default!, default);
    }

    [Fact]
    public async Task SaveResultMissingMatchThrowsMatchNotFound()
    {
        var client = Substitute.For<IAmazonDynamoDB>();
        client.GetItemAsync(Arg.Any<GetItemRequest>(), default).Returns(new GetItemResponse { Item = [] });

        var action = () => Service(client).SaveResultAsync(
            "missing", new ManualResultDraft([], 0, 0, 0, 0, null), default);

        await action.Should().ThrowAsync<MatchNotFoundException>();
    }

    [Fact]
    public async Task SaveResultConditionalFailureThrowsAlreadyConfirmed()
    {
        var client = Substitute.For<IAmazonDynamoDB>();
        client.GetItemAsync(Arg.Any<GetItemRequest>(), default).Returns(new GetItemResponse { Item = MatchItem() });
        client.UpdateItemAsync(Arg.Any<UpdateItemRequest>(), default)
            .Returns<Task<UpdateItemResponse>>(_ => throw new ConditionalCheckFailedException("published"));

        var action = () => Service(client).SaveResultAsync(
            "match-1", new ManualResultDraft([], 0, 0, 0, 0, null), default);

        await action.Should().ThrowAsync<ResultAlreadyConfirmedException>();
    }

    [Fact]
    public async Task SaveResultAllowsRevisionForPublishedActiveMatch()
    {
        var item = MatchItem();
        item["Status"] = new("Active");
        item["PublishedResultVersion"] = new("1");
        var client = Substitute.For<IAmazonDynamoDB>();
        client.GetItemAsync(Arg.Any<GetItemRequest>(), default)
            .Returns(new GetItemResponse { Item = item });
        UpdateItemRequest? request = null;
        client.UpdateItemAsync(
                Arg.Do<UpdateItemRequest>(value => request = value),
                default)
            .Returns(new UpdateItemResponse());

        await Service(client).SaveResultAsync(
            "match-1", new ManualResultDraft([], 0, 0, 0, 0, null), default);

        request!.ConditionExpression.Should().Contain("#status = :active");
        request.ExpressionAttributeNames["#status"].Should().Be("Status");
        request.ExpressionAttributeValues[":active"].S.Should().Be("Active");
    }

    [Fact]
    public async Task ConfirmationStoreMissingMatchThrowsMatchNotFound()
    {
        var client = Substitute.For<IAmazonDynamoDB>();
        client.GetItemAsync(Arg.Any<GetItemRequest>(), default)
            .Returns(new GetItemResponse { Item = [] });
        var store = new DynamoResultConfirmationStore(client, Options());

        var action = () => store.GetManualResultAsync("missing", default);

        await action.Should().ThrowAsync<MatchNotFoundException>();
    }

    [Fact]
    public async Task ConfirmationStoreReturnsClaimFromUpdatedSnapshot()
    {
        var result = new ConfirmedResult(
            2, 1, "BRA:10", new HashSet<string> { "BRA:10" }, new HashSet<string> { "ARG:9" }, 1, 2, 0, 0);
        var client = Substitute.For<IAmazonDynamoDB>();
        client.UpdateItemAsync(Arg.Any<UpdateItemRequest>(), default).Returns(new UpdateItemResponse
        {
            Attributes = new Dictionary<string, AttributeValue>
            {
                ["ResultVersion"] = new() { N = "1" },
                ["ConfirmedSnapshot"] = new(JsonSerializer.Serialize(result))
            }
        });
        var store = new DynamoResultConfirmationStore(client, Options());

        var claim = await store.ClaimConfirmationAsync(
            "match-1", result, "admin-sub", DateTimeOffset.UtcNow, default);

        claim.Result.Should().BeEquivalentTo(result);
    }

    [Fact]
    public async Task ConfirmationStoreClaimsRevisionForPublishedActiveMatch()
    {
        var previous = new ConfirmedResult(
            2, 1, "BRA:10", new HashSet<string> { "BRA:10" }, new HashSet<string> { "ARG:9" }, 1, 2, 0, 0);
        var revised = previous with { HomeGoals = 1, AwayGoals = 1 };
        var existing = new Dictionary<string, AttributeValue>
        {
            ["Status"] = new("Active"),
            ["ResultVersion"] = new() { N = "1" },
            ["PublishedResultVersion"] = new("1"),
            ["ConfirmedSnapshot"] = new(JsonSerializer.Serialize(previous)),
            ["ConfirmedResult"] = new(JsonSerializer.Serialize(previous))
        };
        var revisedItem = new Dictionary<string, AttributeValue>(existing)
        {
            ["ResultVersion"] = new() { N = "2" },
            ["ConfirmedSnapshot"] = new(JsonSerializer.Serialize(revised))
        };
        var client = Substitute.For<IAmazonDynamoDB>();
        client.UpdateItemAsync(Arg.Any<UpdateItemRequest>(), default)
            .Returns(
                _ => throw new ConditionalCheckFailedException("already confirmed"),
                _ => new UpdateItemResponse { Attributes = revisedItem });
        client.GetItemAsync(Arg.Any<GetItemRequest>(), default)
            .Returns(new GetItemResponse { Item = existing });
        var store = new DynamoResultConfirmationStore(client, Options());

        var claim = await store.ClaimConfirmationAsync(
            "match-1", revised, "admin-sub", DateTimeOffset.UtcNow, default);

        claim.ResultVersion.Should().Be(2);
        claim.Result.Should().BeEquivalentTo(revised);
        claim.PreviousResultVersion.Should().Be(1);
        claim.PreviousResult.Should().BeEquivalentTo(previous);
    }

    private static DynamoAdminApi Service(IAmazonDynamoDB client) =>
        new(client, Options(), Substitute.For<IPredictionRepository>(), RosterValidator());

    private static ManualResultRosterValidator RosterValidator() =>
        new(new StubRosterCatalog());

    private class StubRosterCatalog : IRosterCatalog
    {
        public async Task<IReadOnlyList<TeamRoster>> GetTeamsAsync(CancellationToken cancellationToken) =>
            [
                await GetTeamAsync("BRA", cancellationToken),
                await GetTeamAsync("ARG", cancellationToken)
            ];

        public Task<TeamRoster> GetTeamAsync(string fifaCode, CancellationToken cancellationToken)
        {
            var key = fifaCode == "BRA" ? "BRA:10" : "ARG:9";
            return Task.FromResult(new TeamRoster(
                fifaCode, fifaCode, string.Empty, [new Player(key, 1, string.Empty, key)]));
        }
    }

    private static Dictionary<string, AttributeValue> MatchItem() => new()
    {
        ["MatchId"] = new("match-1"),
        ["HomeTeamFifaCode"] = new("BRA"),
        ["AwayTeamFifaCode"] = new("ARG")
    };

    private static DynamoDbOptions Options() => new()
    {
        ParticipantsTableName = "participants",
        MatchesTableName = "matches",
        PredictionsTableName = "predictions",
        StandingsTableName = "standings"
    };
}
