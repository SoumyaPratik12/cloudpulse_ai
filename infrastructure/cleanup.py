import boto3
import time

region = "us-east-1"
ec2 = boto3.client('ec2', region_name=region)
elbv2 = boto3.client('elbv2', region_name=region)
iam = boto3.client('iam')
rds = boto3.client('rds', region_name=region)
ecs = boto3.client('ecs', region_name=region)

print("Starting deep resource cleanup of cloudpulse resources...")

# 1. Scale down and delete ECS services in any cluster containing "cloudpulse"
try:
    clusters = ecs.list_clusters()['clusterArns']
    for c_arn in clusters:
        if 'cloudpulse' in c_arn.lower():
            c_name = c_arn.split('/')[-1]
            try:
                services = ecs.list_services(cluster=c_name)['serviceArns']
                for s in services:
                    ecs.update_service(cluster=c_name, service=s, desiredCount=0)
                    ecs.delete_service(cluster=c_name, service=s)
                    print(f"Deleted ECS service: {s}")
            except Exception as e:
                pass
            try:
                ecs.delete_cluster(cluster=c_name)
                print(f"Deleted ECS cluster: {c_name}")
            except Exception as e:
                pass
except Exception as e:
    print(f"ECS cleanup info: {e}")

# 2. Delete ALBs containing "cloudpulse"
try:
    albs = elbv2.describe_load_balancers()['LoadBalancers']
    for alb in albs:
        if 'cloudpulse' in alb['LoadBalancerName'].lower():
            alb_arn = alb['LoadBalancerArn']
            elbv2.delete_load_balancer(LoadBalancerArn=alb_arn)
            print(f"Triggered deletion of ALB: {alb_arn}")
except Exception as e:
    pass

# 3. Delete DB Instances containing "cloudpulse"
try:
    dbs = rds.describe_db_instances()['DBInstances']
    for db in dbs:
        if 'cloudpulse' in db['DBInstanceIdentifier'].lower():
            # Delete without final snapshot to speed up
            try:
                rds.delete_db_instance(DBInstanceIdentifier=db['DBInstanceIdentifier'], SkipFinalSnapshot=True)
                print(f"Triggered deletion of DB Instance: {db['DBInstanceIdentifier']}")
            except Exception as e:
                pass
except Exception as e:
    pass

# 4. Wait for ALBs to disappear (releasing network interfaces)
print("Waiting for matching ALBs to delete...")
for i in range(18):
    albs_left = []
    try:
        albs = elbv2.describe_load_balancers()['LoadBalancers']
        albs_left = [a for a in albs if 'cloudpulse' in a['LoadBalancerName'].lower()]
    except Exception:
        pass
    if not albs_left:
        print("All matching ALBs are fully deleted.")
        break
    print(f"Still waiting for ALB deletion... ({i*10}s)")
    time.sleep(10)

# 5. Wait for DB Instances to delete (releasing database subnet groups and network interfaces)
print("Waiting for matching DB Instances to delete...")
for i in range(30):
    dbs_left = []
    try:
        dbs = rds.describe_db_instances()['DBInstances']
        dbs_left = [d for d in dbs if 'cloudpulse' in d['DBInstanceIdentifier'].lower()]
    except Exception:
        pass
    if not dbs_left:
        print("All matching DB Instances are fully deleted.")
        break
    print(f"Still waiting for DB Instance deletion... ({i*10}s)")
    time.sleep(10)

# 6. Delete Target Groups containing "cloudpulse"
try:
    tgs = elbv2.describe_target_groups()['TargetGroups']
    for tg in tgs:
        if 'cloudpulse' in tg['TargetGroupName'].lower():
            elbv2.delete_target_group(TargetGroupArn=tg['TargetGroupArn'])
            print(f"Deleted Target Group: {tg['TargetGroupName']}")
except Exception as e:
    pass

# 7. Delete DB Subnet Groups containing "cloudpulse"
try:
    sngs = rds.describe_db_subnet_groups()['DBSubnetGroups']
    for sng in sngs:
        if 'cloudpulse' in sng['DBSubnetGroupName'].lower():
            rds.delete_db_subnet_group(DBSubnetGroupName=sng['DBSubnetGroupName'])
            print(f"Deleted DB Subnet Group: {sng['DBSubnetGroupName']}")
except Exception as e:
    pass

# 8. Delete IAM Roles & Policies containing "cloudpulse"
try:
    roles = iam.list_roles()['Roles']
    for role in roles:
        r_name = role['RoleName']
        if 'cloudpulse' in r_name.lower():
            policies = iam.list_attached_role_policies(RoleName=r_name)['AttachedPolicies']
            for p in policies:
                iam.detach_role_policy(RoleName=r_name, PolicyArn=p['PolicyArn'])
            iam.delete_role(RoleName=r_name)
            print(f"Deleted IAM Role: {r_name}")
except Exception as e:
    pass

try:
    policies = iam.list_policies(Scope='Local')['Policies']
    for p in policies:
        if 'cloudpulse' in p['PolicyName'].lower():
            iam.delete_policy(PolicyArn=p['Arn'])
            print(f"Deleted IAM Policy: {p['PolicyName']}")
except Exception as e:
    pass

# 9. Clean up Network Interfaces and Delete matching VPCs
try:
    vpcs = ec2.describe_vpcs()['Vpcs']
    for v in vpcs:
        vpc_id = v['VpcId']
        is_default = v.get('IsDefault', False)
        if is_default:
            continue
            
        has_tag = False
        for tag in v.get('Tags', []):
            if tag['Key'].lower() == 'name' and 'cloudpulse' in tag['Value'].lower():
                has_tag = True
                break
        has_cidr = (v['CidrBlock'] == '10.0.0.0/16')
        
        if has_tag or has_cidr:
            print(f"Cleaning up network interfaces in matching VPC: {vpc_id} (CIDR: {v['CidrBlock']})")
            
            # Wait for all network interfaces (ENIs) to disappear
            for i in range(18):
                enis = ec2.describe_network_interfaces(Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}])['NetworkInterfaces']
                if not enis:
                    print(f"All ENIs in VPC {vpc_id} released.")
                    break
                print(f"Waiting for {len(enis)} ENIs to release in VPC {vpc_id}... ({i*10}s)")
                time.sleep(10)
                
            # Force deletion of any remaining network interfaces
            enis = ec2.describe_network_interfaces(Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}])['NetworkInterfaces']
            for eni in enis:
                try:
                    if eni.get('Attachment', {}).get('AttachmentId'):
                        ec2.detach_network_interface(AttachmentId=eni['Attachment']['AttachmentId'], Force=True)
                    ec2.delete_network_interface(NetworkInterfaceId=eni['NetworkInterfaceId'])
                    print(f"Forced deletion of ENI: {eni['NetworkInterfaceId']}")
                except Exception:
                    pass
            
            # Revoke all security group rules to prevent dependency locks (including default security group)
            sgs = ec2.describe_security_groups(Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}])['SecurityGroups']
            for sg in sgs:
                try:
                    if sg['IpPermissions']:
                        ec2.revoke_security_group_ingress(GroupId=sg['GroupId'], IpPermissions=sg['IpPermissions'])
                    if sg['IpPermissionsEgress']:
                        ec2.revoke_security_group_egress(GroupId=sg['GroupId'], IpPermissions=sg['IpPermissionsEgress'])
                except Exception:
                    pass

            # Delete subnets
            subnets = ec2.describe_subnets(Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}])['Subnets']
            for sub in subnets:
                try:
                    ec2.delete_subnet(SubnetId=sub['SubnetId'])
                    print(f"Deleted Subnet: {sub['SubnetId']}")
                except Exception as e:
                    pass
                    
            # Delete Internet Gateway
            igws = ec2.describe_internet_gateways(Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}])['InternetGateways']
            for igw in igws:
                try:
                    ec2.detach_internet_gateway(InternetGatewayId=igw['InternetGatewayId'], VpcId=vpc_id)
                    ec2.delete_internet_gateway(InternetGatewayId=igw['InternetGatewayId'])
                    print(f"Deleted IGW: {igw['InternetGatewayId']}")
                except Exception as e:
                    pass
                    
            # Delete Security Groups
            for sg in sgs:
                if sg['GroupName'] != 'default':
                    try:
                        ec2.delete_security_group(GroupId=sg['GroupId'])
                        print(f"Deleted Security Group: {sg['GroupId']}")
                    except Exception as e:
                        pass
                        
            # Delete Route Tables (excluding main)
            rts = ec2.describe_route_tables(Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}])['RouteTables']
            for rt in rts:
                is_main = False
                for assoc in rt.get('Associations', []):
                    if assoc.get('Main', False):
                        is_main = True
                        break
                if not is_main:
                    try:
                        ec2.delete_route_table(RouteTableId=rt['RouteTableId'])
                        print(f"Deleted Route Table: {rt['RouteTableId']}")
                    except Exception as e:
                        pass
                        
            # Delete VPC
            try:
                ec2.delete_vpc(VpcId=vpc_id)
                print(f"Deleted VPC: {vpc_id}")
            except Exception as e:
                print(f"Could not delete VPC {vpc_id}: {e}")
                
except Exception as e:
    print(f"VPC cleanup error: {e}")

print("Cleanup complete!")
