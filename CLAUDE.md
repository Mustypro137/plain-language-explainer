# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Plain-Language Explainer: a React + Vite app for beginner developers who find technical English hard. Users paste docs or error messages; Groq returns a simple-English answer (line by line, hard words, follow-ups), and they save and practise the hard words. Live at https://plain-language-explainer.vercel.app. No login, no database, no analytics.

## Commands

```bash
npm test                                   # vitest run (jsdom, globals, src/test-setup.js)
npx vitest run src/lib/practice.test.js    # one file
npx vitest run -t "welcome chip"           # tests whose name matches
npm run build                              # vite build
npx vercel dev                             # app + /api on http://localhost:3000 (needs .env.local)
```

- `npm run dev` / `npm run preview` serve only the front end, so Explain and Ask fail there. Use `vercel dev` for anything that touches the API.
- `.env.local` needs `GROQ_API_KEY` and `GROQ_MODEL` (see `.env.example`). Never put the key under `src/`.
- There is no linter or formatter. Match the existing style: no semicolons, single quotes, 2-space indent.

## Architecture

**Three code roots:**
- `src/`: the browser app.
- `api/`: Vercel functions.
- `shared/`: code imported by both. Anything that must agree between the prompt and the UI goes in `shared/`:
  - `segments.js`: how text is split into numbered parts for line by line;
  - `topics.js`: the 8 topics;
  - `languages.js`: the "Help in my language" list. Adding a language there enables it in both the menu and the server validation.

**Server (`api/`)**
- `api/explain.js` and `api/ask.js` are thin `fetch` adapters. They call `handleExplain(body, askAi)` / `handleAsk(body, askFollowUp)` in `api/_lib/`, which return `{status, body}`. The AI function is injected, so the handlers are tested without network access.
- `api/_lib/validate.js` checks both directions:
  - the request: text up to 3,000 chars, level, language;
  - the AI's JSON answer: `parseAiAnswer`, `parseFollowUp`. A malformed answer counts as a failure.
- `api/_lib/runAi.js` tries twice, then returns 502 `ai_failed`. It does not retry a 429: that is passed straight through as `{error:'busy', ...}` with a wait time.
- `api/_lib/aiProvider.js` is the only file that knows about Groq. It holds the prompts (`buildMessages`, `buildFollowUpMessages`) and parses the rate limit (`readRateLimit`). Prompt rules live here, e.g. no hard words taken only from stack-trace `at …` lines.
- The AI returns `lines: [{n, to?, plain, plain_help?}]`, which are stored as `{from, to, plain, help?}`.

**Client (`src/`)**
- Routes in `src/App.jsx`: `/` ExplainPage, `/words`, `/practice` (`?topic=`), `/history`, and a 404 page.
- `src/lib/explainText.js` is the API client. It tells the firewall's bare 429 apart from Groq's own limit; the UI shows a countdown for both.
- **localStorage is touched only by the store modules**:
  - `wordStore.js`: `ple.words.v1`;
  - `historyStore.js`: `ple.history.v1`, 50 entries; re-explaining the same text/level/language reuses the entry without an AI call;
  - `activityStore.js`: `ple.practice-days.v1`;
  - `languageStore.js` and `theme.js`.

  Keep it that way. Bump the key version and handle migration if a stored shape changes. `backup.js` handles export/import and merges only new items.
- `src/lib/practice.js` owns spaced repetition (intervals 1, 3, 7, 16, 35 days) and `isFading`. A word fades only if it has a `due` date that has passed. A never-practised word is "new", not fading.
- `src/lib/sky.js` + `WordSky.jsx` draw My Words as constellations, one per topic, using the `--topic-0..7` colours.
- Styling is plain CSS:
  - `src/styles/tokens.css` holds the design tokens, light and dark;
  - `src/styles/base.css` holds everything else;
  - practice focus mode is `body[data-focus='practice']`.

## Gotchas

- **CSP hash:** `vercel.json` sets a Content-Security-Policy that allows the one inline script in `index.html` by its sha256.
  - If you change that script, recompute the hash over the **LF** text (browsers normalise CRLF) and update `vercel.json`.
  - `shared/vercelConfig.test.js` fails until they match.
- The `/api/` rate limit (10 requests / 60 s per IP) is a Vercel Firewall rule set in the dashboard, not in this repo.
- `docs/manual-checklist.md` holds the manual release checks. When behaviour changes, update it and the README's "What it does" section.

## Workflow conventions

- Work on a branch, commit and push only when asked, and merge into `main` with `git merge --no-ff -m "Merge branch '<name>': <summary>"`. Pushing `main` deploys to production on Vercel.
