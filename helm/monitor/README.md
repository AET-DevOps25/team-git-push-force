# AI Event Concepter Monitoring Stack

This Helm chart deploys a comprehensive monitoring stack for the AI Event Concepter application using Prometheus, Grafana, and related monitoring components.

---

## 🏗️ **Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │    │   Prometheus    │    │   Alertmanager  │
│   Services      │───▶│   (Metrics)     │───▶│   (Alerts)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │    Grafana      │    │   Email/Slack   │
                       │ (Dashboards)    │    │ (Notifications) │
                       └─────────────────┘    └─────────────────┘
```

---

## Components

### Core Monitoring
- **Prometheus**: Metrics collection and storage with persistent volume (10GB)
- **Grafana**: Metrics visualization and dashboards with persistent volume (5GB)
- **Alertmanager**: Alert routing and notification management with email notifications

### Persistent Storage
- **Prometheus**: 10GB PVC for metrics retention
- **Grafana**: 5GB PVC for dashboard configs

### Metrics Exporters
- **Node Exporter**: System and hardware metrics
- **PostgreSQL Exporter**: Database metrics for both user and concept databases
- **Blackbox Exporter**: External service availability monitoring
- **Spring Boot Actuator**: Application metrics (built-in)

### Monitored Services
- **Gateway Service** (Spring Boot): API gateway with metrics at `/actuator/prometheus`
- **User Service** (Spring Boot): User management with metrics at `/actuator/prometheus`
- **Concept Service** (Spring Boot): Concept management with metrics at `/actuator/prometheus`
- **GenAI Service** (Flask): AI processing with metrics at `/metrics`
- **PostgreSQL Databases**: User database (eventdb) and concept database (conceptdb)
- **MinIO Object Storage**: File storage metrics
- **Weaviate Vector Database**: Vector search metrics
- **T2V Transformers**: Text-to-vector processing metrics

### Service Discovery strategy
1. **Declarative Configuration**: ServiceMonitor resources define monitoring requirements
2. **Automatic Discovery**: Prometheus Operator automatically finds and monitors services
3. **Cross-Namespace Support**: RBAC enables monitoring across multiple namespaces
4. **Rich Metadata**: Relabeling provides context-rich metrics
5. **Zero-Configuration**: New services are automatically monitored when properly labeled



## Deployment

1. **Deploy the monitoring stack:**
   ```bash
   helm install monitor ./helm/monitor --namespace team-git-push-force-monitor 
   ```

2. **Update with custom values:**
   ```bash
  helm upgrade  monitor ./helm/monitor --namespace team-git-push-force-monitor    
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



## Grafana Dashboard

### **Credentials**
- **Username**: admin
- **Password**: strongpassword

The monitoring stack includes a comprehensive application dashboard with detailed metrics across all system layers:

### Application Overview Dashboard
**Title**: AI Event Concepter - Application Overview  
**UID**: `ai-event-concepter-example`

**Dashboard Sections**:

#### 1. Service Health
- **Service Health Overview**: Real-time status of all monitored services with color-coded indicators
- **All Services Healthy?**: Aggregate health status across all services

#### 2. Traffic & Errors
- **Request Count**: HTTP request rates by service (Spring Boot + Flask services)
- **HTTP Success Rate (%)**: Percentage of successful requests (non-5xx responses)
- **Error Rate**: 4xx and 5xx error rates by service with detailed breakdown

#### 3. Latency
- **Response Time (95th percentile)**: Application performance metrics for all services
- **P50 & P99**: Median and 99th percentile response times
- **Max Observed Latency**: Peak latency observations with threshold indicators

#### 4. Resource Usage
- **Memory Usage**: JVM memory utilization for Spring Boot services + Python memory for Flask
- **CPU Usage**: Process CPU consumption across all application services

#### 5. Database
- **Database Connections**: Active PostgreSQL connections by database and state
- **DB Connection Saturation**: Connection pool utilization percentage
- **Database Transaction Rate**: Commit and rollback rates by database

**Key Features**:
- **Multi-Service Support**: Monitors Spring Boot (gateway, user-svc, concept-svc) and Flask (genai-svc) services
- **Real-time Metrics**: 5-minute rate calculations for responsive monitoring
- **Threshold Indicators**: Color-coded alerts for performance degradation
- **Database Monitoring**: Comprehensive PostgreSQL metrics for both user and concept databases

### Customizing Dashboards
To modify or add new dashboards:

Edit existing dashboard:
   - Dashboard JSON: `helm/monitor/dashboards/AI Event Concepter - Application Overview.json`

and upload to Grafana


## Alertmanager

The monitoring stack includes **18 comprehensive alert rules** across 6 categories for proactive issue detection:
- **Service Availability**: 2 rules (ServiceDown, ServiceSlow)
- **Infrastructure**: 4 rules (Memory, CPU usage)
- **Application Performance**: 4 rules (Error rates, Response times)
- **JVM Monitoring**: 3 rules (Heap usage, GC frequency)
- **Database**: 3 rules (Connections, Query performance)
- **Business Logic**: 2 rules (Request volume, Client errors)

**Notification** via Gmail SMTP:
- **Email**: teamgitpushforce@gmail.com

**Alert Features**:
- **Progressive Severity**: Warning → Critical escalation
- **Team Labels**: All alerts tagged with `team: ai-event-concepter`
- **Detailed Descriptions**: Clear explanations with runbook URLs

## Customization

### Adding Custom Alerts
Edit `helm/monitor/templates/prometheus-rules-configmap.yaml` to add custom alerting rules.





