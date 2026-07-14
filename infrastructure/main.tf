terraform {
  required_version = ">= 1.5.0"
  backend "s3" {
    bucket         = "cloudpulse-tf-state-748189524661"
    key            = "production/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "cloudpulse-tf-locks"
    encrypt        = true
  }
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}
