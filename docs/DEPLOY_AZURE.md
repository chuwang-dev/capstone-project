# Azure Virtual Machine Deployment Guide

This guide provides step-by-step instructions for deploying the Simple CI/CD App to Azure VMs.

## Prerequisites

- Azure Account with active subscription
- Azure CLI installed locally
- SSH client installed
- GitHub repository with Actions enabled

## Step 1: Create Azure Resource Group

```bash
# Set variables
RESOURCE_GROUP="simple-cicd-app-rg"
LOCATION="eastus"
VM_NAME="simple-cicd-app-vm"
IMAGE="UbuntuLTS"

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION
```

## Step 2: Create Virtual Machine

### Using Azure CLI

```bash
# Create SSH key pair
ssh-keygen -m PEM -t rsa -b 4096 -f ~/.ssh/azure_vm_key

# Create network security group
NSG_NAME="simple-cicd-app-nsg"
az network nsg create \
  --resource-group $RESOURCE_GROUP \
  --name $NSG_NAME

# Add network security rules
# Allow SSH
az network nsg rule create \
  --resource-group $RESOURCE_GROUP \
  --nsg-name $NSG_NAME \
  --name AllowSSH \
  --priority 1000 \
  --destination-port-ranges 22 \
  --access Allow \
  --protocol Tcp

# Allow HTTP
az network nsg rule create \
  --resource-group $RESOURCE_GROUP \
  --nsg-name $NSG_NAME \
  --name AllowHTTP \
  --priority 1001 \
  --destination-port-ranges 80 \
  --access Allow \
  --protocol Tcp

# Allow HTTPS
az network nsg rule create \
  --resource-group $RESOURCE_GROUP \
  --nsg-name $NSG_NAME \
  --name AllowHTTPS \
  --priority 1002 \
  --destination-port-ranges 443 \
  --access Allow \
  --protocol Tcp

# Allow App port
az network nsg rule create \
  --resource-group $RESOURCE_GROUP \
  --nsg-name $NSG_NAME \
  --name AllowAppPort \
  --priority 1003 \
  --destination-port-ranges 3000 \
  --access Allow \
  --protocol Tcp

# Create VM
az vm create \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --image $IMAGE \
  --size Standard_B1s \
  --ssh-key-values ~/.ssh/azure_vm_key.pub \
  --public-ip-address-allocation static \
  --nsg $NSG_NAME \
  --admin-username azureuser \
  --os-disk-size-gb 30 \
  --os-disk-delete-option Delete \
  --tags Environment=production Application=simple-cicd-app
```

### Using Azure Portal

1. Click "Create a resource"
2. Search for "Virtual machine"
3. Click "Create"
4. **Basics tab:**
   - Subscription: Select yours
   - Resource group: Create `simple-cicd-app-rg`
   - VM name: `simple-cicd-app-vm`
   - Region: East US (or your preference)
   - Image: Ubuntu 22.04 LTS
   - Size: Standard_B1s or larger

5. **Networking tab:**
   - Create new virtual network
   - NIC network security group: Advanced
   - Configure security group to allow SSH, HTTP, HTTPS, and port 3000

6. **Management tab:**
   - Auto-shutdown: Optional
   - OS disk type: Premium SSD

7. Review and create

## Step 3: Get VM Details

```bash
# Get public IP
PUBLIC_IP=$(az vm show-ip-address \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --query "[0].publicIps" \
  --output tsv)

echo "VM Public IP: $PUBLIC_IP"

# Get FQDN (if configured)
FQDN=$(az vm show \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --show-details \
  --query "fqdns" \
  --output tsv)

echo "VM FQDN: $FQDN"
```

## Step 4: Connect to VM

```bash
# SSH into the VM
chmod 600 ~/.ssh/azure_vm_key
ssh -i ~/.ssh/azure_vm_key azureuser@$PUBLIC_IP

# Or using FQDN
ssh -i ~/.ssh/azure_vm_key azureuser@$FQDN
```

## Step 5: Setup the VM

```bash
# On the Azure VM:

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Download and run setup script
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/simple-cicd-app/main/scripts/setup-vm.sh
chmod +x setup-vm.sh
sudo ./setup-vm.sh
```

## Step 6: Configure GitHub Secrets

In your GitHub repository, go to Settings → Secrets and variables → Actions:

1. **DEPLOY_KEY**: Private SSH key content
   ```bash
   cat ~/.ssh/azure_vm_key | pbcopy  # macOS
   cat ~/.ssh/azure_vm_key | xclip -selection clipboard  # Linux
   ```

2. **VM_HOST**: Azure VM public IP or FQDN
   ```bash
   echo $PUBLIC_IP  # or echo $FQDN
   ```

3. **VM_USER**: `azureuser`

4. **DOCKER_USERNAME**: Your Docker registry username

5. **DOCKER_PASSWORD**: Docker registry password or token

## Step 7: Static IP (Optional but Recommended)

```bash
# Create static public IP
PUBLIC_IP_NAME="simple-cicd-app-pip"
az network public-ip create \
  --resource-group $RESOURCE_GROUP \
  --name $PUBLIC_IP_NAME \
  --sku Standard \
  --allocation-method Static

# Associate with NIC
NIC_ID=$(az vm show \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --query networkProfile.networkInterfaces[0].id \
  --output tsv)

NIC_NAME=$(echo $NIC_ID | rev | cut -d'/' -f1 | rev)

az network nic ip-config update \
  --resource-group $RESOURCE_GROUP \
  --nic-name $NIC_NAME \
  --name ipconfig1 \
  --public-ip-address $PUBLIC_IP_NAME
```

## Step 8: Trigger Deployment

1. Make a commit and push to the main branch
2. Navigate to GitHub Actions tab
3. Watch the CI/CD pipeline execute
4. Once complete, application will be deployed to Azure VM

## Step 9: Access Your Application

```bash
# Test the application
curl http://$PUBLIC_IP:3000
curl http://$PUBLIC_IP:3000/api/health

# Or using FQDN
curl http://$FQDN:3000
```

## Monitoring and Management

### View Logs
```bash
ssh -i ~/.ssh/azure_vm_key azureuser@$PUBLIC_IP
docker logs -f simple-cicd-app
```

### Monitor with Azure CLI
```bash
# Get VM status
az vm get-instance-view \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --query instanceView.statuses[?starts_with(code, 'PowerState/')] \
  --output table

# View boot diagnostics
az vm boot-diagnostics get-boot-log \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME
```

### Manual Deployment
```bash
ssh -i ~/.ssh/azure_vm_key azureuser@$PUBLIC_IP
cd /opt/app
bash scripts/deploy.sh ghcr.io/YOUR_USERNAME/simple-cicd-app:latest
```

### Rollback
```bash
ssh -i ~/.ssh/azure_vm_key azureuser@$PUBLIC_IP
bash scripts/rollback.sh --auto
```

## Troubleshooting

### Cannot SSH
- Verify network security group allows SSH from your IP
- Check key pair permissions: `chmod 600 ~/.ssh/azure_vm_key`
- Use Azure CLI to verify connectivity: `az vm open-port --resource-group $RESOURCE_GROUP --name $VM_NAME --port 22`

### Docker errors
- Verify Docker installation: `docker --version`
- Check Docker daemon: `sudo systemctl status docker`
- Verify Docker credentials are configured

### Application not responding
- Check container status: `docker ps -a`
- View logs: `docker logs simple-cicd-app`
- Verify network security group allows port 3000

### Disk full
```bash
# On the VM
docker system prune -a --volumes
df -h
```

## Cost Optimization

- Use B1s or B2s instance types for non-production
- Stop VM when not in use (retains disk costs)
- Use Azure Reserved Instances for long-term
- Monitor with Azure Cost Management

## Security Best Practices

✅ Use static IP for consistency
✅ Restrict NSG rules to specific IPs when possible
✅ Enable disk encryption at rest
✅ Use managed identities for Azure service access
✅ Enable Azure Security Center
✅ Keep OS and software updated
✅ Use Azure Bastion for SSH access (optional, more secure)
✅ Enable diagnostic logs
✅ Setup backup with Azure Backup

## Stopping and Starting VMs

```bash
# Stop (retains associated resources, billing continues)
az vm stop \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME

# Deallocate (stops billing for compute)
az vm deallocate \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME

# Start
az vm start \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME

# Remove everything
az group delete \
  --name $RESOURCE_GROUP \
  --yes --no-wait
```

## Next Steps

1. Configure Azure DNS zones for custom domain
2. Setup Application Gateway for load balancing
3. Configure Azure Application Insights for monitoring
4. Setup automated backups with Recovery Services vault
5. Implement Azure Policy for governance

For more information, see the main [README.md](../README.md)
