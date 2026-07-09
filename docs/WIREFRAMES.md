# CloudPulse AI - Wireframe & Screen Specifications

**Phase 1 Deliverable** | Detailed wireframe specs for all screens
**Created:** 2026-07-09 | **Status:** Draft

---

## Screen Overview

```
Authentication Flow
├── Login Screen
├── Sign Up Screen
├── MFA Setup Screen
└── Password Reset Screen

Main Application
├── Navigation (Sidebar + Header)
└── Dashboards
    ├── Executive Dashboard
    ├── DevOps Dashboard
    ├── Finance Dashboard
    └── AI Copilot Dashboard

Settings & Admin
├── Organization Settings
├── User Profile
├── AWS Credentials Setup
└── Notification Preferences
```

---

## Authentication Screens

### Login Screen
**Purpose:** User login with email/password
**URL Pattern:** `/login`

**Layout:**
```
┌─────────────────────────────────────┐
│  CloudPulse AI                      │
│  (Logo centered)                    │
├─────────────────────────────────────┤
│                                     │
│  Sign In to CloudPulse              │
│                                     │
│  Email Address                      │
│  [_____________________]            │
│  helper text: example@company.com   │
│                                     │
│  Password                           │
│  [_____________________]            │
│  [Forgot password?] (link)          │
│                                     │
│  [ ] Remember me (checkbox)         │
│                                     │
│  ┌────────────────────────────────┐ │
│  │ Sign In (Blue button)          │ │
│  └────────────────────────────────┘ │
│                                     │
│  Don't have account? Sign Up (link) │
│                                     │
│  ─────────────────────────────────  │
│  Or continue with                   │
│  [GitHub] [Google] (buttons)        │
│                                     │
└─────────────────────────────────────┘
```

**Components:**
- Email input field (with validation)
- Password input field (with show/hide toggle)
- "Forgot password?" link
- "Remember me" checkbox
- Sign In button (primary, full width)
- Sign Up link
- OAuth buttons (GitHub, Google)

**States:**
- Default (empty form)
- Filled (user entered data)
- Error (invalid credentials - red border, error message)
- Loading (sign in button shows spinner)

---

### Sign Up Screen
**Purpose:** New user registration
**URL Pattern:** `/signup`

**Layout:**
```
┌─────────────────────────────────────┐
│  Create Account                     │
├─────────────────────────────────────┤
│                                     │
│  Full Name                          │
│  [_____________________]            │
│                                     │
│  Email Address                      │
│  [_____________________]            │
│                                     │
│  Organization Name                  │
│  [_____________________]             │
│                                     │
│  Password                           │
│  [_____________________]            │
│  (8+ chars, 1 uppercase, 1 number) │
│                                     │
│  Confirm Password                   │
│  [_____________________]            │
│                                     │
│  [ ] I agree to Terms & Privacy     │
│                                     │
│  ┌────────────────────────────────┐ │
│  │ Create Account                 │ │
│  └────────────────────────────────┘ │
│                                     │
│  Already have account? Sign In      │
│                                     │
└─────────────────────────────────────┘
```

**Components:**
- Full Name input
- Email input (with validation)
- Organization Name input
- Password input (with strength indicator)
- Confirm Password input
- Terms checkbox
- Create Account button
- Sign In link

---

### MFA Setup Screen
**Purpose:** Enable multi-factor authentication
**URL Pattern:** `/mfa-setup`

**Layout:**
```
┌─────────────────────────────────────┐
│  Enable Two-Factor Auth             │
├─────────────────────────────────────┤
│  ✓ Email verified                   │
│                                     │
│  Choose Authentication Method       │
│  ◯ Authenticator App (Google Auth) │
│  ◯ SMS Text Message                 │
│                                     │
│  ┌────────────────────────────────┐ │
│  │ Continue with Authenticator    │ │
│  └────────────────────────────────┘ │
│                                     │
│  ┌────────────────────────────────┐ │
│  │ Continue with SMS              │ │
│  └────────────────────────────────┘ │
│                                     │
│  [Skip for now] (tertiary link)     │
│                                     │
└─────────────────────────────────────┘
```

---

## Navigation Structure

### Sidebar (Left)
**Width:** 260px (collapsible to 60px)
**Position:** Fixed, left side

**Contents:**
```
┌────────────────────────────┐
│ [≡] CloudPulse AI Logo     │
├────────────────────────────┤
│ Dashboard                  │ (active = blue)
│ Resources                  │
│ Cost Analysis              │
│ Recommendations            │
│ AI Copilot                 │
│ Alerts                     │
│ Reports                    │
├────────────────────────────┤
│ Settings                   │
│ Documentation              │
│ Help & Support             │
├────────────────────────────┤
│ Account                    │
│ Logout                     │
└────────────────────────────┘
```

**Features:**
- Collapsible (hamburger menu)
- Active state highlight
- Tooltip on hover (when collapsed)
- Scroll if content exceeds height

### Top Navigation (Header)
**Height:** 64px
**Position:** Fixed, full width

**Contents (Left to Right):**
```
[Hamburger] | Breadcrumb > Current Page

                          [Search] [Notifications] [User Menu ▼]
```

**User Menu (Dropdown):**
```
┌──────────────────────────┐
│ Your Account             │
│ Organization Settings    │
│ AWS Credentials          │
│ ─────────────────────    │
│ Preferences              │
│ Keyboard Shortcuts       │
│ ─────────────────────    │
│ Help & Documentation     │
│ Report Bug               │
│ ─────────────────────    │
│ Sign Out                 │
└──────────────────────────┘
```

---

## Executive Dashboard

**Purpose:** High-level overview for CTOs/C-level
**URL Pattern:** `/dashboard/executive`
**Role:** CTO, VP Engineering

**Layout Grid:** 12 columns

```
┌──────────────────────────────────────────────────────────────┐
│ Executive Dashboard                    [Last updated 5m ago] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐│
│ │ Health Score    │  │ Monthly Cost    │  │ Key Risks      ││
│ │ 87/100          │  │ $12,450         │  │ • 3 Critical   ││
│ │ (Green badge)   │  │ (↓ 8% vs last)  │  │ • 7 High       ││
│ └─────────────────┘  └─────────────────┘  └────────────────┘│
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Infrastructure Health Breakdown                          │ │
│ │                                                          │ │
│ │ CPU Utilization:     ████████░░ 78%                     │ │
│ │ Memory Utilization:  ██████░░░░ 62%                     │ │
│ │ Storage:             ███░░░░░░░ 32%                     │ │
│ │ Network:             ██████████ 95%  ⚠️                  │ │
│ │ Security Score:      █████░░░░░ 52%  🔴                 │ │
│ │                                                          │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────┐  ┌─────────────────────────────┐ │
│ │ Cost Trend (30 days)    │  │ Top Recommendations        │ │
│ │                         │  │                             │ │
│ │ $  ╱╲                   │  │ 1. Downsize 5 EC2 instances│ │
│ │    ╱  ╲    ╱───         │  │    Est. Savings: $2,100/mo │ │
│ │   ╱    ╲──╱             │  │                             │ │
│ │                         │  │ 2. Delete 12 unattached    │ │
│ │ Trend: ↑ +3% vs last m  │  │    EBS volumes             │ │
│ │                         │  │    Est. Savings: $340/mo   │ │
│ └─────────────────────────┘  │                             │ │
│                              │ 3. Reserve 20 compute units │ │
│ ┌──────────────────────────┐  │    Est. Savings: $1,840/mo│ │
│ │ Active Incidents         │  │                             │ │
│ │ • RDS: High connections  │  │ [View All Recommendations] │ │
│ │ • EC2: Disk usage 95%    │  └─────────────────────────────┘ │
│ │ • CloudWatch: Alarm on.. │                                 │
│ └──────────────────────────┘                                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Key Sections:**
1. **Top KPI Cards** (3 columns)
   - Health Score (large number, color-coded)
   - Monthly Cost (with trend)
   - Key Risks (count by severity)

2. **Health Breakdown** (Full width)
   - Horizontal bars with percentages
   - Color-coded by status
   - Icons for warnings/errors

3. **Cost Trend Chart** (Left, 50%)
   - Line chart, 30-day view
   - Tooltip on hover

4. **Top Recommendations** (Right, 50%)
   - Prioritized list
   - Estimated savings per item
   - "View All" link

5. **Active Incidents** (Bottom)
   - List with severity indicators
   - Resource name
   - "View Details" action

**Interactive Elements:**
- All KPI cards clickable (navigate to detail view)
- Chart interactions (hover for values)
- Recommendation cards have "Implement" button
- Incidents have drill-down link

---

## DevOps Dashboard

**Purpose:** Real-time operations view for engineers
**URL Pattern:** `/dashboard/devops`
**Role:** DevOps Engineer, SRE

**Layout:**

```
┌──────────────────────────────────────────────────────────────┐
│ DevOps Dashboard                       [Auto-refresh: 30s]   │
│ [Filter] [Search Resources]                                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─ RESOURCES ─────────────────────────────────────────────┐ │
│ │                                                        │ │
│ │ Name          │ Type    │ State   │ CPU  │ Memory │ Up  ││
│ │ ─────────────────────────────────────────────────────  ││
│ │ web-prod-01   │ EC2     │ Running │ 65%  │ 82%    │ 42d ││
│ │ api-prod-02   │ EC2     │ Running │ 78%  │ 91%    │ 28d ││
│ │ db-primary    │ RDS     │ Running │ 45%  │ 72%    │ 180d││
│ │ cache-01      │ Redis   │ Running │ 23%  │ 58%    │ 15d ││
│ │ web-dev-01    │ EC2     │ Stopped │ -    │ -      │ N/A ││
│ │ [Load more]                                         │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ LIVE METRICS ──────────────────────────────────────────┐ │
│ │ Resource: web-prod-01                                 │ │
│ │                                                        │ │
│ │ CPU (1h)     │ Memory (1h)   │ Network (1h)          │ │
│ │ ╱╲    ╱╲     │ ███░░░░░ 65%  │ ╱╲╱╲╱╲╱╲              │ │
│ │╱  ╲  ╱  ╲    │               │                       │ │
│ │ Avg: 62%    │ Avg: 73%      │ In: 1.2 MB/s          │ │
│ │             │                │ Out: 0.8 MB/s         │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ ALERTS & EVENTS ───────────────────────────────────────┐ │
│ │ Time        │ Severity │ Message                        │ │
│ │ ─────────────────────────────────────────────────────   │ │
│ │ 14:32       │ ⚠️ WARN  │ db-primary: High connections  │ │
│ │ 13:15       │ 🔴 CRIT  │ api-prod-02: 95% memory       │ │
│ │ 12:01       │ ℹ️ INFO  │ web-dev-01: Stopped by user   │ │
│ │                                                        │ │
│ │ [View all events]                                     │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ LOG VIEWER ────────────────────────────────────────────┐ │
│ │ Resource: [Select...] │ Service: [Select...] │ [🔄]    │ │
│ │ [Filter] [Export]                                     │ │
│ │                                                        │ │
│ │ 2026-07-09 14:35:22 INFO  Request processed (234ms)   │ │
│ │ 2026-07-09 14:35:21 INFO  Connected to database       │ │
│ │ 2026-07-09 14:35:20 WARN  Slow query detected (512ms) │ │
│ │ 2026-07-09 14:35:19 INFO  Cache hit: user_profile     │ │
│ │ [Scroll for more]                                     │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Key Sections:**
1. **Resources Table**
   - Searchable/filterable
   - Columns: Name, Type, State, CPU, Memory, Uptime
   - Row actions: View details, Stop/Start, SSH
   - Color-coded status

2. **Live Metrics**
   - Selectable resource
   - Multiple metric charts
   - Time range selector (1h, 6h, 24h)

3. **Alerts & Events**
   - Real-time alert stream
   - Severity indicators
   - Actionable items

4. **Log Viewer**
   - Resource/service selector
   - Real-time log stream
   - Filter/search
   - Export logs

---

## Finance Dashboard

**Purpose:** Cost analysis and budget tracking
**URL Pattern:** `/dashboard/finance`
**Role:** FinOps, Finance

**Layout:**

```
┌──────────────────────────────────────────────────────────────┐
│ Finance Dashboard                   [Month: July 2026]       │
│ [Prev Month] [This Month] [Next Month] [Custom Range]       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐ │
│ │ Total Cost       │  │ Budget Status    │  │ Forecast   │ │
│ │ $12,450          │  │ $15,000 (83%)    │  │ $13,200    │ │
│ │ ↓ 8% vs Jun      │  │ ████████░░       │  │ (↑ 6% vs   │ │
│ │                  │  │ $2,550 remaining │  │  last mo)  │ │
│ └──────────────────┘  └──────────────────┘  └────────────┘ │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Cost by Service (30 days)                              │ │
│ │                                                        │ │
│ │ EC2          ████████████░░░ 45% ($5,600)              │ │
│ │ RDS          ███████░░░░░░░░ 25% ($3,100)              │ │
│ │ S3           ████░░░░░░░░░░░ 12% ($1,500)              │ │
│ │ CloudFront   ███░░░░░░░░░░░░  8% ($1,000)              │ │
│ │ Others       ██░░░░░░░░░░░░░  5% ($600)               │ │
│ │                                                        │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌──────────────────────────┐  ┌──────────────────────────┐ │
│ │ Cost Breakdown           │  │ Cost Allocation          │ │
│ │ (by resource)            │  │ (by department)          │ │
│ │                          │  │                          │ │
│ │ web-prod          $4,200 │  │ Engineering:  $8,900    │ │
│ │ api-prod          $3,100 │  │ Marketing:    $2,100    │ │
│ │ database          $2,850 │  │ Finance:      $1,450    │ │
│ │ cache             $1,200 │  │                          │ │
│ │ [View all]                 │  │ [Configure tags]         │ │
│ └──────────────────────────┘  └──────────────────────────┘ │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Savings Opportunities                                   │ │
│ │                                                        │ │
│ │ ✓ Reserved Instances     Est. Savings: $2,100/mo      │ │
│ │ ✓ Unused resources       Est. Savings: $400/mo        │ │
│ │ ✓ Spot instances         Est. Savings: $600/mo        │ │
│ │   [Total: $3,100/mo potential savings]                │ │
│ │                                                        │ │
│ │ [View recommendations]                                │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Key Sections:**
1. **Cost KPIs** (3 cards)
   - Total cost with trend
   - Budget vs. actual
   - Forecast

2. **Cost by Service** (Full width)
   - Horizontal bar chart
   - Percentage and absolute values
   - Color-coded

3. **Cost Breakdown** (Left) & **Cost Allocation** (Right)
   - Detailed breakdown tables
   - Sortable/filterable
   - Tag-based allocation

4. **Savings Opportunities**
   - List with estimated savings
   - Actionable items
   - Total potential savings

---

## AI Copilot Dashboard

**Purpose:** Conversational AI interface for analysis
**URL Pattern:** `/dashboard/copilot`

**Layout:**

```
┌──────────────────────────────────────────────────────────────┐
│ AI Copilot                                 [New Conversation]│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─ CONVERSATION ──────────────────────────────────────────┐ │
│ │                                                        │ │
│ │ User: Why is my memory usage so high?                 │ │
│ │                                                        │ │
│ │ Copilot:                                              │ │
│ │ Based on analysis of web-prod-01 and api-prod-02:     │ │
│ │                                                        │ │
│ │ 1. Cache memory leak detected in redis-01             │ │
│ │    - Memory grew 2GB in last 6 hours                  │ │
│ │    - Recommendation: Restart and apply patch          │ │
│ │                                                        │ │
│ │ 2. Database connection pool not releasing              │ │
│ │    - 240 idle connections consuming 1.2GB             │ │
│ │    - Recommendation: Reduce pool size from 500 to 100 │ │
│ │                                                        │ │
│ │ Would you like me to generate a runbook for this?     │ │
│ │                                                        │ │
│ │ [Generate Runbook] [Show Metrics] [Analyze...]        │ │
│ │                                                        │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ INPUT ─────────────────────────────────────────────────┐ │
│ │ [Input field: Ask a question...]                      │ │
│ │ [Attachments] [Send ➤]                                │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ CONVERSATION HISTORY ──────────────────────────────────┐ │
│ │ • Today                                                │ │
│ │   - Cost optimization for Q3                          │ │
│ │   - Database performance issue (3:45 PM)              │ │
│ │   - Auto-scaling configuration review                 │ │
│ │                                                        │ │
│ │ • Yesterday                                            │ │
│ │   - Infrastructure audit recommendations              │ │
│ │   - Security group misconfiguration                   │ │
│ │                                                        │ │
│ │ [Clear history]                                       │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Key Sections:**
1. **Conversation Area** (Main)
   - User messages (right-aligned, blue)
   - AI responses (left-aligned, light background)
   - Code blocks with syntax highlighting
   - Embedded charts/data

2. **Input Area** (Bottom)
   - Text input with placeholder
   - Send button
   - File attachments

3. **Conversation History** (Sidebar)
   - Grouped by date
   - Searchable
   - Can restore previous conversations

**Features:**
- Real-time streaming responses
- Copy code snippets button
- "Generate Runbook" action
- Chart/metric embedding
- Save conversations

---

## Settings Screens

### Organization Settings
**URL:** `/settings/organization`

```
┌──────────────────────────────────────────────────────────────┐
│ Organization Settings                                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Organization Name                                           │
│ [CloudPulse Demo]                                           │
│                                                              │
│ AWS Account ID                                              │
│ [123456789012]                                              │
│                                                              │
│ Industry                                                    │
│ [SaaS                          ▼]                           │
│                                                              │
│ Team Size                                                   │
│ [50-100 employees              ▼]                           │
│                                                              │
│ Primary Use Case                                            │
│ ☑ Cost Optimization                                         │
│ ☑ Performance Monitoring                                    │
│ ☐ Security Analysis                                         │
│                                                              │
│ [Save Changes] [Cancel]                                     │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ AWS Credentials                                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Connected AWS Account: 123456789012                         │
│ Status: ✓ Connected                                         │
│ Permissions: Read-only                                      │
│                                                              │
│ [Rotate Credentials] [Disconnect] [Add Another Account]    │
│                                                              │
│ Permissions Summary                                         │
│ ✓ EC2 Read                                                  │
│ ✓ CloudWatch Read                                           │
│ ✓ Cost Explorer Read                                        │
│ ✓ IAM Read                                                  │
│ [View IAM Policy]                                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### User Profile
**URL:** `/settings/profile`

```
┌──────────────────────────────────────────────────────────────┐
│ Your Profile                                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Profile Picture                                             │
│ [Avatar] [Upload Photo] [Remove]                            │
│                                                              │
│ Full Name                                                   │
│ [John Doe]                                                  │
│                                                              │
│ Email                                                       │
│ [john@company.com]                                          │
│                                                              │
│ Role                                                        │
│ [CTO / VP Engineering      ▼]                              │
│                                                              │
│ Phone (Optional)                                            │
│ [+1 (555) 123-4567]                                         │
│                                                              │
│ Time Zone                                                   │
│ [UTC-8 (Pacific Time)      ▼]                              │
│                                                              │
│ Language Preference                                         │
│ [English              ▼]                                    │
│                                                              │
│ [Save Changes] [Cancel]                                     │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Security                                                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Password                                                    │
│ ••••••••••                                                  │
│ [Change Password]                                           │
│                                                              │
│ Two-Factor Authentication                                  │
│ ✓ Enabled                                                   │
│ [Manage MFA] [Disable]                                      │
│                                                              │
│ Active Sessions                                             │
│ • This browser (Chrome)                                     │
│ • Mobile app (iOS)                                          │
│ [Sign out all other sessions]                               │
│                                                              │
│ API Tokens                                                  │
│ [Manage API Keys]                                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Responsive Behavior

### Mobile (< 640px)
- Sidebar converts to hamburger menu
- Single column layout
- Charts stack vertically
- Full-width cards
- Touch-optimized buttons (48px min)

### Tablet (641px - 1024px)
- Sidebar can hide/show
- Two-column layout
- Smaller charts
- Adjusted spacing

### Desktop (1025px+)
- Full sidebar visible
- Multi-column layouts
- Full-size charts
- Default spacing

---

## Interaction Patterns

### Navigation
- Click sidebar item → load dashboard
- Breadcrumb navigation for sub-sections
- Keyboard shortcuts: `Alt+1` (Dashboard), `Alt+2` (Resources), etc.

### Data Tables
- Hover highlights row
- Click row for details
- Sortable columns (click header)
- Pagination or infinite scroll

### Charts
- Hover shows tooltip
- Click legend to show/hide series
- Pinch to zoom on touch
- Double-click to reset zoom

### Forms
- Tab order logical
- Required fields marked with *
- Real-time validation
- Error messages below field
- Submit on Enter (text inputs)

### Modals
- Overlay with semi-transparent background
- Keyboard: Escape to close, Tab cycles through focusable elements
- Click outside to close (if dismissible)

---

## Accessibility Requirements

- Color is not the only means of conveying information (use icons + text)
- All icons have `aria-label`
- Charts have text alternatives
- Focus indicators visible on all interactive elements
- Keyboard navigation fully supported
- Screen reader tested
- Contrast ratio 4.5:1 (normal text)

---

## Next Steps for Design Team

1. **Create Figma Project** with all screens
2. **Build Component Library** in Figma
3. **Create Prototypes** with interactions
4. **Conduct Usability Testing** with 5+ users
5. **Document Deviation Notes** from this spec
6. **Share Figma Link** in `docs/design.md`

All details in this spec can be implemented as Figma components for reuse.
