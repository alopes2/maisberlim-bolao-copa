# Scoring, Rules, and Datenschutz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the main score-and-winner prediction worth up to 15 points, explain all points publicly, and add discoverable bilingual privacy information.

**Architecture:** Keep scoring in the existing pure `ScoreCalculator` and preserve all persistence contracts. Keep legal content in focused frontend components, add one reusable legal footer, and use the app's existing pathname routing without introducing a router. `/datenschutz` and `/privacidade` render the same public page.

**Tech Stack:** .NET 10, xUnit, FluentAssertions, React 19, TypeScript, Vitest, Testing Library, Tailwind/shadcn.

**Execution constraint:** Do not commit, stage, or alter unrelated local files. The repository owner explicitly requested no commits.

---

## File Map

- Modify `backend/src/Bolao.Functions/Domain/ScoreCalculator.cs`: calculate exact-score, winner, and combination awards.
- Modify `backend/tests/Bolao.Functions.Tests/Domain/ScoreCalculatorTests.cs`: define the new scoring contract and maximum.
- Modify `frontend/src/features/legal/RulesPage.tsx`: publish the new point table and penalty explanation.
- Create `frontend/src/features/legal/RulesPage.test.tsx`: verify visible scoring rules.
- Modify `frontend/src/features/legal/PrivacyPage.tsx`: replace the short notice with bilingual Article 13-oriented content.
- Create `frontend/src/features/legal/PrivacyPage.test.tsx`: verify both languages and material disclosures.
- Create `frontend/src/features/legal/LegalFooter.tsx`: reusable bottom-page Datenschutz link.
- Modify `frontend/src/features/match/CurrentMatchPage.tsx`: show the legal footer with and without an active match.
- Modify `frontend/src/auth/SignInPage.tsx`: expose Datenschutz before Google starts collecting identity data.
- Modify `frontend/src/App.tsx`: add the rules button and `/datenschutz` public route alias.
- Modify `frontend/src/App.test.tsx`: verify navigation and public routes.
- Modify `frontend/src/features/match/CurrentMatchPage.test.tsx`: verify the participant footer link.
- Modify `frontend/src/auth/SignInPage.test.tsx`: verify the pre-login privacy link.

### Task 1: Define and Implement Main Prediction Scoring

**Files:**
- Modify: `backend/tests/Bolao.Functions.Tests/Domain/ScoreCalculatorTests.cs`
- Modify: `backend/src/Bolao.Functions/Domain/ScoreCalculator.cs`

- [ ] **Step 1: Replace the old result-scoring theories with the new contract**

Replace tests that expect `5`, `4`, or `2` result points with explicit cases:

```csharp
[Theory]
[InlineData(2, 1, 2, 1, 15)]
[InlineData(1, 0, 2, 0, 5)]
[InlineData(1, 1, 2, 0, 0)]
[InlineData(1, 1, 2, 2, 5)]
public void ScoresExactScoreWinnerAndCombination(
    int predictedHome,
    int predictedAway,
    int actualHome,
    int actualAway,
    int expected)
{
    ScoreCalculator.ScoreResult(predictedHome, predictedAway, actualHome, actualAway)
        .Should().Be(expected);
}

[Theory]
[InlineData("BRA", "BRA", 15)]
[InlineData("ARG", "BRA", 5)]
[InlineData(null, "BRA", 5)]
[InlineData(null, null, 15)]
public void ScoresPenaltyWinnerSeparatelyFromExactDraw(
    string? predictedWinner,
    string? actualWinner,
    int expected)
{
    ScoreCalculator.ScoreResult(1, 1, predictedWinner, 1, 1, actualWinner)
        .Should().Be(expected);
}

[Theory]
[InlineData("BRA", "BRA", 5)]
[InlineData("ARG", "BRA", 0)]
[InlineData(null, "BRA", 0)]
[InlineData(null, null, 5)]
public void ScoresWinnerForNonExactDraw(
    string? predictedWinner,
    string? actualWinner,
    int expected)
{
    ScoreCalculator.ScoreResult(1, 1, predictedWinner, 2, 2, actualWinner)
        .Should().Be(expected);
}
```

Keep the `ExactScore` flag assertion, but change expected result points for exact penalty misses from `4` to `5`, and exact matches from `5` to `15`. Rename `MaximumScoreIsEighteen` to `MaximumScoreIsTwentyEight` and assert `28`.

- [ ] **Step 2: Run the focused backend tests and observe the expected failures**

Run:

```bash
dotnet test backend/tests/Bolao.Functions.Tests/Bolao.Functions.Tests.csproj --filter FullyQualifiedName~ScoreCalculatorTests
```

Expected: FAIL because the implementation still returns the old 5/4/2 values and maximum 18.

- [ ] **Step 3: Implement three-part main scoring**

Replace the body of the six-argument `ScoreResult` overload with:

```csharp
var exactScore = predictedHome == actualHome && predictedAway == actualAway;
var actualIsDraw = actualHome == actualAway;

var correctWinner = actualIsDraw && actualPenaltyWinner is not null
    ? predictedPenaltyWinner == actualPenaltyWinner
    : Math.Sign(predictedHome - predictedAway) == Math.Sign(actualHome - actualAway);

var points = 0;
if (exactScore)
{
    points += 5;
}

if (correctWinner)
{
    points += 5;
}

if (exactScore && correctWinner)
{
    points += 5;
}

return points;
```

Do not change `ScoreBreakdown`, persistence models, secondary scoring, or leaderboard tie-breakers.

- [ ] **Step 4: Run focused and full backend tests**

Run:

```bash
dotnet test backend/tests/Bolao.Functions.Tests/Bolao.Functions.Tests.csproj --filter FullyQualifiedName~ScoreCalculatorTests
dotnet test backend/Bolao.slnx
```

Expected: both commands PASS. If the solution filename differs, use the existing solution/project path reported by `rg --files backend | rg '\.(sln|slnx)$'`.

### Task 2: Publish the New Rules

**Files:**
- Create: `frontend/src/features/legal/RulesPage.test.tsx`
- Modify: `frontend/src/features/legal/RulesPage.tsx`

- [ ] **Step 1: Write the rules-page test**

Create a test that renders `RulesPage` and asserts the essential public contract:

```tsx
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { RulesPage } from './RulesPage'

describe('RulesPage', () => {
  it('explains main, secondary, and penalty scoring', () => {
    render(<RulesPage />)

    expect(screen.getByText('Placar exato')).toBeVisible()
    expect(screen.getByText('Vencedor ou empate correto')).toBeVisible()
    expect(screen.getByText('Bônus: placar exato e vencedor corretos')).toBeVisible()
    expect(screen.getAllByText('5 pts')).toHaveLength(3)
    expect(screen.getByText(/ganhador nos pênaltis representa o vencedor/i)).toBeVisible()
    expect(screen.getByText(/máximo é 28 pontos/i)).toBeVisible()
    expect(screen.getByText('Primeiro jogador a marcar')).toBeVisible()
    expect(screen.getByText('Amarelos exatos de cada seleção')).toBeVisible()
  })
})
```

- [ ] **Step 2: Run the test and observe failure**

Run:

```bash
npm run test:run -- RulesPage.test.tsx
```

Working directory: `frontend`.

Expected: FAIL because the page still documents 5/4/2 and 18 points.

- [ ] **Step 3: Update the public score table**

Make the first rows of `scoring` exactly:

```tsx
const scoring = [
  ['Placar exato', '5'],
  ['Vencedor ou empate correto', '5'],
  ['Bônus: placar exato e vencedor corretos', '5'],
  ['Primeiro jogador a marcar', '3'],
  ['Artilheiro isolado de cada seleção', '3'],
  ['Um dos artilheiros empatados de cada seleção', '2'],
  ['Amarelos exatos de cada seleção', '1'],
  ['Vermelhos exatos de cada seleção', '1'],
]
```

Replace the explanatory paragraph with concise text stating that the three main awards accumulate to 15 points, a penalty winner is the winner component when applicable, an exact score with the wrong/missing penalty winner earns only the 5 exact-score points, secondary categories total at most 13, 0–0 has no scorer points, and the overall maximum is 28.

- [ ] **Step 4: Run the focused frontend test**

Run `npm run test:run -- RulesPage.test.tsx` from `frontend`.

Expected: PASS.

### Task 3: Add Discoverable Legal Navigation

**Files:**
- Create: `frontend/src/features/legal/LegalFooter.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/features/match/CurrentMatchPage.tsx`
- Modify: `frontend/src/auth/SignInPage.tsx`
- Modify: `frontend/src/App.test.tsx`
- Modify: `frontend/src/features/match/CurrentMatchPage.test.tsx`
- Modify: `frontend/src/auth/SignInPage.test.tsx`

- [ ] **Step 1: Add failing navigation assertions**

In `App.test.tsx`, extend the authenticated-header test:

```tsx
const rulesLink = screen.getByRole('link', { name: 'Regras' })
expect(rulesLink).toHaveAttribute('href', '/regras')
expect(rulesLink.compareDocumentPosition(screen.getByRole('button', { name: 'Sair' })))
  .toBe(Node.DOCUMENT_POSITION_FOLLOWING)
```

Add a public-route test that sets `/datenschutz`, renders an unauthenticated `App`, and expects `Datenschutzerklärung` without calling sign-in. Repeat the assertion for `/privacidade`.

In `CurrentMatchPage.test.tsx`, assert the empty-state rendering contains a `Datenschutz` link with `href="/datenschutz"`. Add the same assertion to the existing sign-in page test so disclosure is available before Google authentication.

- [ ] **Step 2: Run the focused tests and observe failure**

Run from `frontend`:

```bash
npm run test:run -- App.test.tsx CurrentMatchPage.test.tsx SignInPage.test.tsx
```

Expected: FAIL because the links and `/datenschutz` route do not exist.

- [ ] **Step 3: Create a reusable legal footer**

Create `LegalFooter.tsx`:

```tsx
export function LegalFooter() {
  return (
    <footer className="mt-auto py-4 text-center text-sm text-muted-foreground">
      <a className="underline underline-offset-4 hover:text-foreground" href="/datenschutz">
        Datenschutz
      </a>
    </footer>
  )
}
```

- [ ] **Step 4: Add the rules button and privacy aliases**

In `App.tsx`:

```tsx
if (window.location.pathname === '/regras') return <RulesPage />
if (['/datenschutz', '/privacidade'].includes(window.location.pathname)) {
  return <PrivacyPage />
}
```

Place these controls together in the authenticated header, preserving `Regras` immediately before `Sair`:

```tsx
<div className="flex items-center gap-2">
  <Button variant="outline" asChild>
    <a href="/regras">Regras</a>
  </Button>
  <Button variant="outline" onClick={handleSignOut} disabled={signingOut}>
    Sair
  </Button>
</div>
```

- [ ] **Step 5: Render the footer before and after authentication**

Import and render `LegalFooter` as the last child of both return branches in `CurrentMatchPage` (active match and no active match). Update the sign-in layout from a single centered card to a full-height flex column so the card remains centered and `LegalFooter` is at the bottom. Do not duplicate the footer markup.

- [ ] **Step 6: Run the navigation tests**

Run from `frontend`:

```bash
npm run test:run -- App.test.tsx CurrentMatchPage.test.tsx SignInPage.test.tsx
```

Expected: PASS.

### Task 4: Replace the Privacy Notice with Bilingual Datenschutz Content

**Files:**
- Create: `frontend/src/features/legal/PrivacyPage.test.tsx`
- Modify: `frontend/src/features/legal/PrivacyPage.tsx`

- [ ] **Step 1: Write the disclosure test**

Create `PrivacyPage.test.tsx` with assertions for content rather than styling:

```tsx
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PrivacyPage } from './PrivacyPage'

describe('PrivacyPage', () => {
  it('publishes the material disclosures in Portuguese and German', () => {
    render(<PrivacyPage />)

    expect(screen.getByRole('heading', { name: 'Privacidade' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Datenschutzerklärung' })).toBeVisible()
    expect(screen.getAllByText(/Andre Lopes/).length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText(/Augusto Medeiros/).length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText(/Dernburgstr 23A, 14057 Berlin/).length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByRole('link', { name: 'maisberlim@gmail.com' })).toHaveLength(2)
    expect(screen.getAllByRole('link', { name: 'andrevitorlopes@gmail.com' })).toHaveLength(2)
    expect(screen.getByText(/e-mail verificado/i)).toBeVisible()
    expect(screen.getByText(/verifizierte E-Mail-Adresse/i)).toBeVisible()
    expect(screen.getAllByText(/90 dias|90 Tage/i)).toHaveLength(2)
    expect(screen.getByText(/direito de acesso/i)).toBeVisible()
    expect(screen.getByText(/Recht auf Auskunft/i)).toBeVisible()
    expect(screen.getByText(/não usamos publicidade nem ferramentas de análise/i)).toBeVisible()
    expect(screen.getByText(/keine Werbung und keine Analysewerkzeuge/i)).toBeVisible()
  })
})
```

- [ ] **Step 2: Run the test and observe failure**

Run `npm run test:run -- PrivacyPage.test.tsx` from `frontend`.

Expected: FAIL because the current page is short and Portuguese-only.

- [ ] **Step 3: Implement the Portuguese disclosure**

Use semantic headings, paragraphs, and lists. Include these factual sections:

1. `Responsáveis e contato`: Andre Lopes and Augusto Medeiros, Dernburgstr 23A, 14057 Berlin, with `mailto:` links for both emails.
2. `Dados e origem`: verified email, Google/Cognito identifiers/profile data, name/public name, predictions, scores, and timestamps, obtained from the participant and Google login.
3. `Finalidades e bases`: authentication and participation administration under Art. 6(1)(b) GDPR; integrity, abuse prevention, and secure operation under Art. 6(1)(f), identifying those legitimate interests.
4. `Prestadores e transferências`: AWS for Cognito, hosting, API, database, logs, and optional winner email; Google for authentication. State that providers may process data outside the EEA using their applicable GDPR transfer safeguards; do not claim all processing remains only in Germany.
5. `Visibilidade pública`: abbreviated public name, predictions after closure, scores, ranking, and round winners; full name and email are not public.
6. `Prazo`: delete or anonymize personal data 90 days after the last relevant prize handover; anonymous aggregates may remain.
7. `Decisões automatizadas`: deterministic scoring from admin-confirmed results, with no Art. 22 legal/similarly significant automated decision.
8. `Direitos`: access, rectification, deletion, restriction, objection, portability where applicable, and complaint to a competent authority; requests accepted through either email.
9. State that participation cannot operate without required identity and prediction data and that the current app uses neither advertising nor analytics tools.

- [ ] **Step 4: Implement the equivalent German disclosure**

Below the Portuguese section, add `lang="de"` content with headings: `Verantwortliche und Kontakt`, `Verarbeitete Daten und Herkunft`, `Zwecke und Rechtsgrundlagen`, `Dienstleister und Drittlandübermittlungen`, `Öffentliche Sichtbarkeit`, `Speicherdauer`, `Automatisierte Bewertung`, and `Ihre Rechte`. Keep every controller fact, purpose, data category, retention rule, public field, provider, legal basis, and right materially equivalent to Portuguese.

Do not present this as legal advice or invent a data-protection officer. Link official provider privacy information only if using stable official URLs.

- [ ] **Step 5: Run legal-page tests**

Run from `frontend`:

```bash
npm run test:run -- PrivacyPage.test.tsx RulesPage.test.tsx App.test.tsx
```

Expected: PASS.

### Task 5: Full Verification and Diff Audit

**Files:**
- Verify all files listed above.
- Do not modify unrelated Terraform local-variable files.

- [ ] **Step 1: Run backend verification**

Run:

```bash
dotnet test backend/Bolao.slnx
```

Expected: PASS with zero failed tests.

- [ ] **Step 2: Run frontend verification**

Run from `frontend`:

```bash
npm run test:run
npm run lint
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 3: Audit formatting and scope**

Run from the repository root:

```bash
git diff --check
git status --short
git diff -- backend/src/Bolao.Functions/Domain/ScoreCalculator.cs backend/tests/Bolao.Functions.Tests/Domain/ScoreCalculatorTests.cs frontend/src docs/superpowers
```

Expected: no whitespace errors; only the approved scoring, rules, navigation, Datenschutz, tests, specification, and plan are changed. Existing untracked local Terraform files remain untouched.

- [ ] **Step 4: Report deployment impact**

Report that both backend and frontend workflows must be deployed: backend contains the scoring behavior and frontend contains rules/navigation/privacy. Explicitly state that already-published leaderboard entries are not recalculated and that nothing was committed.
