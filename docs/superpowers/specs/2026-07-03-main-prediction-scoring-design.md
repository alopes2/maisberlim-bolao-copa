# Main Prediction Scoring Design

## Goal

Make the predicted score and match winner the most valuable part of a prediction, while retaining goalscorer and card predictions as secondary scoring categories. Display the complete scoring rules on the existing public rules page.

## Scoring

The main prediction is calculated from three independent awards:

- exact score: 5 points;
- correct winner or draw outcome: 5 points;
- exact score and correct winner together: an additional 5-point combination bonus.

This produces these main-prediction totals:

| Prediction | Points |
| --- | ---: |
| Exact score and correct winner | 15 |
| Exact score only | 5 |
| Correct winner or draw outcome only | 5 |
| Neither | 0 |

For a tied match decided by penalties, the penalty winner is the winner component. An exact score with a wrong or missing penalty winner receives 5 points. A non-exact draw with the correct penalty winner receives 5 points. An exact draw without a penalty shootout receives all 15 points because both the exact score and draw outcome are correct.

Existing secondary values remain unchanged: first scorer 3 points; each unique team top scorer 3 points or a matching joint top scorer 2 points; and each exact team/card-color count 1 point. Their combined maximum is 13 points, below the 15-point main prediction. The new overall maximum is 28 points.

## User Interface

Update the existing `Regras do bolão` page rather than adding another scoring view. List the four main-prediction outcomes separately, retain every secondary category, explain how penalty winners affect scoring, and state the 28-point maximum.

Add a `Regras` button immediately to the left of `Sair` in the authenticated application header. The rules page remains publicly accessible without authentication.

## Datenschutz

Replace the existing basic privacy notice with one bilingual page at `/datenschutz`, with Portuguese first and German second. Keep `/privacidade` as a compatibility alias to the same page. Add a `Datenschutz` link in the footer at the bottom of the participant-facing page. The privacy page remains publicly accessible without authentication.

Identify the joint controllers as:

- Andre Lopes;
- Augusto Medeiros;
- Dernburgstr 23A, 14057 Berlin;
- `maisberlim@gmail.com`;
- `andrevitorlopes@gmail.com`.

Both language sections must describe:

- the collected data: verified email, Google/Cognito identity data, name and derived public name, predictions, scores, and relevant timestamps;
- the purposes: authentication, one participation per person, competition administration, abuse prevention, scoring/ranking, and contacting or validating prize winners;
- Google and AWS/Cognito as service providers involved in authentication and hosting/data processing;
- that abbreviated public names, predictions after their visibility deadline, scores, rankings, and winners may be shown publicly;
- that there is no advertising or analytics processing in the current application;
- that scoring is calculated automatically from administrator-confirmed match results, without legal or similarly significant automated decisions;
- the applicable processing grounds, data-source and required-data disclosures, recipients, and any relevant international-transfer safeguards;
- deletion or anonymization of personal data 90 days after the last relevant prize handover, while anonymous aggregate competition results may remain;
- GDPR rights to access, correction, deletion, restriction, objection, portability where applicable, and complaint to a competent supervisory authority;
- how to exercise those rights using either contact email.

The text is an application disclosure based on the implemented data flow, not a substitute for review by a qualified German privacy professional.

## Compatibility

No prediction or result schema changes are required. The new rules apply to results confirmed after deployment; already-published leaderboard entries are not migrated or recalculated. Existing leaderboard tie-breakers remain unchanged.

## Verification

- Domain tests cover all four main outcomes, penalty and non-penalty draws, and the 28-point maximum.
- Rules-page tests verify that users can see the main awards, combination bonus, penalty behavior, and maximum.
- Navigation tests verify the authenticated `Regras` button and participant-page `Datenschutz` footer link.
- Legal-page tests verify public access, the `/privacidade` alias, both languages, controller details, email collection and purposes, retention, and data-subject rights.
- Existing backend and frontend test suites remain green.
