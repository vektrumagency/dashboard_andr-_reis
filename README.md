# Dashboard Andre — IAD Lead Management

Password-protected frontend dashboard for a real estate lead management system. Displays AI-scored property listings from the Cascais premium market for a consultant to review, track, and act on.

**Views:** leads table, map with priority pins, outreach message queue.

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
| `/leads/[id]` | Lead detail — modal from table, full page on direct URL |
| `/login` | Password entry |

## Architecture

**Mock data → Supabase migration path.** `lib/types.ts` is kept 1:1 with the Python backend Pydantic models. `lib/leadsStore.tsx` persists status overrides in localStorage. Swapping to live data only requires changing the data source in `LeadsProvider` — no type changes needed.

**Parallel + intercepting routes for modal UX.** `/leads/[id]` from the table renders as a modal overlay (`@modal/(.)leads/[id]`); direct URL access renders the full page.

**No state management library.** Single React context (`LeadsProvider`) + component-local state. Appropriate for single-user scope.
