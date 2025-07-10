# AI Event Concepter

### What is the main functionality?

An interactive **co-creation assistant** that turns a vague event idea into a polished concept—fast. The planner drags in any relevant documents (past reports, industry papers, brand decks). The AI digests that material, asks follow-up questions until all gaps are filled, and delivers a full concept package: theme, format, agenda outline, speaker & sponsor suggestions, and ticket-price ideas, exportable as PDF and JSON. Because the AI does the heavy lifting—researching, matching, structuring—it **cuts days of manual work to minutes**, keeps all context in one place, and lets the planner iterate (“add a workshop,” “make it hybrid”) with a single prompt.

---

### Who are the intended users?

* **Event-agency planners** who prepare multiple client proposals.
* **Corporate planners** who must respect internal policies yet still wow stakeholders.

---

### How will you integrate GenAI meaningfully?

* **LangChain + Weaviate RAG** over *user-supplied* documents—no external scraping—so every suggestion is grounded in the customer’s own industry context.
* **Adaptive dialogue** powered by an LLM that follows nine standard conception steps, probes for missing details, remembers answers, and supports unlimited refinements.
* **Creative synthesis** prompt chains craft themes, agendas, and curated speaker/sponsor lists that reflect both uploaded content and the evolving conversation.
* **Continuous learning**—each new debrief or guideline embedded today improves tomorrow’s concepts automatically.

---

### Describe some scenarios how your app will function

**Co-create a fresh pitch** – The planner uploads last year’s debrief and a market white paper, then says “Target 300 attendees, hybrid preferred.” The AI summarises the docs, asks two clarifiers (duration, networking preference), and returns a one-day concept. The planner adds, “Include a hands-on workshop and make the theme more visionary.” The AI revises the agenda and title, then offers a ready-to-share PDF.

**Compliance-aware brainstorm** – A corporate planner supplies the company’s policy handbook and audience personas. The AI filters speaker suggestions to fit policy, proposes an online format for global reach, and crafts sponsor packages aligned with brand guidelines. When the planner asks, “Shorten it to a half-day and add a panel,” the AI updates the concept instantly.

**Learning loop** – After an event, the planner uploads debrief notes (“need stronger networking, ticket price felt high”). Next time, the AI automatically proposes an interactive networking segment and adjusted ticket tiers, then asks, “Anything else you’d like to refine?”—keeping the focus on creative improvement instead of administrative grind.

---

## 🏗 Architecture

The system follows a modular microservice architecture with clearly separated concerns across backend services, a modern web frontend, and scalable data infrastructure.

### 🔧 Component Overview

| Layer         | Technology              | Purpose                                           |
|---------------|--------------------------|---------------------------------------------------|
| API Gateway   | Spring Boot 3            | JWT authentication, routing, OpenAPI docs         |
| User Service  | Spring Boot 3            | User management, roles, preferences               |
| Concept Service| Spring Boot 3           | CRUD for concepts, PDF rendering                  |
| GenAI Service | Python 3.12 + LangChain  | Document ingestion, RAG pipeline, content creation|
| Web Client    | Angular 19               | Chat UI, adaptive flow, PDF viewer                |
| Relational DB | PostgreSQL               | Stores users, projects, concept metadata          |
| Vector DB     | Weaviate                 | Embeddings for trends & document chunks           |
| Object Store  | MinIO                    | Uploaded files and generated PDFs                 |
| Observability | Prometheus + Grafana     | Metrics and dashboards                            |
| Orchestration | Docker + Kubernetes      | Containerization and scalable deployment          |

---

## 📊 UML Diagrams

### 1. Analysis Object Model (UML Class Diagram)

This diagram shows the key objects and their relationships as identified during analysis.

![Analysis Object Model](./docs/uml/AI_Event_Concepter_UML_Simple_Analysis_Object_Model.apollon.svg)

---

### 2. Use Case Diagram

This diagram illustrates the main interactions between users and the system.

![Use Case Diagram](./docs/uml/AI_Event_Concepter_UML_Use_Case_Diagram.drawio.svg)

---

### 3. Top-Level Architecture (UML Component Diagram)

This diagram provides a high-level overview of the system’s components and their interactions.

![Top-Level Architecture](./docs/uml/AI_Event_Concepter_UML_Component_Diagram.drawio.svg)

---

## 📁 Repository Structure

The project is split into several main directories:

- `/api`: OpenAPI specifications (single source of truth)
- `/client`: Angular 19 frontend
- `/gateway`: API Gateway (Spring Boot)
- `/user-svc`: User Service (Spring Boot)
- `/concept-svc`: Concept Service (Spring Boot)
- `/genai-svc`: GenAI Service (Python/Flask/LangChain)

## 🔄 API-First Development

This project follows an API-first development approach. All API changes start with updating the OpenAPI specifications in the `/api` directory.

### API Directory Structure

```
/api                    # API specifications (single source of truth)
  ├── gateway.yaml      # API Gateway specification
  ├── user-service.yaml # User Service specification
  ├── concept-service.yaml # Concept Service specification
  ├── genai-service.yaml # GenAI Service specification
  ├── scripts/          # Code generation scripts
  └── README.md         # API documentation
```

### Development Workflow

1. **Update API Specifications**: Make changes to the OpenAPI specs in the `/api` directory
2. **Lint OpenAPI Specs**: Run `npm run lint:openapi` to validate the specs
3. **Generate Code**: Run `npm run generate:code` to generate code from the specs
4. **Implement Business Logic**: Implement the business logic using the generated code
5. **Run Tests**: Run tests to verify the implementation
6. **Submit PR**: Submit a PR with the changes

### Available Scripts

- `npm run lint:openapi`: Lint OpenAPI specifications
- `npm run docs:openapi`: Generate API documentation
- `npm run generate:code`: Generate code from OpenAPI specifications

### Pre-commit Hooks

This project uses pre-commit hooks to ensure code quality. The hooks are configured in `.pre-commit-config.yaml`.

To install pre-commit hooks:

```bash
pip install pre-commit
pre-commit install
```

---

## ⚙️ Prerequisites

Make sure the following tools are installed:

- [Node.js](https://nodejs.org/) (v22 or later)
- Java JDK 21+
- [Gradle](https://gradle.org/)
- Docker and Docker Compose
- Git

---

## 🚀 Setup Instructions

### Clone the Repository

```bash
git clone https://github.com/AET-DevOps25/team-git-push-force.git
cd team-git-push-force
```

### Client Setup

1. Navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Backend Services Setup

1. Generate code from OpenAPI specifications:
   ```bash
   ./api/scripts/gen-all.sh
   ```

2. Navigate to each service directory and build the project:
   ```bash
   # For Gateway
   cd gateway
   ./gradlew build

   # For User Service
   cd ../user-svc
   ./gradlew build

   # For Concept Service
   cd ../concept-svc
   ./gradlew build

   # For GenAI Service
   cd ../genai-svc
   pip install -r requirements.txt
   ```

## Running the Application

### Option 1: Using Docker Compose (Recommended)

Before running the application, you need to generate code from the OpenAPI specifications. You can use the provided start-dev script which handles this automatically:

```bash
./start-dev.sh
```

This script will:
1. Run code generation from OpenAPI specs
2. Start all services using Docker Compose

Alternatively, you can run these steps manually:

```bash
# First, generate code from OpenAPI specs
./api/scripts/gen-all.sh

# Then start Docker Compose
docker-compose up
```

This will start all services:
- Client (Angular frontend) at [http://localhost:3000](http://localhost:3000)
- API Gateway at [http://localhost:8080](http://localhost:8080)
- User Service at [http://localhost:8081](http://localhost:8081)
- Concept Service at [http://localhost:8082](http://localhost:8082)
- GenAI Service at [http://localhost:8083](http://localhost:8083)

### Option 2: Manual Startup

Before starting the services manually, you need to generate code from the OpenAPI specifications:

```bash
./api/scripts/gen-all.sh
```

This will generate the necessary code for all services based on the OpenAPI specifications in the `/api` directory.

#### Start the Client

```bash
cd client
npm run dev
```
The client will be available at [http://localhost:3000](http://localhost:3000).

#### Start the Gateway

```bash
cd gateway
./gradlew bootRun
```
The API Gateway will be available at [http://localhost:8080](http://localhost:8080).

#### Start the User Service

```bash
cd user-svc
./gradlew bootRun
```
The User Service will be available at [http://localhost:8081](http://localhost:8081).

#### Start the Concept Service

```bash
cd concept-svc
./gradlew bootRun
```
The Concept Service will be available at [http://localhost:8082](http://localhost:8082).

#### Start the GenAI Service

```bash
cd genai-svc
pip install -r requirements.txt
python app.py
```
The GenAI Service will be available at [http://localhost:8083](http://localhost:8083).
