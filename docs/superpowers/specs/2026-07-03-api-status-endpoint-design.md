# API Status Endpoint Design

## Goal

Provide a simple unauthenticated endpoint for checking that API Gateway can route a request to the application Lambda.

## Contract

`GET /status` returns HTTP 200 with this JSON body:

```json
{"status":"ok"}
```

The endpoint performs no DynamoDB, Cognito, or third-party checks. It therefore reports API Gateway routing and Lambda application availability without turning dependency failures into an unstable health contract or exposing deployment details.

## Implementation

Register the endpoint with the existing public ASP.NET endpoints and add `GET /status` to Terraform's explicit API Gateway public-route set. It requires no JWT authorizer.

## Verification

- Backend endpoint tests verify status code, JSON content type, and exact response body.
- A Terraform source audit verifies the route is present in `local.public_routes`.
- Backend tests, Terraform formatting/validation, and diff checks remain green.
