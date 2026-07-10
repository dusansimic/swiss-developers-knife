# Note: Browser preview for coding agents (t3-code)

How to let a coding agent open and drive this web app in a browser.

## Why it can fail

The agent's `preview_*` tools (`preview_open`, `preview_navigate`,
`preview_snapshot`, `preview_click`, `preview_type`, …) do **not** launch their
own browser. They automate a **collaborative browser tab rendered inside the
t3-code web UI** — a preview pane in *your* browser. That pane is the
"automation host". If no pane is connected, every call returns:

```
PreviewAutomationNoAvailableHostError: No preview automation host is available …
```

No Playwright/Chromium is installed locally (`~/.cache/ms-playwright` absent),
which confirms the host is the UI pane, not a headless browser.

## Local topology

- t3-code server (runs the agent): `http://127.0.0.1:3773`
  (serves both the MCP endpoint and the web UI)
- Vite dev server for this app: `http://localhost:5173`

## Setup so the agent can see & click the app

1. Open the t3-code UI in a browser: **http://127.0.0.1:3773**
2. Open its **Preview panel** (the built-in browser pane). This registers the
   automation host.
3. Tell the agent it's open. It then calls
   `preview_open` → `preview_navigate` to `localhost:5173` →
   `preview_snapshot` / `preview_click` / `preview_type` to drive the app.

Make sure the dev server is running first: `pnpm dev`.

## Fallbacks (no preview pane)

- **Headless**: `curl` + Node logic tests. Proves logic/serving, no visual
  render.
- **Playwright global browser**: `pnpm dlx playwright install chromium` plus a
  browser-automation skill. Heavier; only if you want browser driving without
  the t3-code pane.
