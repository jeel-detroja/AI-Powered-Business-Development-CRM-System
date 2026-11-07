# Nexora CRM — AI-Powered Business Development & Customer Relationship Management Platform

Nexora CRM is an enterprise-grade full-stack SaaS platform designed for modern sales teams, business development executives, and revenue operations. It combines an intuitive MERN architecture with Google Gemini AI capabilities to automate lead scoring, draft personalized outreach emails, surface pipeline risks, and provide conversational sales intelligence grounded in real-time CRM telemetry.

---

## 1. Features

- **Executive KPI Dashboard**: Live tracking of Total Leads, New Leads This Month, Qualified Leads, Active Pipeline Value, Won Revenue, Conversion Rates, and Overdue Follow-ups computed via MongoDB aggregations.
- **Interactive Visual Pipeline**: 6-stage Kanban board (Qualification, Discovery, Proposal, Negotiation, Won, Lost) with probability weighting, stage history logs, and instant stage progression.
- **Transparent Lead Scoring Engine**: 0–100 score calculated by backend business logic with detailed criteria breakdowns (profile completeness, budget tier, engagement velocity, pipeline status, source quality, and Gemini qualitative signals).
- **Google Gemini Cognitive Integration**:
  - **AI Sales Assistant**: Conversational agent using official `@google/genai` SDK with allow-listed function calling grounded in organization data.
  - **AI Email Generator**: Generates high-converting outreach, proposal follow-ups, and demo invitations with customizable tone, length, and context.
  - **AI Business Intelligence**: Synthesizes CRM metrics into prioritized action items, health diagnostics, and conversion strategies.
- **Corporate Directory & Contact Management**: Linked company directories, stakeholder profiles, and communication timelines.
- **Activity & Follow-Up Tracking**: Schedule calls, demos, meetings, and emails with overdue alerts and completion tracking.
- **Task Management**: Lightweight task board with List and Kanban views, priority filters, and due date monitoring.
- **Reports & Data Portability**: Export Leads, Contacts, and Deals to standard CSV formats.
- **Multi-Tenant Security & RBAC**: Organization-isolated tenancy with three role tiers (`admin`, `manager`, `rep`), HTTP-only secure cookies, and password hashing with bcrypt.

---

## 2. Technology Stack

- **Frontend**:
  - React 18 with Vite
  - Tailwind CSS & PostCSS
  - React Router DOM v6
  - TanStack Query (React Query v5)
  - Zustand (global auth state)
  - Recharts (charts & visualizations)
  - Lucide React (icons)
  - Sonner (toast notifications)
- **Backend**:
  - Node.js & Express.js (ES Modules)
  - MongoDB & Mongoose ODM
  - JWT Authentication & Secure HTTP-only cookies
  - Zod & Express Validator
  - Helmet, CORS, and Express Rate Limit
  - Express Mongo Sanitize
- **AI Engine**:
  - Google Gemini API (`gemini-3.1-flash-lite`)
  - Official SDK: `@google/genai`
  - Grounded live CRM context injection and multi-model fallback (`gemini-3.1-flash-lite`, `gemini-3.5-flash`, `gemini-flash-lite-latest`)
- **Localization**:
  - Full Indian Rupee (`₹` / INR) formatting and `en-IN` numbering standard (`₹1,50,000`)
  - Realistic Indian enterprise sample data (organizations, leads, deals, contacts)

---

## 3. Architecture & Project Structure

```
nexora-crm/
├── client/                     # Vite + React Frontend Application
│   ├── src/
│   │   ├── components/         # Reusable UI & Layout Components
│   │   │   ├── common/         # Modals, Skeletons, Pagination, Empty/Error states
│   │   │   └── layout/         # Sidebar, Topbar, AppLayout
│   │   ├── constants/          # CRM Stages, Statuses, Color Maps
│   │   ├── pages/              # 26 Complete Functional SaaS Views
│   │   │   ├── auth/           # Login, Register, Forgot Password
│   │   │   ├── leads/          # Leads list, LeadDetail, LeadForm
│   │   │   ├── contacts/       # Contacts list, ContactDetail
│   │   │   ├── companies/      # Companies list, CompanyDetail
│   │   │   ├── deals/          # Deals & Kanban Pipeline, DealDetail
│   │   │   ├── ai/             # AIAssistant, EmailGenerator, BusinessInsights
│   │   │   ├── settings/       # Profile, Organization, Team, AI Settings
│   │   │   ├── Dashboard.jsx   # Executive KPI Overview
│   │   │   ├── Activities.jsx  # Activity & Follow-up log
│   │   │   ├── Tasks.jsx       # Task Board & List
│   │   │   ├── Analytics.jsx   # Performance leaderboards & trends
│   │   │   ├── Reports.jsx     # Downloadable CSV reports
│   │   │   └── Notifications.jsx
│   │   ├── services/           # Axios API connectors
│   │   ├── store/              # Zustand Auth Store
│   │   └── utils/              # Formatters & Helpers
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                     # Node.js + Express Backend REST API
│   ├── config/                 # DB connection & Environment validation
│   ├── constants/              # Roles, Stages, Activity Types
│   ├── controllers/            # Controller logic for all 15 API modules
│   ├── middleware/             # Auth JWT, Role RBAC, Error Handling
│   ├── models/                 # 12 Mongoose Schema Models
│   ├── routes/                 # REST Route definitions
│   ├── scripts/                # Full Database Seeding Script
│   ├── services/gemini/        # Google Gemini Client & AI Function Calling
│   ├── tests/                  # Vitest & Supertest Integration Suite
│   └── app.js                  # Express App Setup
└── package.json
```

---

## 4. Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance (e.g. `mongodb://localhost:27017/nexora_crm`) or MongoDB Atlas URI
- *(Optional)* **Google Gemini API Key**: Free API key from Google AI Studio (`https://aistudio.google.com/`). The platform starts and operates gracefully even without this key.

---

## 5. Installation & Setup

### Step 1: Clone or Navigate to the Project

```bash
cd nexora-crm
```

### Step 2: Configure Environment Variables

> **Security Note:** Real `.env` files contain sensitive secrets and are **strictly git-ignored**. Only copy from the provided `.env.example` templates.

**Backend (`server/.env`):**
```bash
# In the server directory:
cp .env.example .env
```
Ensure your `server/.env` contains your actual configuration:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/nexora_crm
JWT_SECRET=super_secret_jwt_key_nexora_2026
CLIENT_URL=http://localhost:5173
COOKIE_SECRET=super_secret_cookie_key_nexora_2026

# Google Gemini API (leave blank to run CRM without AI features)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.1-flash-lite
GEMINI_TIMEOUT_MS=30000

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
AI_RATE_LIMIT_MAX=40
```

**Frontend (`client/.env` - optional in development due to Vite proxy):**
```bash
# In the client directory (optional):
cp .env.example .env
```
Contains:
```env
VITE_API_URL=/api
```

### Step 3: Install Dependencies

```bash
# Install root & workspace dependencies
npm run install:all
```

Or manually:
```bash
cd server && npm install
cd ../client && npm install
```

---

## 6. Seed Realistic Demo Data

Nexora CRM includes an extensive database seeder generating realistic organizations, users, 35 leads with scores, 12 companies, 18 contacts, 18 deals across all pipeline stages, 38 activities, 20 tasks, and in-app notifications.

```bash
# From project root
npm run seed

# Or from server directory
cd server
npm run seed
```

### Demo Login Credentials

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Admin** | `admin@nexora.dev` | `Password123!` | Full admin access, team management, org settings |
| **Sales Manager** | `manager@nexora.dev` | `Password123!` | Team pipeline monitoring, deal & lead assignment |
| **Sales Rep** | `rep@nexora.dev` | `Password123!` | Personal assigned leads, pipeline execution, tasks |

---

## 7. Running the Application

### Start the Backend Server (Terminal 1)

```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

### Start the Frontend Client (Terminal 2)

```bash
cd client
npm run dev
# Frontend runs on http://localhost:5173
```

Open `http://localhost:5173` in your browser and log in with any of the demo accounts.

---

## 8. Automated Testing

Run the automated Vitest & Supertest suite covering authentication, lead scoring calculations, pipeline progression, role-based security, and AI fallback states:

```bash
# From project root
npm test

# Or from server directory
cd server
npm test
```

---

## 9. API Reference Summary

- `POST /api/auth/register` — Create organization and first admin account
- `POST /api/auth/login` — Sign in and receive secure HTTP-only cookie + JWT
- `GET /api/dashboard/stats` — Retrieve aggregated executive KPIs
- `GET /api/leads` — Paginated, searchable, filtered lead list
- `POST /api/leads/:id/analyze` — Trigger Google Gemini lead intelligence
- `GET /api/deals/pipeline` — Grouped deals by stage with weighted pipeline metrics
- `PATCH /api/deals/:id/stage` — Move deal through pipeline stages
- `POST /api/ai/assistant` — Interactive Gemini sales assistant with live CRM context
- `POST /api/ai/generate-email` — Compose contextual sales emails
- `GET /api/ai/insights` — AI synthesis of CRM database metrics
- `GET /api/ai/test` — Test Google Gemini API connectivity & model availability
- `GET /api/export/leads` — Download full CSV export of leads

---

## 10. License

Proprietary — Nexora CRM Platform. Built for commercial business development and customer relationship intelligence.
