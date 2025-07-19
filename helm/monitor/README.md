# AI Event Concepter Monitoring Stack

This Helm chart deploys a comprehensive monitoring stack for the AI Event Concepter application using Prometheus, Grafana, and related monitoring components.

## Components

### Core Monitoring
- **Prometheus**: Metrics collection and storage
- **Grafana**: Metrics visualization and dashboards
- **Alertmanager**: Alert routing and notification management

### Metrics Exporters
- **Node Exporter**: System and hardware metrics
- **cAdvisor**: Container metrics
- **PostgreSQL Exporter**: Database metrics
- **Spring Boot Actuator**: Application metrics (built-in)

### Monitored Services
- Gateway Service (Spring Boot)
- User Service (Spring Boot)
- Concept Service (Spring Boot)
- GenAI Service (Flask)
- PostgreSQL Database

## Configuration

### Values.yaml

The main configuration file `values.yaml` contains settings for all monitoring components:

```yaml
# Prometheus configuration
prometheus:
  image:
    repository: prom/prometheus
    tag: v2.52.0
  persistence:
    enabled: true
    size: 10Gi
  retention:
    time: "15d"
    size: "10GB"

# Node Exporter for system metrics
nodeExporter:
  enabled: true
  image:
    repository: prom/node-exporter
    tag: v1.6.1

# cAdvisor for container metrics
cadvisor:
  enabled: true
  image:
    repository: gcr.io/cadvisor/cadvisor
    tag: v0.47.2

# PostgreSQL Exporter
postgresExporter:
  enabled: true
  database:
    host: postgres
    port: 5432
    name: postgres
    user: postgres
    password: password

# Alertmanager
alertmanager:
  enabled: true
  persistence:
    enabled: true
    size: 1Gi
```

## Deployment

### Prerequisites
- Kubernetes cluster with Helm 3.x
- Ingress controller (nginx-ingress)
- Storage class for persistent volumes

### Installation

1. **Deploy the monitoring stack:**
   ```bash
   helm install monitor ./helm/monitor
   ```

2. **Update with custom values:**
   ```bash
   helm upgrade monitor ./helm/monitor -f custom-values.yaml
   ```

3. **Uninstall:**
   ```bash
   helm uninstall monitor
   ```

## Access URLs

After deployment, the monitoring components will be available at:

- **Prometheus**: `https://prometheus.dev-aieventconcepter.student.k8s.aet.cit.tum.de`
- **Grafana**: `https://grafana.dev-aieventconcepter.student.k8s.aet.cit.tum.de`
- **Alertmanager**: `https://alertmanager.dev-aieventconcepter.student.k8s.aet.cit.tum.de`

## Dashboards

The monitoring stack includes two comprehensive dashboards:

### 1. Application Overview Dashboard
**Title**: AI Event Concepter - Application Overview  
**UID**: `ai-event-concepter`

**Panels**:
- **Service Health Overview**: Real-time status of all services
- **Request Rate**: HTTP request rates by service, method, and endpoint
- **Response Time (95th percentile)**: Application performance metrics
- **Error Rate**: 4xx and 5xx error rates by service
- **Memory Usage**: JVM memory utilization
- **CPU Usage**: Process CPU consumption
- **Database Connections**: HikariCP connection pool metrics
- **Service Version Overview**: Application version information

### 2. Infrastructure Overview Dashboard
**Title**: AI Event Concepter - Infrastructure Overview  
**UID**: `ai-event-concepter-infrastructure`

**Panels**:
- **Node CPU Usage**: Host CPU utilization
- **Node Memory Usage**: Host memory consumption
- **Disk Usage**: Filesystem utilization
- **Network Traffic**: Network I/O metrics
- **Container CPU Usage**: Container-level CPU metrics
- **Container Memory Usage**: Container memory consumption
- **PostgreSQL Active Connections**: Database connection monitoring
- **PostgreSQL Transaction Rate**: Database transaction metrics
- **System Load Average**: System load (1m, 5m, 15m)

## Metrics Collection

### Spring Boot Services
Spring Boot services expose metrics via Actuator endpoints:
- Metrics path: `/actuator/prometheus`
- Default port: `8080`
- Services: gateway, user-svc, concept-svc

### GenAI Service
Flask service exposes Prometheus metrics:
- Metrics path: `/metrics`
- Port: `8083`

### System Metrics
- **Node Exporter**: Host system metrics (CPU, memory, disk, network)
- **cAdvisor**: Container and Kubernetes metrics
- **PostgreSQL Exporter**: Database performance metrics

## Alerting Rules

The monitoring stack includes predefined alerting rules for:

### Infrastructure Alerts
- Service availability (ServiceDown)
- High memory usage (>85%)
- High CPU usage (>80%)
- Disk space filling up (>90%)

### Application Alerts
- Spring Boot high error rate (>0.1 errors/sec)
- Spring Boot high response time (>2s 95th percentile)
- PostgreSQL high connections (>80)

### Container Alerts
- Container high memory usage (>85% of limit)

## Customization

### Adding Custom Alerts
Edit `helm/monitor/templates/prometheus-rules-configmap.yaml` to add custom alerting rules.

### Modifying Service Discovery
Update the Prometheus configuration in `helm/monitor/templates/prometheus-configmap.yaml` to modify service discovery and scraping rules.

### Database Configuration
Update the PostgreSQL exporter configuration in `values.yaml` to match your database settings.

### Customizing Dashboards
To modify or add new dashboards:

1. **Edit existing dashboards**:
   - Application dashboard: `helm/monitor/templates/grafana-dashboards-configmap.yaml`
   - Infrastructure dashboard: `helm/monitor/templates/grafana-infrastructure-dashboard.yaml`

2. **Add new dashboards**:
   - Create a new ConfigMap with the `grafana_dashboard: "1"` label
   - Include the dashboard JSON in the ConfigMap data
   - The dashboard will be automatically loaded by Grafana

3. **Dashboard JSON format**:
   - Export dashboards from Grafana UI as JSON
   - Include required metadata (`__inputs`, `__requires`)
   - Set appropriate UID and title

## Troubleshooting

### Check Pod Status
```bash
kubectl get pods -l app=prometheus
kubectl get pods -l app=grafana
kubectl get pods -l app=alertmanager
```

### View Logs
```bash
kubectl logs -l app=prometheus
kubectl logs -l app=grafana
kubectl logs -l app=alertmanager
```

### Check Metrics Endpoints
```bash
# Test Prometheus metrics endpoint
kubectl port-forward svc/prometheus 9090:9090

# Test service metrics
kubectl port-forward svc/gateway 8080:8080
curl http://localhost:8080/actuator/prometheus
```

### Storage Issues
If persistent volumes are not being created:
1. Check available storage classes: `kubectl get storageclass`
2. Update `storageClassName` in `values.yaml`
3. Ensure sufficient storage capacity

## Security Considerations

- Change default passwords in production
- Use secrets for sensitive configuration
- Enable RBAC for service accounts
- Configure network policies
- Use TLS for all external access

## Performance Tuning

### Prometheus
- Adjust retention settings based on storage capacity
- Configure scrape intervals based on metrics importance
- Use recording rules for frequently used queries

### Resource Limits
Monitor resource usage and adjust limits in `values.yaml`:
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "1Gi"
    cpu: "500m"
``` 