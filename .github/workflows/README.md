# CI/CD Pipeline Documentation

## Overview

This directory contains the GitHub Actions workflow files that make up our CI/CD pipeline. The pipeline is structured to ensure proper separation of concerns between Continuous Integration (building/testing) and Continuous Deployment (deploying to environments).

## Workflow Files

### 1. [`ci.yml`](./ci.yml)

**Purpose**: Handles all Continuous Integration tasks including code generation, testing, and building Docker images.

**Key Features**:
- API validation and code generation
- Running tests for all services
- Building and pushing Docker images
- Building API documentation

**Triggered by**:
- Push to `main` or `dev` branches
- Pull requests to `main` or `dev`

### 2. [`cd.yml`](./cd.yml)

**Purpose**: Handles all Continuous Deployment tasks to staging and production environments.

**Key Features**:
- Proper dependency on CI workflow completion
- Environment-specific deployments (staging for `dev` branch, production for `main` branch)
- Kubernetes deployments with Helm
- Deployment verification

**Triggered by**:
- Successful completion of the CI workflow on `main` or `dev` branches

### 3. [`infrastructure.yml`](./infrastructure.yml)

**Purpose**: Manages infrastructure deployments using Terraform and Ansible.

**Key Features**:
- Creates and updates AWS infrastructure
- Configures server environments
- Manages environment-specific deployments

**Triggered by**:
- Manual workflow dispatch
- Changes to infrastructure files on `main` branch

### 4. [`validate_pr.yml`](./validate_pr.yml)

**Purpose**: Validates pull requests for code quality and potential issues.

**Key Features**:
- Linting and static analysis
- Size checks for large PRs
- API spec validation

**Triggered by**:
- Pull request creation or updates

## Pipeline Flow

1. **Code Changes**: Developer makes changes and creates a PR
2. **PR Validation**: `validate_pr.yml` runs checks on the PR
3. **CI Pipeline**: After merge/push, `ci.yml` builds and tests the code
4. **CD Pipeline**: After successful CI, `cd.yml` deploys to the appropriate environment

## Environment Configuration

- **Staging**: Deployed from the `dev` branch
- **Production**: Deployed from the `main` branch

## Key Improvements

1. **Separation of Concerns**: CI and CD are clearly separated
2. **Workflow Dependencies**: CD only runs after successful CI completion
3. **Race Condition Prevention**: No more issues with deployments starting before builds complete
4. **Simplified Structure**: Easier to understand and maintain

## Team Responsibilities

- **CI/CD Pipeline**: @sfdamm
- **Kubernetes Helm Charts**: @sfdamm (ai-event-concepter) and @ClaudiaDuenzinger (monitor)
- **Infrastructure**: @lenni108
- **Monitoring**: @ClaudiaDuenzinger

## Best Practices

1. Always use `needs:` to ensure proper job execution order
2. Use GitHub Environments for deployment protection rules
3. Include verification steps after deployments
4. Keep related jobs in the same workflow file
5. Use descriptive job and step names
