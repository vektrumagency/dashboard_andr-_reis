# Dashboard Andre — IAD Lead Management

Password-protected frontend dashboard for a real estate lead management system. Displays AI-scored property listings from the Cascais premium market for a consultant to review, track, and act on.

**Views:** leads table, Localizar processing/answered queue, map with priority pins,
and outreach message queue.

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4, Mapbox GL 3
- Web Crypto API for session auth (no third-party auth library)
- Currently uses mock data — Supabase integration pending

## Setup

```bash
npm install
```

Create `.env.local`:

```
DASHBOARD_PASSWORD=your_password
DASHBOARD_SESSION_SECRET=a_long_random_string
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
MONGODB_URI=mongodb://...
MONGODB_DB_NAME=andre_reis_leads
LEAD_RESEARCHER_API_URL=http://localhost:8000
DASHBOARD_SERVICE_TOKEN=the_same_dashboard_token_configured_in_fastapi
```

```bash
npm run dev    # http://localhost:3000
npm run build
npm run start
```

## Routes

| Route | Description |
|---|---|
| `/` | Leads table (score-sorted, filterable) |
| `/mapa` | Mapbox map with priority-colored pins |
| `/atacar` | Outreach queue (high-priority leads only) |
| `/localizar` | Properties awaiting Vektrum localization and answered addresses |
| `/leads/[id]` | Lead detail — modal from table, full page on direct URL |
| `/login` | Password entry |

## Architecture

**MongoDB reads + authenticated BFF mutations.** `lib/types.ts` is kept aligned
with the Python Pydantic models. The dashboard reads leads server-side from the
shared MongoDB database. Localizar mutations pass through authenticated Next.js
route handlers to FastAPI; service tokens never reach browser code.

**Parallel + intercepting routes for modal UX.** `/leads/[id]` from the table renders as a modal overlay (`@modal/(.)leads/[id]`); direct URL access renders the full page.

**No state management library.** Single React context (`LeadsProvider`) + component-local state. Appropriate for single-user scope.
