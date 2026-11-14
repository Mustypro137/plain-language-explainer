# Plain-Language Explainer

A web app for beginner developers who find technical English hard. Paste documentation or an error message and get it back in simple English: a short explanation, why it happens, what to try next, a practical example and the hard words. Save the hard words, then practise them with flashcards.

![The Explain screen showing a five-part answer](docs/screenshot.png)

**Live site:** https://plain-language-explainer.vercel.app

## What it does

- **Explain** – paste up to 3,000 characters and press Explain (or `Ctrl`/`⌘` + `Enter`). One AI call returns five parts, plus **line by line**: your text split into numbered parts (each line; long prose by sentence), each beside one plain-English sentence, with the "at …" lines of a stack trace explained together. Hard words are dotted in your text; tap one for its meaning. **Ask about a word** turns every word of your text into a button: tap one and the AI says what it means in that line (up to five words per answer, one AI call each, separate from the three questions; kept with the answer in History, and saved words use the line as their example). "What to try next" appears only for error messages, as tick boxes: tick what you tried. **Still broken?** links the next message to this try, and its answer opens with what changed (the error lines that went away and the new ones, worked out in the browser, no AI call); **It works now** marks it solved and keeps the ticked steps. History shows "Try 2" and "Solved". The hard words are up to five terms worth learning, never file names or names from your own code. Under the box a first guess says what was pasted ("Looks like an npm error · 6 lines", worked out in the browser, no AI call). Before the first answer, the right side shows one real line made plain and what else comes with it, plus the visitor's sky when they have saved words; a returning visitor with fading words gets a "Welcome back" link to review them, and three examples (a React error, an npm error, a docs paragraph) show a full answer written in advance, with no AI call. On a phone, the page scrolls to the answer when it arrives and focus moves to it. The hard words are marked in your own text: tap one to see its meaning, hear it, and save it. If you explain the same text at the same level again, the answer comes from History without a new AI call ("Ask the AI again" gets a fresh one). Copy the whole answer as plain text, or **Share** it: the link holds your text and the answer (compressed, after the `#`, so nothing is stored on a server), and whoever opens it sees the answer read only, can save its hard words into their own sky and can check themselves. The share sheet warns that the link contains your text. A broken or cut-off link says so instead of showing anything. **Check yourself** under an answer asks three questions made from that answer (which plain sentence matches a line, what a hard word means), with no AI call; the result names a line worth reading again and scrolls to it. Words you have already saved get a small gold star where they appear in your text, with "You know 3 words here" above the table; tap one for your saved meaning and when you saved it. Neither changes when a word comes back for review. A **Reading level** slider (Simpler · Normal · More detail) asks again at another level (one more AI call each). **Help in my language** (20 languages, remembered in this browser) adds a translation of the explanation, the "why" and each word's meaning in smaller text under the English, in the same AI call. **Ask about this** takes up to three questions about an answer (one AI call each); the answers are kept with the explanation in History. If the free Groq limit is used up, the app says whether it is the per-minute or per-day limit and counts down until you can try again.
- **My Words** – the words you saved, with meaning, source sentence, learning level and topic (the AI picks one of: JavaScript, React, CSS, HTML, Node and npm, Git, Web and HTTP, General). See how many words are new, learning and known, filter by topic, search, delete (with Undo), and hear each word read aloud (the browser's own speech). **Add a word** by hand, and **Edit** a word's meaning, topic and your own note in place. A word saved from an explanation links back to it while History still has it. With a topic chosen, the Practise button practises only that topic. A **List | Sky** switch shows the words as a sky instead: one constellation per topic, a star per word, bigger and fuller the better you know it, with a dashed ring when it is fading (practised before and due for review again; a word never practised shows as new, not fading); tap a star for the word's panel (meaning, translation, how bright, next review, note, Edit, the explanation it came from). Saving a word sends a small star flying to My Words in the top bar, which shows how many words are saved. Each word says when it comes back for review. A streak card shows how many days in a row you finished a practice round, with the last seven days. **Export** saves your words and History as one backup file; **Import** reads it back in another browser, adding only what is new (it also reads the old words-only export).
- **Practice** – a round holds the words due today, up to ten, lowest level first. Each "I knew it" in a row brings a word back later (1, 3, 7, 16, then 35 days); "I forgot" brings it back today. The Practice link shows how many words are due. With nothing due, the page says when the next review is and offers "Practise anyway". Flashcards from your saved words: Space flips the card, `1` means "I forgot", `2` means "I knew it". Or switch to multiple choice (with 4 or more saved words): pick the right meaning of four, with keys `1` to `4`. Or **Fill the blank**: the saved sentence with the word hidden and its meaning as the clue; type the word. `/practice?topic=React` practises every React word, due or not. During a round the top bar goes away (focus mode, with a close button), progress is a row of stars, gold for a word you knew and dashed for one that comes back today, and a line after each answer says when the word comes back. A results screen lists the words to review.
- **History** – the last 50 explanations, newest first, grouped by day (Today, Yesterday, then the date), each with its level, language, questions asked, words saved and the last Check yourself score ("Checked 2 of 3"), and a search box. Open one to read it again without a new AI call, delete one, or clear them all. Each delete can be undone from the message at the bottom of the screen.
- **Motion** – small and purposeful, all in CSS with no animation library. On a new answer, each plain sentence arrives from its line; toasts rise from the bottom and leave the same way; the share sheet grows from its button; each Check yourself question visibly arrives and the result lights up one star per question; folds open smoothly where the browser supports it; chips and dotted words give a small press. With "reduce motion" on, nothing moves or staggers: entrances become short fades.
- **Dark mode** – follows your device's light or dark setting. The sun/moon button in the top bar switches it, and the choice is remembered in this browser.

No login, no database, no analytics. Saved words and History stay in your own browser (localStorage). Pasted text is sent to the AI to be explained; the app keeps it only in your browser's History, never on a server.

## Tech

- React with Vite, React Router
- Plain CSS with CSS variables
- Two Vercel serverless functions, `/api/explain` and `/api/ask` (follow-up questions), that hold the Groq API key and check the AI's answer
- Groq API on the Free plan, called with `fetch`
- A Vercel Firewall rate-limit rule on `/api/`, so one visitor cannot use up the shared free AI limit (set up in the dashboard, see below)
- Vitest and Testing Library
- Security and cache headers in `vercel.json`: a Content-Security-Policy (only this site, Google Fonts, and the one inline script in `index.html`, allowed by its hash), and a one-year cache for the built files in `/assets/`. If you change that inline script, put its new hash in `vercel.json`; `shared/vercelConfig.test.js` fails until you do.

## The firewall rule for `/api/`

The free Groq limit is shared by every visitor, so the project has one Vercel Firewall rule. It lives in the Vercel dashboard, not in this repo:

1. Vercel dashboard → this project → **Firewall** → **Configure** → **New Rule**.
2. Name: `Limit explain requests`.
3. **If**: `Request Path` · `Starts with` · `/api/` (this covers both `/api/explain` and `/api/ask`).
4. **Then**: **Rate Limit**, fixed window, **60 seconds**, **10 requests**, counted by **IP Address**. Action: **Too Many Requests (429)**.
5. Save, then **Review Changes** → **Publish**.

When a visitor goes over it, the firewall answers 429 without the app's JSON body. `src/lib/explainText.js` tells that apart from the AI's own limit and the Explain page shows "You have asked many times in a short time" with a countdown (from `Retry-After` when sent, otherwise one minute). The three-question limit of "Ask about this" is kept by the app, not the server; the firewall rule is the server-side limit.

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

- `src/` – the React app. `src/lib/wordStore.js` (saved words), `src/lib/historyStore.js` (past explanations), `src/lib/activityStore.js` (practice days), `src/lib/languageStore.js` and `src/lib/theme.js` are the only files that touch localStorage. `shared/topics.js` holds the topic list used by both the app and the server.
- `api/explain.js` and `api/ask.js` – thin Vercel adapters. `api/_lib/handleExplain.js` and `api/_lib/handleAsk.js` hold the request logic, `api/_lib/runAi.js` the retry and rate-limit handling, and `api/_lib/aiProvider.js` is the only file that knows about Groq.
- `shared/segments.js` – how a text is split into numbered parts for line by line, used by both the server (the AI prompt) and the app (the table).
- `shared/languages.js` – the languages for "Help in my language". Add one there (code, English name, label) and both the menu and the server accept it.

## Ideas for later

Login and accounts, so words follow you between devices without a backup file; your own labels on words.
