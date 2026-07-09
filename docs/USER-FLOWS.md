# CloudPulse AI - User Flows & Interaction Diagrams

**Phase 1 Deliverable** | User journey flows and system interactions
**Created:** 2026-07-09

---

## Authentication User Flow

```mermaid
graph TD
    A["New User Visits App"] -->|No Account| B["Sign Up Page"]
    A -->|Has Account| C["Login Page"]
    
    B --> B1["Enter Email & Password"]
    B1 --> B2{"Email Valid?"}
    B2 -->|No| B3["Show Error"]
    B3 --> B1
    B2 -->|Yes| B4["Verify Email"]
    B4 --> B5["MFA Setup"]
    
    C --> C1["Enter Email"]
    C1 --> C2["Enter Password"]
    C2 --> C3{"Credentials Valid?"}
    C3 -->|No| C4["Show Error"]
    C4 --> C1
    C3 -->|Yes| C5{"MFA Enabled?"}
    C5 -->|Yes| C6["Enter MFA Code"]
    C5 -->|No| C7["Go to Dashboard"]
    C6 --> C7
    
    B5 --> B6["Choose MFA Method"]
    B6 --> B7["Setup 2FA"]
    B7 --> B8["Dashboard"]
    
    C7 --> D["Dashboard"]
```

---

## Executive Dashboard User Flow

```mermaid
graph TD
    A["CTO Opens Dashboard"] --> B["View Health Score"]
    B --> C{"Health < 80?"}
    C -->|Yes| D["View Breakdown"]
    D --> E["Click Issue"]
    E --> F["See Root Cause"]
    F --> G{"Action Needed?"}
    G -->|Yes| H["Click Recommendation"]
    H --> I["Review Savings"]
    I --> J["Implement or Ask AI"]
    G -->|No| K["Monitor"]
    
    B --> L["View Cost Trend"]
    L --> M{"Cost High?"}
    M -->|Yes| N["See Top Recommendations"]
    N --> O["Estimate Savings"]
    O --> P["Approve & Auto-Implement"]
    M -->|No| Q["Review Budget Status"]
    
    B --> R["Check Active Incidents"]
    R --> S{"Critical Incident?"}
    S -->|Yes| T["Alert on-call"]
    S -->|No| U["Monitor"]
```

---

## DevOps Dashboard User Flow

```mermaid
graph TD
    A["DevOps Engineer Opens"] --> B["View Resource List"]
    B --> C["Filter Resources"]
    C --> D["Select Resource"]
    D --> E["View Live Metrics"]
    E --> F{"Anomaly Detected?"}
    F -->|Yes| G["View Alerts"]
    G --> H["Check Root Cause"]
    H --> I["View Logs"]
    I --> J{"Issue Found?"}
    J -->|Yes| K["Create Incident"]
    J -->|No| L["Close Alert"]
    F -->|No| M["Monitor"]
    
    B --> N["View Alerts Stream"]
    N --> O["Click Alert"]
    O --> P["See Resource Details"]
    P --> Q{"Action Needed?"]
    Q -->|Yes| R["SSH/Console Access"]
    Q -->|No| S["Dismiss"]
```

---

## Cost Analysis User Flow

```mermaid
graph TD
    A["FinOps Opens Finance Dashboard"] --> B["View Cost Summary"]
    B --> C["Check Budget Status"]
    C --> D{"Over Budget?"}
    D -->|Yes| E["View Cost by Service"]
    E --> F["Identify Expensive Service"]
    F --> G["Ask AI for Optimization"]
    G --> H["View Recommendations"]
    H --> I["Estimate Savings"]
    I --> J["Implement"]
    D -->|No| K["View Forecast"]
    K --> L["Plan Budget Allocation"]
    
    B --> M["Compare Periods"]
    M --> N["Analyze Trends"]
    N --> O["Export Report"]
    
    B --> P["View Cost Allocation"]
    P --> Q["Tag Resources"]
    Q --> R["Charge Back to Teams"]
```

---

## AI Copilot User Flow

```mermaid
graph TD
    A["User Opens Copilot"] --> B["See Conversation History"]
    B --> C["Ask Question"]
    C --> D["AI Analyzes Infrastructure"]
    D --> E["Generate Response"]
    E --> F["Display with Charts/Code"]
    F --> G{"Satisfied?"]
    G -->|Yes| H["Save Conversation"]
    G -->|No| I["Ask Follow-up"]
    I --> D
    
    C --> J{"Request Runbook?"]
    J -->|Yes| K["Generate Runbook"]
    K --> L["Display Steps"]
    L --> M["Copy/Download"]
    
    C --> N{"Request Code?"]
    N -->|Yes| O["Generate Code Snippet"]
    O --> P["Copy to Clipboard"]
```

---

## Resource Onboarding Flow

```mermaid
graph TD
    A["New Org Signs Up"] --> B["Create Organization"]
    B --> C["Invite Team Members"]
    C --> D["Setup AWS Credentials"]
    D --> E{"IAM Role Created?"]
    E -->|No| F["Show IAM Policy"]
    F --> G["Create Role in AWS"]
    G --> D
    E -->|Yes| H["Test Connection"]
    H --> I{"Connection Valid?"]
    I -->|No| J["Show Error Logs"]
    J --> D
    I -->|Yes| K["Scan AWS Infrastructure"]
    K --> L["Index Resources"]
    L --> M["Calculate Health Scores"]
    M --> N["Generate Initial Recommendations"]
    N --> O["Ready for Use"]
```

---

## Recommendation Workflow

```mermaid
graph TD
    A["System Scans Resources"] --> B["Identify Optimization"]
    B --> C["Calculate Savings"]
    C --> D["Create Recommendation"]
    D --> E["Rank by Impact"]
    E --> F["Display in Dashboard"]
    
    F --> G["User Reviews"]
    G --> H{"Approve?"]
    H -->|Yes| I["Generate Implementation Plan"]
    I --> J{"Auto-Implement?"]
    J -->|Yes| K["Execute Changes"]
    K --> L["Monitor Results"]
    L --> M["Report Success"]
    J -->|No| N["Provide Manual Steps"]
    N --> O["User Implements"]
    O --> L
    H -->|No| P["Dismiss"]
```

---

## Alert & Incident Management Flow

```mermaid
graph TD
    A["CloudWatch/System"] --> B["Detect Anomaly"]
    B --> C["Create Alert"]
    C --> D["Notify DevOps"]
    D --> E["Engineer Views Alert"]
    E --> F["Click for Details"]
    F --> G["View Metrics & Logs"]
    G --> H{"Root Cause?"]
    H -->|Yes| I["Create Incident"]
    I --> J["Escalate if Critical"]
    J --> K["On-call Notified"]
    K --> L["Incident Response"]
    H -->|No| M["Ask AI Copilot"]
    M --> N["Get Suggestions"]
    N --> G
    
    L --> O["Resolve Issue"]
    O --> P["Close Incident"]
    P --> Q["Post Mortem"]
```

---

## Multi-dashboard Context Switching

```mermaid
graph TD
    A["Executive Dashboard"] --> B["View Health Issues"]
    B --> C["Click Issue"]
    C --> D["Switch to DevOps Dashboard"]
    D --> E["View Affected Resource"]
    E --> F["Check Live Metrics"]
    F --> G["Need More Info?"]
    G -->|Yes| H["Switch to AI Copilot"]
    H --> I["Ask for Analysis"]
    I --> J["Get Answer"]
    J --> K["Return to DevOps"]
    K --> L["Take Action"]
```

---

## Data Sync & Refresh Strategy

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant AWS
    participant DB
    
    User->>Frontend: Open Dashboard
    Frontend->>Backend: GET /dashboard
    Backend->>DB: Query cached metrics
    DB-->>Backend: Return cached data
    Backend-->>Frontend: Display dashboard
    
    Backend->>AWS: Background sync (every 5m)
    AWS-->>Backend: New metrics
    Backend->>DB: Update cache
    Frontend->>Backend: Check for updates (websocket)
    Backend-->>Frontend: Push new data
    Frontend->>Frontend: Update UI
```

---

## Real-time Metrics Update Flow

```mermaid
graph TD
    A["Dashboard Loaded"] --> B["Subscribe to Live Metrics"]
    B --> C["WebSocket Connection"]
    C --> D["Backend Streams Data"]
    D --> E["Update Frontend State"]
    E --> F["Re-render Charts"]
    F --> G["Show New Values"]
    
    G --> H["Every 30 seconds"]
    H --> I["Check for Threshold Breaches"]
    I --> J{"Threshold Exceeded?"]
    J -->|Yes| K["Highlight Alert"]
    J -->|No| L["Continue"]
    L --> H
```

---

## Cost Forecast Generation Flow

```mermaid
graph TD
    A["System Collects Daily Costs"] --> B["Store in Time Series DB"]
    B --> C["Every Midnight: Run Forecast"]
    C --> D["Analyze 90-day trend"]
    D --> E["Apply ML Model"]
    E --> F["Calculate Projection"]
    F --> G["Add Confidence Interval"]
    G --> H["Store Forecast"]
    H --> I["Update Dashboard"]
    I --> J["Notify if Over Budget"]
```

---

## Search & Filter Interactions

```mermaid
graph TD
    A["User Types in Search"] --> B["Frontend Debounce (300ms)"]
    B --> C["Send Query to Backend"]
    C --> D["Full-text Search on Resources"]
    D --> E["Return Matches"]
    E --> F["Display Results"]
    F --> G["User Clicks Filter"]
    G --> H["Apply Additional Filter"]
    H --> I["Re-query Results"]
    I --> F
```

---

## Permission & Access Control Flow

```mermaid
graph TD
    A["User Logs In"] --> B["Fetch User Roles"]
    B --> C["Load Permission Matrix"]
    C --> D{"Can View Dashboard?"]
    D -->|No| E["Show 403 Forbidden"]
    D -->|Yes| F["Load Dashboard"]
    
    F --> G["Can Edit Resource?"]
    G -->|No| H["Disable Edit Button"]
    G -->|Yes| I["Enable Edit Button"]
    
    F --> J["Can View Costs?"]
    J -->|No| K["Hide Finance Tab"]
    J -->|Yes| L["Show Finance Tab"]
```

---

## Error Handling & Recovery

```mermaid
graph TD
    A["API Request"] --> B{"Success?"]
    B -->|Yes| C["Return Data"]
    C --> D["Update UI"]
    B -->|No| E{"Error Type?"]
    
    E -->|4xx - Client Error| F["Show User Message"]
    E -->|5xx - Server Error| G["Retry (exponential backoff)"]
    G --> H{"Retry Successful?"]
    H -->|Yes| C
    H -->|No| I["Show Error with Retry"]
    
    E -->|Network Error| J["Queue Request"]
    J --> K["Wait for Connection"]
    K --> L["Retry Queued Request"]
    
    F --> M["User Corrects Input"]
    M --> A
    
    I --> N["User Clicks Retry"]
    N --> A
```

---

## Notification Delivery System

```mermaid
sequenceDiagram
    participant System
    participant NotificationService
    participant User
    
    System->>NotificationService: Alert: High CPU
    NotificationService->>NotificationService: Check User Preferences
    alt User Enabled Email
        NotificationService->>User: Send Email
    end
    alt User Enabled Push
        NotificationService->>User: Send Push Notification
    end
    alt User Enabled SMS
        NotificationService->>User: Send SMS
    end
    User->>System: Click Notification
    User->>System: Navigate to Alert
```

---

## Mobile Responsive Interaction

```mermaid
graph TD
    A["Mobile User Opens App"] --> B{"Screen Size?"]
    B -->|< 640px| C["Load Mobile Layout"]
    B -->|641-1024px| D["Load Tablet Layout"]
    B -->|> 1024px| E["Load Desktop Layout"]
    
    C --> F["Hide Sidebar"]
    F --> G["Show Hamburger Menu"]
    G --> H["Tap Menu"]
    H --> I["Slide Menu In"]
    
    D --> J["Optional Sidebar"]
    E --> K["Fixed Sidebar"]
    
    C --> L["Stack Cards Vertically"]
    D --> M["2-Column Layout"]
    E --> N["3+ Column Layout"]
```

---

## Session & Timeout Management

```mermaid
graph TD
    A["User Active"] --> B["Reset Inactivity Timer"]
    A --> C["Keep Session Alive"]
    
    D["No Activity"] --> E["5 min: Show Warning"]
    E --> F["User Active Again?"]
    F -->|Yes| A
    F -->|No| G["10 min: Auto Logout"]
    
    G --> H["Clear Session"]
    H --> I["Redirect to Login"]
    I --> J["Show Message: Session Expired"]
```

These flows should guide the design and development of interactions in Figma and later implementation.
