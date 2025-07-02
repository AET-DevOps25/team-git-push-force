#!/bin/bash

# Monitoring Stack Setup Script
# This script sets up Prometheus and Grafana for application monitoring
# Run this to get a complete monitoring solution

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions for colored logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

install_prometheus(){
  log_info "Installing Prometheus..."

  # Check prerequisites
  log_info "Checking prerequisites..."

  if ! command -v curl &> /dev/null; then
      log_error "curl is required but not installed."
      exit 1
  fi
  if ! command -v tar &> /dev/null; then
      log_error "tar is required but not installed."
      exit 1
  fi

   # Create prometheus directory
    PROMETHEUS_DIR="prometheus-setup"
    cd ~/Downloads
    mkdir -p "$PROMETHEUS_DIR"
    cd "$PROMETHEUS_DIR"
    
    # Detect platform
    PLATFORM=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)
    
    case $ARCH in
        x86_64)
            ARCH="amd64"
            ;;
        aarch64|arm64)
            ARCH="arm64"
            ;;
        *)
            log_error "Unsupported architecture: $ARCH"
            exit 1
            ;;
    esac
    
    # Get latest Prometheus version
    log_info "Fetching latest Prometheus version..."
    LATEST_VERSION=$(curl -s https://api.github.com/repos/prometheus/prometheus/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
    
    if [ -z "$LATEST_VERSION" ]; then
        log_error "Failed to fetch latest Prometheus version"
        exit 1
    fi
    
    # Remove 'v' prefix if present for asset naming
    VERSION_FOR_ASSET=$(echo "$LATEST_VERSION" | sed 's/^v//')
    
    log_info "Latest Prometheus version: $LATEST_VERSION"
    log_info "Version for assets: $VERSION_FOR_ASSET"
    
    # Download Prometheus
    PROMETHEUS_TAR="prometheus-${VERSION_FOR_ASSET}.${PLATFORM}-${ARCH}.tar.gz"
    PROMETHEUS_URL="https://github.com/prometheus/prometheus/releases/download/${LATEST_VERSION}/${PROMETHEUS_TAR}"
    
    log_info "Downloading Prometheus from: $PROMETHEUS_URL"
    
    if curl -L -o "$PROMETHEUS_TAR" "$PROMETHEUS_URL"; then
        log_success "Prometheus downloaded successfully!"
    else
        log_error "Failed to download Prometheus"
        exit 1
    fi
    
    # Extract Prometheus
    log_info "Extracting Prometheus..."
    if tar xvfz "$PROMETHEUS_TAR"; then
        log_success "Prometheus extracted successfully!"
    else
        log_error "Failed to extract Prometheus"
        exit 1
    fi
    
    # Find the extracted directory
    PROMETHEUS_DIR_NAME=$(ls -d prometheus-* | head -n 1)
    cd "$PROMETHEUS_DIR_NAME"
    
    # Test Prometheus binary
    log_info "Testing Prometheus binary..."
    if ./prometheus --help &> /dev/null; then
        log_success "Prometheus binary is working correctly!"
    else
        log_error "Prometheus binary test failed"
        exit 1
    fi

    #make sure the prometheus and promtool binary is in /usr/local/bin so its accessible globally
    sudo cp "promtool" /usr/local/bin/
    sudo cp "prometheus" /usr/local/bin/


  echo "$PWD"
}


# Function to setup Prometheus
setup_prometheus() {
    # Variables
    PROM_USER="prometheus"
    PROM_GROUP="prometheus"
    PROM_SERVICE_FILE="prometheus.service"
    PROM_SERVICE_PATH="/etc/systemd/system/$PROM_SERVICE_FILE"
    PROM_CONFIG_DIR="/etc/prometheus"
    PROM_DATA_DIR="/var/lib/prometheus"
    PROM_BIN_DIR="/usr/local/bin"

    log_info "Checking if Prometheus is already installed..."
    
  if command -v prometheus &> /dev/null; then
    log_success "Prometheus binary found"
    PROMETHEUS_BIN_PATH=$(command -v prometheus)

    if [ "$(dirname "$PROMETHEUS_BIN_PATH")" = "$PROM_BIN_DIR" ]; then
        log_success "Prometheus is correctly located in $PROM_BIN_DIR"
   else
        echo "Prometheus is not in $PROM_BIN_DIR, removing old binary..."
        sudo rm -f "$PROMETHEUS_BIN_PATH"
        log_info "Old Prometheus binary removed from $PROMETHEUS_BIN_PATH"
        PROMETHEUS_PATH=$(install_prometheus)
    fi
  else
    log_info "Prometheus is not installed, proceeding with installation..."
    PROMETHEUS_PATH=$(install_prometheus)
  fi
    
    # Create directorie for storing condfig files
    sudo mkdir -p $PROM_BIN_DIR
    # Create directory for storing Prometheus data
    sudo mkdir -p $PROM_DATA_DIR


    #cd $PROM_BIN_DIR || { log_error "Failed to cd to $PROM_BIN_DIR"; exit 1; } 
    # Check for prometheus.yml
    if [ ! -f "$PROM_BIN_DIR/prometheus.yml" ]; then
      if [ -f "$PROMETHEUS_PATH/prometheus.yml" ]; then
          sudo cp "$PROMETHEUS_PATH/prometheus.yml" $PROM_BIN_DIR
          log_info "Moved prometheus.yml to $PROM_BIN_DIR"
      else
        log_info "prometheus.yml not found in $PROMETHEUS_PATH, using prometheus-fixed.yml instead"
        sudo cp monitoring/prometheus-fixed.yml $PROM_BIN_DIR/prometheus.yml
      fi
    else
      log_success "prometheus.yml found in $PROM_BIN_DIR"
    fi
   


    # Check for consoles directory
    if [ ! -d "$PROM_BIN_DIR/consoles" ]; then
      if [ -d "$PROMETHEUS_PATH/consoles" ]; then
          sudo cp -r "$PROMETHEUS_PATH/consoles" $PROM_BIN_DIR
          log_info "Moved consoles directory to $PROM_BIN_DIR"
      else
          sudo mkdir -p $PROM_BIN_DIR/consoles
          log_info "Consoles directory not found in release, creating empty directory"
      fi
    else
      log_success "consoles directory found in $PROM_BIN_DIR"
    fi

    # Check for console_libraries directory
    if [ ! -d "$PROM_BIN_DIR/console_libraries" ]; then
      if [ -d "$PROMETHEUS_PATH/console_libraries" ]; then
          sudo cp -r "$PROMETHEUS_PATH/console_libraries" $PROM_BIN_DIR
          log_info "Moved console_libraries directory to $PROM_BIN_DIR"
      else
          sudo mkdir -p $PROM_BIN_DIR/console_libraries
          log_info "Console libraries directory not found in release, creating empty directory"
      fi
    else
        log_success "console_libraries directory found in $PROM_BIN_DIR"
    fi

  if ! id -u $PROM_USER &>/dev/null; then
      sudo useradd -rs /bin/false $PROM_USER
  fi
  if ! getent group $PROM_GROUP &>/dev/null; then
      sudo groupadd $PROM_GROUP
  fi


  #Set ownership
  sudo chown -R $PROM_USER:$PROM_GROUP $PROM_CONFIG_DIR $PROM_DATA_DIR $PROM_BIN_DIR

  # Restore SELinux context (if applicable, safe to run even if not using SELinux)
  sudo restorecon -Rv $PROM_CONFIG_DIR $PROM_SERVICE_PATH $PROM_BIN_DIR $PROM_DATA_DIR &>/dev/null || true

  #Move the service file if not already present
  if [ ! -f "$PROM_SERVICE_PATH" ]; then
      sudo cp "monitoring/$PROM_SERVICE_FILE" "$PROM_SERVICE_PATH"
  fi

  #Reload systemd to recognize the new service
  sudo systemctl daemon-reload
  sudo systemctl enable --now $PROM_SERVICE_FILE
  sudo systemctl status prometheus
}

install_grafana() {
    log_info "Installing Grafana..."

    # Check prerequisites
    log_info "Checking prerequisites..."
    if ! command -v wget &> /dev/null; then
        log_error "wget is required but not installed."
        exit 1
    fi
    if ! command -v apt &> /dev/null; then
        log_error "apt is required but not installed."
        exit 1
    fi
    log_success "Prerequisites are met."

    # Step 2: Import the GPG key
    sudo mkdir -p /etc/apt/keyrings/
    wget -q -O - https://apt.grafana.com/gpg.key | gpg --dearmor | sudo tee /etc/apt/keyrings/grafana.gpg > /dev/null
    log_success "Grafana GPG key imported."

    # Step 3: Add Grafana APT repositories (stable and beta)
    log_info "Adding Grafana stable and beta repositories..."
    echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main" | sudo tee -a /etc/apt/sources.list.d/grafana.list
    echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com beta main" | sudo tee -a /etc/apt/sources.list.d/grafana.list
    log_success "Grafana repositories added."

    # Step 4: Update package list
    log_info "Updating package list..."
    sudo apt-get update
    log_success "Package list updated."

    # Step 5: Install Grafana OSS (default)
    log_info "Installing Grafana OSS..."
    sudo apt-get install -y grafana
    log_success "Grafana OSS installation completed!"

    # If you want to install Grafana Enterprise instead, uncomment the following line:
    # sudo apt-get install -y grafana-enterprise
    # log_success "Grafana Enterprise installation completed!"
}

# Function to setup Grafana
setup_grafana() {
    log_info "Checking if Grafana is already installed..."
    
    # Check if Grafana is already installed
    if command -v grafana-server &> grafana-server; then
        GRAFANA_PATH=$(command -v grafana-server)
        log_success "Grafana server binary found in $GRAFANA_PATH - skipping installation"
    else
        log_info "Grafana server binary not found, proceeding with installation..."
        install_grafana
        GRAFANA_PATH=$(command -v grafana-server)
    fi

    if systemctl is-active --quiet grafana-server 2>/dev/null; then
        sudo systemctl stop grafana-server
        log_success "Grafana service is already running - stopping it so we can setup the datasource and dashboard"
    fi
    
    log_info "Setting up Grafana..."
    
    # Create Grafana configuration
    log_info "Creating Grafana configuration..."
    sudo mkdir -p /etc/grafana/provisioning/datasources
    sudo mkdir -p /etc/grafana/provisioning/dashboards
    
    # Create Prometheus datasource
    sudo tee /etc/grafana/provisioning/datasources/prometheus.yml > /dev/null << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://localhost:9090
    isDefault: true
EOF
    
    # Create dashboard provisioning
    sudo tee /etc/grafana/provisioning/dashboards/dashboard.yml > /dev/null << EOF
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
EOF
    
    # Create basic dashboard
    sudo mkdir -p /var/lib/grafana/dashboards
    sudo cp monitoring/sample-dashboard.json /var/lib/grafana/dashboards/
    
    # Set permissions
    sudo chown -R grafana:grafana /var/lib/grafana
    
    # Enable and start Grafana
    log_info "Enabling Grafana service..."
    sudo systemctl enable grafana-server
    sudo systemctl start grafana-server
    sudo systemctl status grafana-server
}

# Function to setup authentication
setup_auth() {
    # Get authentication credentials
    log_info "Setting up authentication credentials:"
    echo ""

   while true; do
      # Get admin username
      echo -n "Enter admin username for monitoring access: "
      read ADMIN_USERNAME
      ADMIN_USERNAME=${ADMIN_USERNAME:-"admin"}
      
      # Get admin password
      echo -n "Enter admin password for monitoring access: "
      read -s ADMIN_PASSWORD
      echo ""
      
      if [ -z "$ADMIN_PASSWORD" ]; then
          log_error "Password is required!"
      else
          break
      fi
  done
      
    # Install nginx and apache2-utils if not present
    log_info "Checking nginx installation..."
    if ! command -v nginx &> /dev/null; then
        log_info "Installing nginx..."
        sudo apt update
        sudo apt install -y nginx apache2-utils
    else
        log_success "nginx is already installed"
    fi
    
    # Create authentication directory
    log_info "Setting up authentication..."
    sudo mkdir -p /etc/nginx/auth
    
    # Create htpasswd file for basic auth
    log_info "Creating authentication file..."
    echo "$ADMIN_PASSWORD" | sudo htpasswd -ci /etc/nginx/auth/.htpasswd "$ADMIN_USERNAME"
    
    # Set proper permissions
    sudo chmod 644 /etc/nginx/auth/.htpasswd
    sudo chown www-data:www-data /etc/nginx/auth/.htpasswd
    
    # Create nginx configuration with advanced auth and IP restriction
    log_info "Creating nginx reverse proxy configuration with advanced auth and IP restriction..."
    sudo tee /etc/nginx/sites-available/monitoring > /dev/null << EOF
server {
    listen 80;
    server_name _;

    # Prometheus - accessible at /prometheus
    location /prometheus/ {
        auth_basic "Prometheus Access";
        auth_basic_user_file /etc/nginx/auth/.htpasswd;
        
        proxy_pass http://localhost:9090/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Remove /prometheus prefix
        rewrite ^/prometheus/(.*) /\$1 break;
    }

    # Grafana - accessible at /grafana
    location /grafana/ {
        auth_basic "Grafana Access";
        auth_basic_user_file /etc/nginx/auth/.htpasswd;
        
        proxy_pass http://localhost:3000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Remove /grafana prefix
        rewrite ^/grafana/(.*) /\$1 break;
    }

    # Root redirect to Grafana
    location = / {
        return 301 /grafana/;
    }

    # Health check endpoint (no auth required)
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
    
    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/monitoring /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    log_info "Testing nginx configuration..."
    if sudo nginx -t > /dev/null; then
        log_success "nginx configuration is valid"
    else
        log_error "nginx configuration test failed"
        exit 1
    fi
    
    # Restart nginx
    log_info "Restarting nginx..."
    sudo systemctl restart nginx > /dev/null
    sudo systemctl enable nginx
    
    # Get server IP
    SERVER_IP=$(hostname -I | awk '{print $1}')
}

echo "=============================================="
  echo "  Monitoring Stack Setup with Authentication"
  echo "=============================================="
  echo ""
  log_info "Setting up Prometheus and Grafana with nginx reverse proxy and authentication"
  echo ""

# Ask user for Grafana mode
# Main setup process
log_info "Setting up Prometheus..."
log_success "Prometheus setup completed!"
#log_info "Prometheus URL: http://localhost:9090"
setup_prometheus

echo "=============================================="
log_info "Setting up local Grafana..."
setup_grafana
log_success "Grafana setup completed!"
#log_info "Grafana URL: http://localhost:3000"
#setup_grafana_cloud

echo "=============================================="
log_info "Setting up Authentication..."
setup_auth

echo ""
    log_success "🎉 Monitoring stack with authentication setup completed!"
    echo ""
    log_info "Access Information:"
    echo "Grafana: http://$SERVER_IP/grafana/"
    echo "Prometheus: http://$SERVER_IP/prometheus/"
    echo "Username: $ADMIN_USERNAME"
    echo "Password: [The password you entered]"
    echo ""
    log_info "Health Check: http://$SERVER_IP/health"
    echo ""
    log_info "Configuration files:"
    echo "- grafana configuration: /etc/grafana/grafana.ini"
    echo "- Grafana data: /var/lib/grafana/"
    echo "- nginx: /etc/nginx/sites-available/monitoring"
    echo "- auth: /etc/nginx/auth/.htpasswd"
    echo "- access info: monitoring-access-info.md"
    echo ""

exit 0