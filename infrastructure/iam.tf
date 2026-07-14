resource "aws_iam_role" "ecs_execution_role" {
  name = "${var.app_name}-${var.environment}-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task_role" {
  name = "${var.app_name}-${var.environment}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "aws_readonly" {
  name        = "${var.app_name}-${var.environment}-aws-readonly"
  description = "Allows read-only access and remediation for CloudPulse to optimize AWS infrastructure"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "ec2:Describe*",
          "ec2:StopInstances",
          "ec2:StartInstances",
          "ec2:TerminateInstances",
          "rds:Describe*",
          "rds:StopDBInstance",
          "rds:StartDBInstance",
          "s3:List*",
          "s3:GetBucketLocation",
          "cloudwatch:GetMetricData",
          "cloudwatch:GetMetricStatistics",
          "ce:GetCostAndUsage",
          "sts:AssumeRole"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_readonly" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.aws_readonly.arn
}
