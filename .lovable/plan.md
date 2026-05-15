## ARIA Dashboard — Implementation Plan

Frontend-only app. Cloud is enabled. Secrets `SERPER_API_KEY`, `RESEND_API_KEY`, `DISCORD_WEBHOOK_URL`, `NOTION_API_KEY`, `GITHUB_TOKEN` are wired. Optional `ARIA_BACKEND_URL` selects real Python backend vs built-in mock engine.

### What ships
A demo-ready ARIA control room: compose runs, watch agents think live, inspect evidence + critic verdicts, deliver reports to Email/Discord/Notion/GitHub. No Python required for the demo.

### Visual direction
- **Aesthetic:** dark "mission-control" — near-black canvas (`oklch(0.12 0.02 260)`), cyan-electric accent (`oklch(0.78 0.16 200)`), amber for critic warnings, mono display font (`JetBrains Mono`) for agent IDs/timestamps, `Inter` for body. Subtle scanline + grid background, glow on active agent nodes, monospace ticker for live tokens.
- Inspired by Bloomberg terminal × Linear × Vercel observability.

### Repository structure
```text
src/
  routes/
    __root.tsx                      shell: sidebar + topbar + Outlet
    index.tsx                       Live Runs board (active + recent)
    runs.$id.tsx                    Run detail: timeline, evidence, report
    personas.tsx                    Persona library (Student/Founder/Investor + custom)
    deliveries.tsx                  Delivery log (channel, status, payload)
    settings.tsx                    Backend URL toggle, secret status, demo controls
    api/aria/
      runs.ts                       GET list / POST create
      runs.$id.ts                   GET single
      runs.$id.events.ts            GET SSE stream
      deliver.ts                    POST → email / discord / notion / github
      search.ts                     POST → Serper proxy w/ cache
  components/aria/
    AppShell.tsx, Sidebar.tsx, TopBar.tsx
    RunComposer.tsx                 topic + persona + channels + depth slider
    RunCard.tsx, RunFeed.tsx
    AgentTimeline.tsx               vertical lane per agent w/ live status pills
    AgentNode.tsx                   pulsing node, tool-call badges
    LiveEventLog.tsx                terminal-style ticker
    EvidenceCard.tsx                source w/ score + highlight
    ConfidenceMeter.tsx             radial gauge
    CriticVerdict.tsx               pass/fail + reasons + retry indicator
    ReportView.tsx                  streamed markdown w/ syntax + citations
    DeliveryChips.tsx               channel pills w/ delivery state
  lib/aria/
    types.ts                        Run, AgentEvent, Evidence, Verdict, Persona, Delivery
    sse.ts                          typed EventSource helper + reconnect
    client.ts                       thin fetchers used by routes/components
    mock-engine.ts                  scripted multi-agent run generator (Researcher → Validator → Critic → Synthesizer → Deliverer) emitting realistic event cadence + tool calls
    personas.ts                     3 presets + custom
    connectors.ts                   server-side: serper, resend, discord, notion, github
```

### Execution flow
```text
RunComposer ── POST /api/aria/runs ──► server route
                                          │
                          ARIA_BACKEND_URL set?
                          ├── yes → forward to Python backend, stream its SSE through
                          └── no  → spawn mock-engine run, persist to in-memory store
                                          │
RunDetail ── GET /api/aria/runs/:id/events (SSE) ──► live agent.* events
                                          │
On run.completed → POST /api/aria/deliver per channel
                   (email/Resend, Discord webhook, Notion page, GitHub gist)
```

### Event contract (SSE)
`run.started` · `agent.started{agent}` · `agent.thinking{agent,token}` · `agent.tool_call{agent,tool,args}` · `agent.tool_result{agent,tool,ok,latency_ms}` · `evidence.added{url,title,score}` · `confidence.updated{score}` · `critic.verdict{score,passed,reasons}` · `retry.scheduled{attempt}` · `report.chunk{token}` · `delivery.sent{channel,id}` · `run.completed` / `run.failed`

### Mock engine behavior (so the demo never depends on the Python backend)
1. Researcher: 3 `serper.search` tool calls (real, via `/api/aria/search`), emits 6–10 evidence cards.
2. Validator: scores each source (recency × authority × relevance), drops weakest 2.
3. Critic: emits verdict; ~25% chance of `passed:false` → triggers `retry.scheduled` + Researcher re-run with refined query (visible second pass = believable autonomy).
4. Synthesizer: streams persona-shaped markdown report token-by-token via Lovable AI Gateway (`google/gemini-2.5-flash`).
5. Deliverer: fans out to selected channels using real connector calls; logs deliveries.

Cadence: 80–250ms between thinking tokens, 400–1200ms between tool calls — feels alive, not fake.

### Connectors (server-side only, real)
- **Serper** — `POST https://google.serper.dev/search`, cached 10min in memory.
- **Resend** — `POST /emails` with from `aria@resend.dev` (fallback) + persona-styled HTML.
- **Discord** — webhook embed with title, confidence, top 3 evidence links.
- **Notion** — create page in user's workspace (page id from settings).
- **GitHub** — create gist with full markdown report.

### Persistence
Phase 1: in-memory `Map` on the server (sufficient for hackathon demo). Cloud DB schema (`personas`, `runs`, `run_events`, `deliveries`) added in a follow-up turn if the user wants persistence across server restarts — out of scope for first build to keep it shippable today.

### Roadmap (single build session)
1. Design tokens in `styles.css` + AppShell + Sidebar/TopBar.
2. `lib/aria` (types, sse, mock-engine, connectors, personas).
3. Server routes (runs, events SSE, search, deliver).
4. `index.tsx` Live Runs + `RunComposer`.
5. `runs.$id.tsx` with AgentTimeline + LiveEventLog + EvidenceCard + ConfidenceMeter + CriticVerdict + ReportView + DeliveryChips.
6. `personas.tsx`, `deliveries.tsx`, `settings.tsx`.
7. Demo polish: 3 preset runs (Student / Founder / Investor) + "Run demo" button on home.

### Out of scope (intentionally)
LangGraph, RQ, Chroma, Kokoro TTS, Omium, auth — the Python service keeps those. This dashboard gives ARIA a production-quality face and a self-contained demo path.
