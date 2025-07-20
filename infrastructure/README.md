# Concepter Infrastructure

This directory contains the infrastructure as code (IaC) for the Concepter application using Terraform and Ansible.

This is currently deactivated! We are using Helm Charts for K8s deployments.

## Overview

The infrastructure consists of:

- **Terraform**: Provisions AWS resources (EC2, VPC, Security Groups, etc.)
- **Ansible**: Configures the server and deploys the application
- **Remote State Management**: S3 backend with DynamoDB locking for collaboration

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Client      │────│   API Gateway   │────│   Microservices │
│   (Angular)     │    │  (Spring Boot)  │    │  (Spring Boot)  │
│     :3000       │    │      :8080      │    │ user-svc :8081 │
└─────────────────┘    └─────────────────┘    │concept-svc:8082 │
                                              │genai-svc :8083 │
                                              └─────────────────┘
```

All services run in Docker containers on a single EC2 instance.

## Prerequisites

### For GitHub Actions Deployment
- AWS credentials configured in GitHub Secrets:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_SESSION_TOKEN` (if using temporary credentials)
- GitHub Token with appropriate permissions
- **Backend setup completed** (see Backend Setup section)

### For Local Development
- [Terraform](https://www.terraform.io/downloads.html) >= 1.6.0
- [Ansible](https://docs.ansible.com/ansible/latest/installation_guide/) >= 8.5.0
- [AWS CLI](https://aws.amazon.com/cli/) configured
- SSH client
- **Backend setup completed** (see Backend Setup section)

## Backend Setup (One-Time Setup)

⚠️ **IMPORTANT**: You must set up the Terraform backend BEFORE running any deployments.

### Automated Backend Setup

Run the setup script to create the S3 bucket and DynamoDB table:

```bash
cd infrastructure

# Set up backend with default settings
./setup-backend.sh

# Or specify custom project name and region
./setup-backend.sh my-project us-west-2
```

This creates:
- **S3 Bucket**: `concepter-terraform-state` (with versioning and encryption)
- **DynamoDB Table**: `concepter-terraform-locks` (for state locking)

### Manual Backend Setup

If you prefer manual setup or need to customize the backend configuration:

```bash
cd infrastructure

# The setup script creates temporary Terraform files and runs them
# You can also run the commands manually:

# 1. Create a temporary directory for backend setup
mkdir -p backend-setup

# 2. Run the setup script which handles everything
./setup-backend.sh

# 3. Or manually create the backend resources by examining the script
# and creating your own Terraform configuration
```

**Note**: The `setup-backend.sh` script is the recommended approach as it:
- Creates the necessary Terraform configuration dynamically
- Handles error checking and validation
- Provides clear output and cleanup
- Is safe to run multiple times (idempotent)

### State Management Features

✅ **Remote State Storage**: All state stored in S3 with encryption  
✅ **State Locking**: DynamoDB prevents concurrent modifications  
✅ **Environment Isolation**: Terraform workspaces separate staging/production  
✅ **State Versioning**: S3 versioning for state file history  
✅ **Collaboration**: Team members share the same state  

## GitHub Actions Deployment

### Automated Deployment

The infrastructure deployment is automated via GitHub Actions in `.github/workflows/infrastructure.yml`.

**Triggers:**
- Manual dispatch via GitHub UI
- Push to `main` or `feat/terraform` branches (when infrastructure files change)

**Workflow Features:**
- ✅ Multi-environment support (staging/production)
- ✅ Terraform plan/apply/destroy options
- ✅ Ansible configuration management
- ✅ Health checks and verification
- ✅ Secure credential handling
- ✅ Artifact management for Terraform outputs

### Manual Trigger

1. Go to GitHub Actions tab in your repository
2. Select "Deploy Infrastructure" workflow
3. Click "Run workflow"
4. Configure options:
   - **Environment**: `staging` or `production`
   - **Terraform Action**: `plan`, `apply`, or `destroy`
   - **Skip Ansible**: Check to skip application deployment

### Environment Variables

Configure these in your GitHub repository settings:

```yaml
# Required Secrets
AWS_ACCESS_KEY_ID: your-aws-access-key
AWS_SECRET_ACCESS_KEY: your-aws-secret-key
AWS_SESSION_TOKEN: your-aws-session-token  # If using temporary credentials
GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # Automatically provided

# Optional Variables
AWS_DEFAULT_REGION: us-east-1  # Default region
TF_VERSION: 1.6.0              # Terraform version
ANSIBLE_VERSION: 8.5.0         # Ansible version
```

## Local Development

### Quick Start

**First Time Setup:**
```bash
# 1. Set up the backend (one-time only)
cd infrastructure
./setup-backend.sh

# 2. Deploy your environment
./deploy.sh staging
```

**Regular Usage:**
```bash
# Deploy staging environment
./deploy.sh

# Deploy production environment
./deploy.sh production

# Plan only (no apply)
./deploy.sh staging plan

# Deploy without Ansible
./deploy.sh staging apply true

# Destroy environment
./deploy.sh staging destroy

# Get help
./deploy.sh --help
```

### Manual Deployment

#### 1. Terraform Deployment

```bash
cd terraform

# Initialize Terraform (connects to remote backend)
terraform init

# Select or create workspace for environment isolation
terraform workspace select staging || terraform workspace new staging

# Plan the deployment
terraform plan -var="environment=staging" -var="project_name=concepter-staging"

# Apply the changes
terraform apply -var="environment=staging" -var="project_name=concepter-staging"

# Get the instance IP
INSTANCE_IP=$(terraform output -raw instance_public_ip)
echo "Instance IP: $INSTANCE_IP"
```

#### 2. Ansible Configuration

```bash
cd ../ansible

# Extract SSH key from Terraform
terraform -chdir=../terraform output -raw private_key > ansible-key.pem
chmod 600 ansible-key.pem

# Create inventory with the instance IP
cat > inventory.ini << EOF
[app_server]
concepter-server ansible_host=${INSTANCE_IP} ansible_user=ubuntu ansible_ssh_private_key_file=ansible-key.pem ansible_ssh_common_args='-o StrictHostKeyChecking=no'
EOF

# Test connection
ansible all -i inventory.ini -m ping

# Deploy application
ANSIBLE_HOST_KEY_CHECKING=False ansible-playbook -i inventory.ini playbook.yml \
  --extra-vars "github_actor=$USER" \
  --extra-vars "github_token=$GITHUB_TOKEN" \
  --extra-vars "environment=staging"
```

## Infrastructure Components

### Terraform Resources

| Resource | Purpose |
|----------|---------|
| `aws_instance` | Main application server (Ubuntu 22.04) |
| `aws_eip` | Elastic IP for stable public access |
| `aws_security_group` | Firewall rules for HTTP/HTTPS/SSH |
| `aws_key_pair` | SSH key pair for server access |
| `tls_private_key` | Generated SSH private key |

### Ansible Playbook Tasks

| Task | Purpose |
|------|---------|
| System Setup | Update packages, install Docker |
| Docker Configuration | Setup Docker daemon and compose |
| Application Deployment | Pull and start containers |
| Health Checks | Verify application is running |

## Configuration

### Terraform Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `aws_region` | `us-east-1` | AWS region for deployment |
| `project_name` | `concepter` | Project name prefix |
| `instance_type` | `t2.micro` | EC2 instance type |
| `volume_size` | `10` | Root volume size (GB) |
| `environment` | `production` | Environment name |

### Ansible Variables

| Variable | Purpose |
|----------|---------|
| `docker_registry` | Container registry URL |
| `github_actor` | GitHub username for registry auth |
| `github_token` | GitHub token for registry auth |
| `environment` | Deployment environment |

## Networking

### Ports

| Port | Service | Access |
|------|---------|--------|
| 22 | SSH | External |
| 80 | HTTP | External |
| 443 | HTTPS | External |
| 3000 | Client App | External |
| 8080 | API Gateway | External |
| 8081 | User Service | Internal |
| 8082 | Concept Service | Internal |
| 8083 | GenAI Service | External |

### Security Groups

The security group allows:
- SSH (22) from anywhere
- HTTP (80) and HTTPS (443) from anywhere  
- Application ports (3000, 8080-8083) from anywhere
- All outbound traffic

## Monitoring and Maintenance

### Health Checks

The deployment includes automatic health checks:
- Instance connectivity via SSH
- Application responsiveness on port 3000
- Docker container status

### Logs

Access application logs:
```bash
# SSH to the instance
ssh -i ansible-key.pem ubuntu@<instance-ip>

# View Docker logs
docker compose -f compose.aws.yml logs -f

# View specific service logs
docker compose -f compose.aws.yml logs -f client
docker compose -f compose.aws.yml logs -f server
```

### Updates

To update the application:
1. Push new Docker images to the registry
2. Re-run the Ansible playbook or GitHub Actions workflow

## State Management

### Understanding Workspaces

The infrastructure uses Terraform workspaces for environment isolation:

```bash
# List workspaces
terraform workspace list

# Switch to staging
terraform workspace select staging

# Switch to production
terraform workspace select production

# Current workspace
terraform workspace show
```

### State Files

State files are stored in S3 with this structure:
```
concepter-terraform-state/
├── env:/staging/infrastructure/terraform.tfstate
├── env:/production/infrastructure/terraform.tfstate
└── infrastructure/terraform.tfstate (default workspace)
```

### State Commands

```bash
# View current state
terraform state list

# Import existing resources
terraform import aws_instance.app_server i-1234567890abcdef0

# Remove resource from state
terraform state rm aws_instance.old_server

# Show specific resource
terraform state show aws_instance.app_server
```

### Backup and Recovery

- **Automatic Backups**: S3 versioning keeps all state file versions
- **Manual Backup**: Download state file from S3 console
- **Recovery**: Restore from S3 version or backup file

```bash
# Download current state (emergency backup)
aws s3 cp s3://concepter-terraform-state/env:/staging/infrastructure/terraform.tfstate ./backup-state.json

# List all state versions
aws s3api list-object-versions --bucket concepter-terraform-state --prefix env:/staging/
```

## Troubleshooting

### Common Issues

#### Backend Issues
```bash
# Backend not initialized
terraform init -reconfigure

# State lock conflicts
terraform force-unlock LOCK_ID

# Backend bucket not found
cd infrastructure && ./setup-backend.sh
```

#### Terraform Issues
```bash
# Clear Terraform state lock
terraform force-unlock <lock-id>

# Refresh state
terraform refresh

# Import existing resources
terraform import aws_instance.app_server i-1234567890abcdef0

# Switch workspace if confused
terraform workspace select staging
```

#### Ansible Issues
```bash
# Test connectivity
ansible all -i inventory.ini -m ping

# Run specific tasks
ansible-playbook -i inventory.ini playbook.yml --tags="docker"

# Verbose output
ansible-playbook -i inventory.ini playbook.yml -vvv
```

#### Application Issues
```bash
# Check Docker status
docker ps
docker compose -f compose.aws.yml ps

# Restart services
docker compose -f compose.aws.yml restart

# View container logs
docker compose -f compose.aws.yml logs <service-name>
```

### Debug Mode

For debugging deployments, set these environment variables:
```bash
export TF_LOG=DEBUG
export ANSIBLE_DEBUG=1
export ANSIBLE_VERBOSITY=3
```

## Security Considerations

- SSH keys are generated automatically and stored securely
- Security groups follow principle of least privilege
- **State files are encrypted** in S3 with AES-256
- **State locking prevents** concurrent modifications
- Sensitive outputs are marked as sensitive in Terraform
- Private keys are handled securely and cleaned up after use
- **Backend access** controlled via AWS IAM permissions

## Cost Optimization

- Uses `t2.micro` instances (eligible for free tier)
- Minimal storage allocation (10GB)
- **S3 state storage**: Pay-per-request (very low cost)
- **DynamoDB locking**: Pay-per-request (minimal usage)
- Resources are tagged for cost tracking
- Easy to destroy environments when not needed

## Contributing

When modifying infrastructure:

1. Test changes locally first using `./deploy.sh staging plan`
2. Update documentation if adding new variables or resources
3. Follow Terraform and Ansible best practices
4. Test both Terraform and Ansible components

## Support

For issues or questions:
- Check the troubleshooting section above
- Review GitHub Actions logs for automated deployments
- Check AWS CloudTrail for AWS API issues
- Ensure all prerequisites are properly installed and configured 