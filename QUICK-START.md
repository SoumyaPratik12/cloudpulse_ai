# CloudPulse AI - Developer Quick Start Guide

This guide will help you set up and run CloudPulse AI locally in Codespaces or your development environment.

## Prerequisites

- Node.js 18+ (for frontend)
- Python 3.11+ (for backend)
- Docker (optional, for containers)
- Git

## Project Structure

```
cloudpulse_ai/
├── frontend/          ← React + TypeScript (PORT 3000)
├── backend/           ← FastAPI (PORT 8000) [Not yet implemented]
├── docs/              ← Documentation
├── infrastructure/    ← Terraform configs [Phase 2]
└── docker/            ← Docker files
```

## Quick Start: Frontend Only

### 1. Clone & Setup

```bash
cd /workspaces/cloudpulse_ai
cd frontend
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Opens automatically at `http://localhost:3000`

### 3. Build for Production

```bash
npm run build
# Output in dist/ folder
```

## Available Scripts

### Frontend (`cd frontend/`)

```bash
npm run dev           # Start dev server with HMR
npm run build         # Build for production
npm run preview       # Preview production build
npm run lint          # Run ESLint
npm run type-check    # TypeScript type checking
```

## Project Navigation

### 📄 Documentation
- [Vision & Strategy](docs/vision.md) - Product strategy
- [PRD](docs/prd.md) - Product requirements
- [Design System](docs/DESIGN-SYSTEM.md) - Colors, typography, spacing
- [Components](docs/COMPONENT-LIBRARY.md) - 50+ component specs
- [Wireframes](docs/WIREFRAMES.md) - 19 page layouts
- [User Flows](docs/USER-FLOWS.md) - 15 user journey diagrams
- [Phase 1 Report](docs/PHASE-1-COMPLETION.md) - Frontend completion

### 🎨 Frontend (`/frontend/`)
- `src/components/` - 50+ React components
- `src/pages/` - 7 full pages
- `src/App.tsx` - Routing & main app
- `tailwind.config.ts` - Design tokens
- `README.md` - Frontend-specific setup

### 🚀 Next: Backend & AI (Not Yet Started)
- `backend/` - FastAPI application [Phase 3]
- `ai/` - LangGraph multi-agent system [Phase 5]
- `infrastructure/` - Terraform modules [Phase 2]

## Key Features

### Frontend (✅ Complete)
- ✅ 50+ Production Components (Button, Input, Card, Modal, etc.)
- ✅ 7 Full Pages (Login, Dashboard, Settings, Resources, 3 Error pages)
- ✅ Dark Mode with theme toggle
- ✅ Responsive Design (mobile, tablet, desktop)
- ✅ WCAG 2.1 AA Accessibility
- ✅ 179KB Gzipped bundle
- ✅ Zero TypeScript errors

### Backend (🚀 Next Phase)
- [ ] FastAPI server
- [ ] PostgreSQL + pgvector
- [ ] Redis + Celery
- [ ] AWS boto3 integration
- [ ] JWT authentication

### AI Agents (📋 Coming)
- [ ] LangGraph multi-agent orchestration
- [ ] Cost Optimization agent
- [ ] RCA (Root Cause Analysis) copilot
- [ ] OpenAI/Anthropic integration

## Component Examples

### Button
```tsx
import { Button } from '@/components'

<Button 
  variant="primary" 
  size="md"
  icon={<Plus />}
>
  Click Me
</Button>
```

### Input
```tsx
import { Input } from '@/components'

<Input
  label="Email"
  type="email"
  placeholder="you@example.com"
  required
/>
```

### Card with Alert
```tsx
import { Card, Alert } from '@/components'

<Card header={<h2>Dashboard</h2>}>
  <Alert type="success">Everything is working!</Alert>
  <p>Card content here</p>
</Card>
```

### DataTable
```tsx
import { DataTable } from '@/components'

<DataTable
  columns={[
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' }
  ]}
  rows={data}
  onRowClick={(row) => console.log(row)}
/>
```

## Pages Available

1. **Login** (`/login`)
   - Email/password form
   - Remember me option
   - Sign up link

2. **Dashboard** (`/dashboard`)
   - 4 stat cards
   - Line & pie charts
   - Action buttons
   - Alert banner

3. **Settings** (`/settings`)
   - Organization settings
   - Notification preferences
   - AWS credentials

4. **Resources** (`/resources`)
   - Data table
   - Add resource button
   - Info alerts

5. **Error Pages**
   - 404 Not Found
   - 403 Forbidden
   - 500 Server Error

## Design System

### Colors
```tsx
// Primary (blue)
className="bg-primary-500 text-primary-600"

// Success (green)
className="bg-success-500 text-success-600"

// Warning (amber)
className="bg-warning-500 text-warning-600"

// Error (red)
className="bg-error-500 text-error-600"

// Dark mode
className="dark:bg-neutral-800 dark:text-white"
```

### Spacing (8px base)
```tsx
className="p-md gap-lg"  // 16px padding, 24px gap
className="mt-sm mb-lg"  // 8px margin-top, 24px margin-bottom
```

### Typography
```tsx
className="text-h1 font-bold"    // 32px heading
className="text-body-md"          // 14px body
className="text-button-lg"        // 16px button
```

## Development Workflow

1. **Create a branch**
   ```bash
   git checkout -b feature/new-component
   ```

2. **Make changes**
   - Edit components in `src/components/`
   - Update pages in `src/pages/`
   - Modify design tokens in `tailwind.config.ts`

3. **Test in dev server**
   ```bash
   npm run dev
   # Changes auto-reload (HMR)
   ```

4. **Type check before commit**
   ```bash
   npm run type-check
   ```

5. **Commit & push**
   ```bash
   git add .
   git commit -m "feat: add new component"
   git push origin feature/new-component
   ```

## Troubleshooting

### Port 3000 already in use
```bash
# Find and kill process
lsof -i :3000
kill -9 <PID>

# Or use different port
npm run dev -- --port 3001
```

### TypeScript errors
```bash
npm run type-check  # See all errors
npm run lint        # See lint issues
```

### Build fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Module not found errors
```bash
# Check path aliases in tsconfig.json
# @/components should resolve to src/components/
# @/pages should resolve to src/pages/
```

## Next Steps

### Phase 2 (Jul 12-15)
- [ ] Design system documentation
- [ ] Architecture design
- [ ] API specifications
- [ ] Database schema planning

### Phase 3 (Jul 15-22)
- [ ] Build FastAPI backend
- [ ] Setup PostgreSQL + migrations
- [ ] AWS integration with boto3
- [ ] Connect frontend to APIs

### Phase 4+ (Jul 23 - Aug 6)
- [ ] AI agents (LangGraph)
- [ ] Authentication flow
- [ ] Deployment setup
- [ ] Production release

## Resources

- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com)
- [Vite Docs](https://vitejs.dev)
- [Lucide Icons](https://lucide.dev)
- [Recharts](https://recharts.org)

## Support

For issues or questions:
1. Check existing documentation in `docs/`
2. Look at component examples in `src/components/`
3. Review page implementations in `src/pages/`
4. Check TypeScript errors: `npm run type-check`

## Summary

✅ Frontend is production-ready with 50+ components and 7 full pages
🚀 Ready to start Phase 2 (System Architecture) and Phase 3 (Backend)
📅 On track for 4-week MVP completion by Aug 6, 2026

Happy coding! 🎉
