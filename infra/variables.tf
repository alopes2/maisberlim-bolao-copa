variable "aws_region" {
  description = "AWS region for regional resources."
  type        = string
  default     = "eu-central-1"
}

variable "project_name" {
  description = "Stable project prefix used in resource names."
  type        = string
  default     = "bolaomaisberlim"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "dev"
}

variable "admin_emails" {
  description = "Verified Google email addresses that receive Cognito administrator claims."
  type        = set(string)
}

variable "cognito_domain_prefix" {
  description = "Globally unique Cognito managed-login domain prefix."
  type        = string
}

variable "google_client_id" {
  description = "Google OAuth web client ID used by Cognito."
  type        = string
}

variable "google_client_secret" {
  description = "Google OAuth web client secret used by Cognito."
  type        = string
  sensitive   = true
}
