# API Status Endpoint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public `GET /status` route that proves API Gateway can invoke the application Lambda and returns `{"status":"ok"}`.

**Architecture:** Register one dependency-free ASP.NET public endpoint and expose it through Terraform's existing explicit public route set. Do not query DynamoDB, Cognito, or external services.

**Tech Stack:** .NET 10 minimal APIs, xUnit/FluentAssertions, AWS API Gateway v2, Terraform.

**Execution constraint:** Do not stage or commit. Preserve unrelated working-tree and local Terraform files.

---

### Task 1: Add the Public Lambda Endpoint

**Files:**
- Modify: `backend/tests/Bolao.Functions.Tests/Api/PublicVisibilityTests.cs`
- Modify: `backend/tests/Bolao.Functions.Tests/Api/ParticipantEndpointTests.cs`
- Modify: `backend/src/Bolao.Functions/Api/PublicEndpoints.cs`

- [x] **Step 1: Write failing endpoint tests**

Add `/status` to `PublicRoutesDoNotRequireAuthentication`. Add this contract test to `PublicVisibilityTests`:

```csharp
[Fact]
public async Task StatusReturnsOkJson()
{
    await using var factory = new ParticipantEndpointTests.ApiFactory();

    var response = await factory.CreateClient().GetAsync("/status");

    response.StatusCode.Should().Be(HttpStatusCode.OK);
    response.Content.Headers.ContentType!.MediaType.Should().Be("application/json");
    (await response.Content.ReadAsStringAsync()).Should().Be("{\"status\":\"ok\"}");
}
```

- [x] **Step 2: Verify tests fail**

Run:

```bash
dotnet test backend/tests/Bolao.Functions.Tests/Bolao.Functions.Tests.csproj --filter "FullyQualifiedName~PublicVisibilityTests|FullyQualifiedName~PublicRoutesDoNotRequireAuthentication"
```

Expected: FAIL because `/status` is not registered.

- [x] **Step 3: Add the minimal endpoint**

At the start of `MapPublicEndpoints`, add:

```csharp
endpoints.MapGet("/status", () => Results.Ok(new { status = "ok" }));
```

- [x] **Step 4: Verify focused tests pass**

Run the same filtered `dotnet test` command.

Expected: PASS.

### Task 2: Register API Gateway Route and Verify

**Files:**
- Modify: `infra/api-gateway.tf`

- [x] **Step 1: Prove the route is absent**

Run:

```bash
rg -F '"GET /status"' infra/api-gateway.tf
```

Expected: exit 1 with no match.

- [x] **Step 2: Add the public route**

Add `"GET /status"` to `local.public_routes`. Do not add authorization or create a separate integration.

- [x] **Step 3: Verify Terraform and all backend tests**

Run:

```bash
terraform fmt -check -recursive infra
terraform -chdir=infra validate
dotnet test backend/Bolao.slnx --verbosity minimal
git diff --check
```

Expected: Terraform formatting and validation pass, all backend tests pass, and no whitespace errors are reported.

- [x] **Step 4: Audit scope and handoff**

Run `git status --short` and inspect the targeted diff. Confirm only the endpoint, its tests, Terraform route, design, and plan were added for this task. Report that both infrastructure and backend workflows must be deployed and that nothing was committed.
