# AWS EC2 Deployment Guide

This guide provides step-by-step instructions for deploying the Simple CI/CD App to Amazon EC2.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured locally
- SSH client installed
- GitHub repository with Actions enabled

## Step 1: Create EC2 Instance

### Using AWS Management Console

1. Navigate to EC2 Dashboard
2. Click "Launch Instance"
3. Select Ubuntu 22.04 LTS (HVM, SSD-backed)
4. Choose instance type: `t3.micro` (eligible for free tier) or larger
5. Configure instance details:
   - Network: Default VPC
   - Auto-assign public IP: Enable
6. Add storage: 20-30 GB (gp2 or gp3)
7. Add tags:
   - Name: `simple-cicd-app`
   - Environment: `production`
8. Configure security group:
   - Allow SSH from your IP (port 22)
   - Allow HTTP (port 80) from anywhere
   - Allow HTTPS (port 443) from anywhere
   - Allow custom TCP (port 3000) from anywhere (or your IP)
9. Review and launch
10. Create/select key pair (save the `.pem` file securely)

### Using AWS CLI

```bash
# Create security group
aws ec2 create-security-group \
  --group-name simple-cicd-app-sg \
  --description "Security group for Simple CI/CD App"

# Get security group ID
SG_ID=$(aws ec2 describe-security-groups \
  --filters Name=group-name,Values=simple-cicd-app-sg \
  --query 'SecurityGroups[0].GroupId' \
  --output text)

# Add inbound rules
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 3000 \
  --cidr 0.0.0.0/0

# Create instance
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.micro \
  --key-name my-key-pair \
  --security-group-ids $SG_ID \
  --tag-specifications \
    'ResourceType=instance,Tags=[{Key=Name,Value=simple-cicd-app},{Key=Environment,Value=production}]'
```

##
## Step 4: Configure GitHub Secrets

In your GitHub repository, go to Settings → Secrets and variables → Actions, and add:

1. **DEPLOY_KEY**: Private SSH key content (from the EC2 key pair)
2. **VM_HOST**: EC2 instance public IP address
3. **VM_USER**: `ubuntu` (default for Ubuntu AMI)
4. **DOCKER_USERNAME**: Your Docker registry username
5. **DOCKER_PASSWORD**: Docker registry password or token

### Getting the Private Key Content

```bash
cat your-key-pair.pem | pbcopy  # macOS
cat your-key-pair.pem | xclip -selection clipboard  # Linux
type your-key-pair.pem # Windows
```

Then paste it into the GitHub secret.

## Step 5: Elastic IP (Optional but Recommended)

To persist the IP address across stop/start cycles:

```bash
# Allocate Elastic IP
ELASTIC_IP=$(aws ec2 allocate-address \
  --domain vpc \
  --query 'PublicIp' \
  --output text)

# Associate with instance
aws ec2 associate-address \
  --instance-id $INSTANCE_ID \
  --public-ip $ELASTIC_IP
```

## Step 6: Trigger Deployment

1. Create a commit and push to main branch
2. Go to GitHub Actions tab
3. Watch the CI/CD pipeline execute
4. Once successful, your app will be deployed to EC2

## Step 7: Access Your Application

```bash
# Test the application
curl http://$PUBLIC_IP:3000
curl http://$PUBLIC_IP:3000/api/health
```

## Monitoring and Management

### View Logs
```bash
ssh -i your-key-pair.pem ubuntu@$PUBLIC_IP
docker logs -f simple-cicd-app
```

### Update Application
Just push to the main branch - the CI/CD pipeline will handle deployment automatically.

### Manual Deployment
```bash
ssh -i your-key-pair.pem ubuntu@$PUBLIC_IP
cd /opt/app
bash scripts/deploy.sh ghcr.io/YOUR_USERNAME/simple-cicd-app:latest
```

### Rollback
```bash
ssh -i your-key-pair.pem ubuntu@$PUBLIC_IP
bash scripts/rollback.sh --auto
```

## Troubleshooting

### Cannot SSH
- Verify security group allows SSH from your IP
- Check key pair permissions: `chmod 400 your-key-pair.pem`
- Verify public IP in AWS console

### Docker pull fails
- Check Docker credentials: `docker login ghcr.io`
- Verify DOCKER_PASSWORD secret is set correctly

### Health check fails
- Check logs: `docker logs simple-cicd-app`
- Verify port 3000 is accessible: `curl http://localhost:3000/api/health`

### Out of storage
```bashssh -i ~/.ssh/id_ed25519 ubuntu@54.208.89.58
# On the instance
docker system prune -a --volumes
```

## Cost Optimization

- Use t3.micro for free tier eligibility (first 12 months)
- Stop instance when not in use
- Monitor CloudWatch metrics
- Consider setting up auto-scaling for production

## Security Best Practices

✅ Use Elastic IP for consistent address
✅ Enable VPC Flow Logs for network monitoring
✅ Use IAM roles instead of hardcoding credentials
✅ Enable CloudTrail for audit logging
✅ Keep security group rules as restrictive as possible
✅ Regularly update system and Docker images
✅ Use AWS Secrets Manager for sensitive data
✅ Enable EC2 Instance Health Checks

## Next Steps

1. Configure DNS with Route 53 (optional)
2. Setup SSL certificate with ACM
3. Add CloudWatch alarms for monitoring
4. Configure auto-scaling policies
5. Setup backup and disaster recovery

For more information, see the main [README.md](../README.md)
