terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

provider "aws" {
  region = "us-east-1"
  alias  = "useast1"
  default_tags {
    tags = {
      application = var.project_name
    }
  }
}

data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  common_tags = {
    application = var.project_name
    environment = var.environment
  }
}
