# Product Requirements Document (PRD) - CloudPulse AI

This Product Requirements Document (PRD) defines the scope, functional requirements, non-functional requirements, and user workflows for the CloudPulse AI platform MVP.

---

## 1. Document Control
* **Status**: Approved
* **Target Release**: MVP v1.0
* **Author**: Antigravity (AI Product Lead)

---

## 2. Goals & Objectives
The objective of the MVP is to deliver a functional, single-tenant or multi-tenant-ready cloud intelligence platform that connects to an AWS account (via IAM role delegation or access keys), ingests resource metrics, computes health and efficiency scores, and lets users converse with an AI agent to resolve cloud issues.

---

## 3. Product Scope

### In-Scope (MVP):
* **AWS Integration**: Read-only connection using Boto3 for EC2, RDS, EBS, S3, IAM, and Cost Explorer.
* **Health Scoring Engine**: Algorithmic assessment of resource utilization (CPU, memory, storage) and cost anomalies.
* **AI Multi-Agent System**: Powered by LangGraph. Specialized agents for Cost, Infrastructure Health, and Forecasting.
* **Conversational Copilot**: A streaming chat interface that allows users to ask questions about their infrastructure (e.g., *"Why was my RDS bill so high yesterday?"* or *"Generate a Terraform block to resize my EC2"*).
* **Workflows Dashboards**: Three specific layout templates tailored for CTO (Executive), DevOps, and Finance roles.
* **Security First**: Zero storage of AWS root keys; support for IAM Role delegation and STS AssumeRole.

### Out-of-Scope (Post-MVP Roadmap):
* **Automated Self-Healing**: Modifying cloud resources automatically without human approval.
* **Multi-Cloud Support**: Ingesting metrics from Google Cloud Platform (GCP) or Microsoft Azure.
* **On-Premise Infrastructure**: Support for VMware or bare-metal servers.

---

## 4. Functional Requirements

### 4.1. Ingestion & Storage Engine (Core Backend)
* **FR-1.1**: The platform must connect to AWS using the `boto3` SDK.
* **FR-1.2**: Ingestion must run asynchronously (using Celery + Redis) to prevent blocking the web server.
* **FR-1.3**: The database (PostgreSQL) must store resource configurations, pricing, and historical metrics.
* **FR-1.4**: Ingested configurations must be vectorized and stored in PostgreSQL using the `pgvector` extension for efficient retrieval by the AI agents.

### 4.2. Analytics & Scoring Engine
* **FR-2.1**: The platform must compute a **Health Score** (0-100) per EC2 and RDS instance using CPU, memory, network, and disk I/O metrics.
* **FR-2.2**: The platform must compute a **Cost Efficiency Score** (0-100) based on idle time, underutilized CPU/RAM, and resource sizing.
* **FR-2.3**: The platform must identify "Zombie" (orphaned or idle) resources:
  * EC2 instances with average CPU < 5% over 7 days.
  * EBS volumes detached for > 3 days.
  * S3 buckets with no reads/writes for > 30 days.

### 4.3. Multi-Agent AI Engine (LangGraph)
* **FR-3.1**: The conversational engine must route queries to specialized agents:
  * **Cost Agent**: Answers queries about spend anomalies and suggests rightsizing.
  * **Health Agent**: Answers queries about resource utilization and downtime.
  * **Forecast Agent**: Estimates future costs and capacity constraints using historical trends.
* **FR-3.2**: The chat interface must support **Streaming Output** (Server-Sent Events) for low-latency AI responses.
* **FR-3.3**: The AI must produce copy-pasteable, verified **Terraform blocks** for suggested modifications.

### 4.4. Frontend & User Interface
* **FR-4.1**: The UI must render a unified layout using React, TypeScript, and Tailwind CSS.
* **FR-4.2**: The dashboard must support role-based views:
  * **CTO View**: High-level financial KPIs, security highlights, and global health status.
  * **DevOps View**: Detailed CPU/Memory graphs, live alert feed, and log-correlations.
  * **FinOps View**: Budget vs. actual tracking, forecast trends, and potential savings.
* **FR-4.3**: The UI must feature a premium **Dark Theme** by default to appeal to developers and technical executives.

---

## 5. Non-Functional Requirements (NFRs)

### 5.1. Security & Compliance
* **NFR-1.1 (Least Privilege)**: The platform's AWS connection must require only the standard AWS ReadOnlyAccess IAM policy.
* **NFR-1.2 (Data Security)**: All API requests must be authenticated using JSON Web Tokens (JWT) signed with HS256.
* **NFR-1.3 (Encryption)**: AWS credentials (if stored instead of IAM roles) must be encrypted at rest in the database using AES-256.

### 5.2. Performance & Scalability
* **NFR-2.1 (API Latency)**: Standard REST endpoints (e.g., resource lists) must respond in `< 150ms` (excluding AI generation).
* **NFR-2.2 (AI Latency)**: Time-to-first-token in the AI chat must be `< 1.5s` using SSE streaming.
* **NFR-2.3 (Worker Scale)**: The celery backend must scale workers horizontally to handle large AWS account scans.

### 5.3. Usability
* **NFR-3.1**: The user interface must be fully responsive and support resolutions down to mobile viewport widths (320px).
