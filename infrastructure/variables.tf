variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS Region to deploy resources"
}

variable "environment" {
  type        = string
  default     = "prod"
  description = "Deployment environment (dev, prod)"
}

variable "app_name" {
  type        = string
  default     = "cloudpulse"
  description = "Application name prefix"
}

variable "vpc_cidr" {
  type        = string
  default     = "10.0.0.0/16"
  description = "VPC CIDR block"
}

variable "db_password" {
  type        = string
  sensitive   = true
  default     = "CloudPulseSuperSecurePassword123!"
  description = "Password for PostgreSQL database"
}

variable "backend_image" {
  type        = string
  default     = "ghcr.io/soumyapratik12/cloudpulse_ai-backend:latest"
  description = "FastAPI backend Docker image tag"
}

variable "frontend_image" {
  type        = string
  default     = "ghcr.io/soumyapratik12/cloudpulse_ai-frontend:latest"
  description = "React frontend Docker image tag"
}

variable "image_tag" {
  type        = string
  default     = "latest"
  description = "Docker image tag to deploy (typically the git commit SHA)"
}
