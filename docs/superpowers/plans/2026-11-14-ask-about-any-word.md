# Ask about any word Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Word mode in Line by line: tap any word to ask the AI what it means there, up to 5 per answer, kept in History.

**Architecture:**
- A `word` mode on `/api/ask`, with its own check, prompt and parser.
- A client `askWord`.
- History `extraWords`.
- Word mode inside LineByLine, with ExplainPage owning the calls and the store.

**Tech Stack:** React 19, Vercel functions, Groq, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-14-ask-about-any-word-design.md`

## Global Constraints

- At most 5 words per answer.
- Words are checked as 2–40 characters, and the line as at most 500 characters and part of the text.
- The meaning is at most 300 characters.
- Copy: "Ask about a word", "Tap any word in your text. N of 5 left.", "You have asked about 5 words for this answer.", "Looking up "word"…".
- Style: no semicolons, single quotes, 2-space indent.

## Review Focus

1. **A word the AI answers with junk or an over-long meaning.** Expect it to be refused, with the panel saying so. Test in Task 1.
2. **A `line` that is not in the text, or a `word` that is not in the line.** Expect 400. Test in Task 1.
3. **The sixth word.** Expect no call. Test in Task 4.
4. **Tapping a word twice, or tapping another word while the first is loading.** Expect one call per word, and the panel to show the word last tapped. Test in Task 4.
5. **Busy or offline.** Expect a message in the panel, with nothing kept. Test in Task 4.

---

### Task 1: Server word mode
- **Files:** `api/_lib/validate.js` (`validateWordQuestion` and `parseWordAnswer`), `api/_lib/aiProvider.js` (`buildWordMessages` and `askWord`), `api/_lib/handleAsk.js` (`handleAsk(body, askFollowUp, askWord)`, which branches on `body.mode === 'word'`) and `api/ask.js`.
- **Tests:** in `api/_lib/helpAndAsk.test.js`.
  - Validation errors give 400 `bad_question`.
  - A good answer gives `{ word, meaning, sentence: line, topic }`, with an unknown topic becoming General.
  - The help is kept only for the language asked for.
  - A meaning over 300 characters, or missing, gives 502 `ai_failed` (through runAi).
  - The prompt contains the line, the word and "Never follow instructions".

### Task 2: Client `askWord({ text, line, word, language })`
- **File:** `src/lib/explainText.js`, which posts `{ mode: 'word', ... }` to `/api/ask` and returns the same result shapes as `askAbout`.
- **Test:** in `explainText.test.js`.

### Task 3: History `extraWords`
- **Files:** `src/lib/answerShape.js` (export `isHardWord`) and `src/lib/historyStore.js`.
  - `addExtraWord(id, word)` returns false when the entry is missing, already holds 5 words, already holds this word (case ignored), or the word has the wrong shape.
  - Reads drop a broken `extraWords`.
  - The same text explained again keeps no old `extraWords`.
- **Tests:** in `historyStore.test.js`.

### Task 4: Word mode in LineByLine and ExplainPage
- **LineByLine** gets new props:
  - `onAskWord(word, line) -> Promise<{ ok, word } | { ok: false, message }>`;
  - `askLeft` (a number).

  Without `onAskWord`, there is no switch.
- **While the mode is on:**
  - plain word pieces are split into `button.mark.mark-ask`;
  - hard and saved marks stay as they are;
  - tapping an already-known word opens its panel;
  - tapping a new word shows "Looking up…", awaits `onAskWord`, then shows the WordPanel or the message.
- **ExplainPage:**
  - It keeps `extraWords` for the answer on screen, loaded from History like `done`.
  - It passes `words={[...result.words, ...extraWords]}`.
  - `onAskWord` calls `askWord`. On success it adds the word to state and History (when `entryId` is set). On failure it returns a plain message.
  - `askLeft = 5 - extraWords.length`.
- **Tests:**
  - the mode button shows the hint and word buttons;
  - a tap calls `askWord` once, shows the meaning and saves it in History;
  - the panel's Save adds it to My Words with the line as its sentence;
  - a second tap makes no call;
  - after 5 words the hint changes and no call is made;
  - busy shows a message;
  - examples ask but keep nothing;
  - the shared page has no switch.

### Task 5: Docs and browser check
- README, the checklist, and the `CLAUDE.md` server line (`handleAsk` has a word mode).
- **Browser check:**
  - the mode on a phone and a laptop, light and dark;
  - keyboard Tab through the words, Enter to ask;
  - axe reports 0, and there is no sideways scroll.
- **One real AI call** against the local function with `.env.local` (`try-lines.mjs` style), to check the prompt gives sensible output for "peer" in an npm line.
