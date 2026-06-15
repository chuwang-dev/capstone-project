# HealthSync Terraform Configuration for AWS
This folder contains Terraform configurations to provision AWS infrastructure for the HealthSync DevOps platform.

## Structure

- `main.tf` — Core configuration (providers, variables, outputs)
- `networking/` — VPC, subnets, route tables
- `compute/` — EC2 instances, security groups
- `security/` — IAM roles, policies

## Quick Start

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

## Variables

See `variables.tf` for customizable parameters (region, instance type, etc.).
