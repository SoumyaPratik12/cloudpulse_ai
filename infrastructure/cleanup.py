import boto3
import time

region = "us-east-1"
ec2 = boto3.client('ec2', region_name=region)
elbv2 = boto3.client('elbv2', region_name=region)
iam = boto3.client('iam')
rds = boto3.client('rds', region_name=region)
ecs = boto3.client('ecs', region_name=region)

print("Starting resource cleanup of orphaned cloudpulse-prod-* resources...")

# 1. Delete ECS Services & Cluster
try:
    services = ecs.list_services(cluster='cloudpulse-prod-cluster')['serviceArns']
    for s in services:
        ecs.update_service(cluster='cloudpulse-prod-cluster', service=s, desiredCount=0)
        ecs.delete_service(cluster='cloudpulse-prod-cluster', service=s)
        print(f"Deleted ECS service: {s}")
except Exception as e:
    pass

try:
    ecs.delete_cluster(cluster='cloudpulse-prod-cluster')
    print("Deleted ECS cluster")
except Exception as e:
    pass

# 2. Delete Load Balancer
try:
    albs = elbv2.describe_load_balancers(Names=['cloudpulse-prod-alb'])['LoadBalancers']
    for alb in albs:
        elbv2.delete_load_balancer(LoadBalancerArn=alb['LoadBalancerArn'])
        print(f"Deleted ALB: {alb['LoadBalancerArn']}")
        time.sleep(5)
except Exception as e:
    pass

# 3. Delete Target Groups
for tg_name in ['cloudpulse-prod-tg-fe', 'cloudpulse-prod-tg-be']:
    try:
        tgs = elbv2.describe_target_groups(Names=[tg_name])['TargetGroups']
        for tg in tgs:
            elbv2.delete_target_group(TargetGroupArn=tg['TargetGroupArn'])
            print(f"Deleted TG: {tg_name}")
    except Exception as e:
        pass

# 4. Delete DB Subnet Group
try:
    rds.delete_db_subnet_group(DBSubnetGroupName='cloudpulse-prod-db-subnets')
    print("Deleted DB Subnet Group")
except Exception as e:
    pass

# 5. Delete IAM Roles & Policies
try:
    iam.detach_role_policy(RoleName='cloudpulse-prod-ecs-execution-role', PolicyArn='arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy')
    print("Detached execution policy")
except Exception as e:
    pass

try:
    iam.delete_role(RoleName='cloudpulse-prod-ecs-execution-role')
    print("Deleted execution role")
except Exception as e:
    pass

try:
    sts = boto3.client('sts')
    acc_id = sts.get_caller_identity()['Account']
    policy_arn = f"arn:aws:iam::{acc_id}:policy/cloudpulse-prod-aws-readonly"
    iam.detach_role_policy(RoleName='cloudpulse-prod-ecs-task-role', PolicyArn=policy_arn)
    print("Detached read-only policy")
except Exception as e:
    pass

try:
    iam.delete_role(RoleName='cloudpulse-prod-ecs-task-role')
    print("Deleted task role")
except Exception as e:
    pass

try:
    iam.delete_policy(PolicyArn=policy_arn)
    print("Deleted IAM policy")
except Exception as e:
    pass

# 6. Delete VPCs and Networking
try:
    vpcs = ec2.describe_vpcs(Filters=[{'Name': 'tag:Name', 'Values': ['cloudpulse-prod-vpc']}])['Vpcs']
    for v in vpcs:
        vpc_id = v['VpcId']
        # Delete subnets
        subnets = ec2.describe_subnets(Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}])['Subnets']
        for sub in subnets:
            ec2.delete_subnet(SubnetId=sub['SubnetId'])
            print(f"Deleted Subnet: {sub['SubnetId']}")
        # Delete Internet Gateway
        igws = ec2.describe_internet_gateways(Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}])['InternetGateways']
        for igw in igws:
            ec2.detach_internet_gateway(InternetGatewayId=igw['InternetGatewayId'], VpcId=vpc_id)
            ec2.delete_internet_gateway(InternetGatewayId=igw['InternetGatewayId'])
            print(f"Deleted IGW: {igw['InternetGatewayId']}")
        # Delete Security Groups
        sgs = ec2.describe_security_groups(Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}])['SecurityGroups']
        for sg in sgs:
            if sg['GroupName'] != 'default':
                ec2.delete_security_group(GroupId=sg['GroupId'])
                print(f"Deleted Security Group: {sg['GroupId']}")
        # Delete VPC
        ec2.delete_vpc(VpcId=vpc_id)
        print(f"Deleted VPC: {vpc_id}")
except Exception as e:
    print(f"VPC cleanup info: {e}")

print("Cleanup complete!")
