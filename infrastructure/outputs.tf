output "alb_dns_name" {
  value       = aws_lb.app_alb.dns_name
  description = "Public Application Load Balancer DNS name"
}

output "rds_endpoint" {
  value       = aws_db_instance.db.endpoint
  description = "PostgreSQL database endpoint"
}

output "ecs_cluster_name" {
  value       = aws_ecs_cluster.cluster.name
  description = "ECS cluster name"
}
