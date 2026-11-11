# Plain-Language Explainer

A web app for beginner developers who find technical English hard. Paste documentation or an error message and get it back in simple English: a short explanation, why it happens, what to try next, a practical example and the hard words. Save the hard words, then practise them with flashcards.

![The Explain screen showing a five-part answer](docs/screenshot.png)

**Live site:** https://plain-language-explainer.vercel.app

## What it does

- **Explain** – paste up to 3,000 characters. One AI call returns five parts. "What to try next" appears only for error messages. Copy the whole answer as plain text. "Not clear?" asks again for a simpler or a more detailed version (one more AI call each). If the free Groq limit is used up, the app says whether it is the per-minute or per-day limit and counts down until you can try again.
- **My Words** – the words you saved, with meaning, source sentence, learning level and topic (the AI picks one of: JavaScript, React, CSS, HTML, Node and npm, Git, Web and HTTP, General). See how many words are new, learning and known, filter by topic, search, delete, and export everything as a JSON file.
- **Practice** – flashcards from your saved words, up to ten per round, lowest level first. Space flips the card, `1` means "I forgot", `2` means "I knew it". Or switch to multiple choice (with 4 or more saved words): pick the right meaning of four, with keys `1` to `4`. A results screen lists the words to review.
- **History** – the last 20 explanations, newest first. Open one to read it again without a new AI call, delete one, or clear them all.
- **Dark mode** – follows your device's light or dark setting. The sun/moon button in the top bar switches it, and the choice is remembered in this browser.

No login, no database, no analytics. Saved words and History stay in your own browser (localStorage). Pasted text is sent to the AI to be explained; the app keeps it only in your browser's History, never on a server.

## Tech

- React with Vite, React Router
- Plain CSS with CSS variables
- One Vercel serverless function, `/api/explain`, that holds the Groq API key and checks the AI's answer
- Groq API on the Free plan, called with `fetch`
- Vitest and Testing Library

## Run it locally

```bash
npm install
cp .env.example .env.local   # then fill in GROQ_API_KEY and GROQ_MODEL
npx vercel dev               # serves the app and /api/explain on http://localhost:3000
```

`npm run dev` starts only the front end, so the Explain button will not work there. Get a free key at [console.groq.com](https://console.groq.com) and choose a model from the Free plan. Never put the key in `src/` or commit `.env.local`.

## Run the tests

```bash
npm test
```

The manual release checks are in [`docs/manual-checklist.md`](docs/manual-checklist.md).

## Project layout

- `src/` – the React app. `src/lib/wordStore.js` (saved words) and `src/lib/historyStore.js` (past explanations) are the only files that touch localStorage. `shared/topics.js` holds the topic list used by both the app and the server.
- `api/explain.js` – thin Vercel adapter. `api/_lib/handleExplain.js` holds the request logic; `api/_lib/aiProvider.js` is the only file that knows about Groq.

## Ideas for version 2

Login and accounts, follow-up questions, more practice modes, your own labels on words, practising one topic at a time, other languages.
