# Check yourself + Stars in your text Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a three-question "Check yourself" at the end of an answer, and mark the visitor's saved words with a star in the line-by-line text. Both work in the browser, with no AI calls.

**Architecture:**
- The questions are built by one pure function from the rows line by line already computes (`buildRows`) and the answer's hard words.
- Practice's multiple-choice list is pulled out into a shared `ChoiceList` so both screens use the same buttons and keys.
- Stars reuse `markWords`. The score is saved on the History entry.

**Tech Stack:** React 19, Vitest + Testing Library, plain CSS.

**Spec:** `docs/superpowers/specs/2026-11-14-check-yourself-and-stars-design.md`

## Global Constraints

- No AI calls and no new routes.
- localStorage is touched only through `historyStore.js` and `wordStore.js`.
- Seeing a word, or answering a check question, never changes a word's `box`, `interval` or `due`.
- Copy:
  - start button "Check yourself · 3 questions" (the number is the real count);
  - result "N of 3";
  - "Read line 04 again";
  - "You know N words here" / "You know 1 word here";
  - "You saved this N days ago" (also "today" and "yesterday");
  - History detail "Checked N of 3".
- Style: no semicolons, single quotes, 2-space indent.
- Motion runs only inside `@media (prefers-reduced-motion: no-preference)`.

## Review Focus

1. **Old History entries with no `lines` and fewer than 3 words.** Expect no check button and no error. Test in Task 1.
2. **Two rows with the same plain sentence.** Expect a question never to show two identical choices. Test in Task 1.
3. **Saved words with regex characters (`c++`, `node.js`) or different letter case.** Expect them to be marked once, and never as part of a longer word. Test in Task 4.
4. **A saved word that is also one of this answer's hard words.** Expect a single mark, the hard-word dotted style plus the star, and not two buttons. Test in Task 4.
5. **Pressing `1`–`3` while typing in the follow-up box or the main text box.** Expect it not to answer a question. Test in Task 2.

---

### Task 1: Question builder

**Files:**
- Create: `src/lib/checkQuestions.js`
- Test: `src/lib/checkQuestions.test.js`

**Interfaces:**
- Consumes: rows shaped like `buildRows` output, `{ from, to, text, plain }`, where `plain` may be null; and hard words `{ word, meaning }`.
- Produces: `buildCheck(rows, words, random = Math.random) -> Question[]`, where `Question = { kind: 'line' | 'word', prompt: string, line: number | null, choices: { text: string, correct: boolean }[] }`. `line` is the row's `from` for line questions and null for word questions.

- [ ] **Step 1: Write the failing tests**
  - `buildCheck(rowsWith(2 plain), words(2))` → `[]`.
  - Three plain rows and no words → 3 questions, all `kind: 'line'`, each with 3 choices, exactly one correct, and the correct text equal to that row's `plain`.
  - Three words and no plain rows → 3 `word` questions. The prompt is the word, the correct choice is its meaning.
  - Three or more of both → kinds alternate `['line', 'word', 'line']`.
  - Rows whose `plain` is null are never used.
  - Two rows with an identical `plain` → no question has two choices with the same text.
  - With `random = () => 0`, the output is deterministic. The order of the choices comes from `random`, so the correct one is not always first: for a fixed seed, assert that its index differs between two questions.
  - Every question differs: no row or word is asked twice.

- [ ] **Step 2: Run the tests and see them fail**
  Run: `npx vitest run src/lib/checkQuestions.test.js`. Expected: FAIL, the module is not found.

- [ ] **Step 3: Implement `buildCheck`**
  - Usable rows have a non-empty `plain`, de-duplicated by `plain`. Usable words have a non-empty `meaning`, de-duplicated by meaning.
  - A line question needs at least 3 usable rows, and a word question at least 3 usable words.
  - Take items in order (line first), alternating while both kinds have unused items, up to 3.
  - Distractors are 2 other items of the same kind, picked with `random`. Shuffle the 3 choices with `random`.

- [ ] **Step 4: Run the tests and see them pass.** Same command. Expected: PASS.

- [ ] **Step 5: Commit** `feat: build check-yourself questions from an answer`

### Task 2: Shared choice list

**Files:**
- Create: `src/components/ChoiceList.jsx`
- Modify: `src/components/ChoiceQuestion.jsx` (use ChoiceList; behaviour unchanged)
- Test: `src/components/ChoiceList.test.jsx`, plus the existing `src/pages/PracticePage.test.jsx`, which must still pass untouched.

**Interfaces:**
- Produces: `<ChoiceList choices={[{ text, correct }]} picked={number | null} onPick={(i) => void} label="Choices" />`.
  - It renders the `ol.choice-list` with `kbd` numbers, the `choice-correct` / `choice-wrong` / `choice-other` states and the "Correct" / "Not this one" tags exactly as ChoiceQuestion does today.
  - Keys `1..n` call `onPick` while `picked === null`. They are ignored when focus is in an input, textarea, select or contenteditable, and when Ctrl, Meta or Alt is held.
- ChoiceQuestion keeps its props, `onAnswer`, its status text and its Enter-for-Next. It maps `choices[i].meaning` to `text`.

- [ ] **Step 1: Write the failing tests**
  - Clicking choice 2 calls `onPick(1)`.
  - Pressing `2` on the document calls `onPick(1)`.
  - Pressing `2` while a `<textarea>` in the same render has focus does not call `onPick`.
  - With `picked={0}` and choice 0 wrong: choice 0 has the "Not this one" tag and the correct one has the "Correct" tag.
- [ ] **Step 2: Run** `npx vitest run src/components/ChoiceList.test.jsx`. Expected: FAIL.
- [ ] **Step 3: Implement ChoiceList and move ChoiceQuestion onto it.**
- [ ] **Step 4: Run** `npx vitest run src/components/ChoiceList.test.jsx src/pages/PracticePage.test.jsx`. Expected: all PASS.
- [ ] **Step 5: Commit** `refactor: share the multiple-choice list between Practice and the answer check`

### Task 3: Save the score in History

**Files:**
- Modify: `src/lib/historyStore.js` (add `setCheck`; accept an optional `check` in `isItem`)
- Modify: `src/pages/HistoryPage.jsx` (`details()` adds "Checked N of M")
- Test: `src/lib/historyStore.test.js`, `src/pages/HistoryPage.test.jsx`

**Interfaces:**
- Produces: `setCheck(id: string, { right: number, total: number }) -> boolean`.
  - It returns false when the entry is gone, or when the values are not integers with `0 <= right <= total`, `total >= 1`.
  - It overwrites any earlier score.
- `isItem` accepts `check === undefined` or a valid `{ right, total }`. An invalid `check` drops only the `check` field; the entry is kept.
- `addHistory` for a text explained again keeps no old `check` (a new answer needs a new check).

- [ ] **Step 1: Write the failing tests**
  - After `setCheck(id, { right: 2, total: 3 })`, `getHistoryItem(id).check` deep-equals `{ right: 2, total: 3 }`.
  - `setCheck('missing', …)` returns false.
  - `{ right: 4, total: 3 }` returns false.
  - An entry stored with `check: 'x'` is still listed and has no `check`.
  - In History, an entry with `check: { right: 2, total: 3 }` shows "Checked 2 of 3" in its detail line.
- [ ] **Step 2: Run** `npx vitest run src/lib/historyStore.test.js src/pages/HistoryPage.test.jsx`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the same command.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: keep the check-yourself score with the History entry`

### Task 4: Stars in your text

**Files:**
- Modify: `src/lib/markWords.js` (add `wordsIn`)
- Modify: `src/components/LineByLine.jsx` (new `known` prop: star marks and the count line)
- Modify: `src/components/WordPanel.jsx` (optional `note` line)
- Modify: `src/pages/ExplainPage.jsx`:
  - keep `myWords` state from `listWords()`, refreshed when `save` runs;
  - pass `known={myWords}`.
- Modify: `src/styles/base.css` (`.mark-known`, `.mark-star`, `.known-count`, a twinkle keyframe for reduced-motion users only)
- Test: `src/lib/markWords.test.js`, `src/components/lineByLine.test.jsx`

**Interfaces:**
- Produces: `wordsIn(text: string, words: {word}[]) -> {word}[]`. It returns the distinct words that `markWords` would mark in `text`, in the order they are first found.
- LineByLine:
  - Props: `known` (saved words `{ word, meaning, help?, savedAt }`, default `[]`).
  - A row piece whose word is a saved word that isn't a hard word renders as `button.mark.mark-known`, holding the word, a `span.mark-star` (aria-hidden) and a visually hidden ", saved".
  - A hard word that is saved also gets the star.
  - Tapping a saved word opens `WordPanel` with that saved word and `note` = "You saved this N days ago" (using `daysBetween(dayKey(new Date(savedAt)), dayKey())`; 0 is "today", 1 is "yesterday").
  - The count line is `p.known-count`, "You know N words here", where N is `wordsIn(text, known).length`. It is shown only when N > 0.
- WordPanel: optional `note` string rendered as `p.soft` under the meaning.

- [ ] **Step 1: Write the failing tests**
  - `wordsIn('Use node.js and C++ in nodejs', [{ word: 'node.js' }, { word: 'c++' }, { word: 'js' }])` returns `node.js` and `c++` only. "js" inside "nodejs" or "node.js" is not counted on its own, because the longer match wins.
  - Rendering LineByLine with `known=[{ word: 'callback', … savedAt: <9 days ago> }]` and text containing "Callback" shows a button named /callback, saved/ and "You know 1 word here".
  - A saved word that is also a hard word renders a single button, which has the star.
  - Clicking the saved word shows "You saved this 9 days ago".
  - With `known=[]`, there is no `.known-count`.
- [ ] **Step 2: Run** `npx vitest run src/lib/markWords.test.js src/components/lineByLine.test.jsx`. Expected: FAIL.
- [ ] **Step 3: Implement.** Mark with `markWords(row.text, [...words, ...savedOnly])`, where `savedOnly` is `known` minus the hard words, compared by trimmed lower case. Tag pieces by looking the matched word up in a `Set` of saved keys.
- [ ] **Step 4: Run the same command, then `npm test`.** Expected: all PASS.
- [ ] **Step 5: Commit** `feat: mark saved words with a star in the line-by-line text`

### Task 5: Check yourself on the answer

**Files:**
- Create: `src/components/CheckYourself.jsx`
- Modify: `src/components/LineByLine.jsx` (each `li.line-row` gets `data-line={row.from}`)
- Modify: `src/pages/ExplainPage.jsx`:
  - render `<CheckYourself>` after the hard-words card and before `FollowUp`;
  - give it the same `key` as `FollowUp`;
  - save the score with `setCheck(entryId, score)` when `entryId` is set.
- Modify: `src/styles/base.css` (`.check-card`, `.line-row-flash` with a 1.2 s indigo background fade)
- Test: `src/components/checkYourself.test.jsx`, `src/pages/ExplainPage.test.jsx`

**Interfaces:**
- Consumes: `buildCheck` (Task 1), `ChoiceList` (Task 2), `setCheck` (Task 3), and `buildRows` plus `segmentText` for the rows.
- Produces: `<CheckYourself rows={Row[]} words={Word[]} onDone={({ right, total }) => void} random={fn?} />`.
  - It renders nothing when `buildCheck` returns `[]`.
  - Before starting: `button` "Check yourself · N questions".
  - During: "Question i of N" and the prompt. For a line question: the original line in `code` and "Which sentence says what this line means?". For a word question: the word and "Which meaning is right?". Then the ChoiceList, a `role="status"` line, and "Next" or, after the last question, "See the result".
  - Result: "R of N"; then for the first missed line question, a button "Read line 04 again" that scrolls `[data-line="4"]` into view and adds `line-row-flash` for 1.2 s; then "Check again", which restarts with new choices.
  - `onDone` is called once per finished round.
  - A right line answer also flashes its row.

- [ ] **Step 1: Write the failing tests**
  - With 3 plain rows, the start button reads "Check yourself · 3 questions".
  - Answering all correctly (`random = () => 0`, find the correct choice by its text) ends in "3 of 3", and `onDone` is called with `{ right: 3, total: 3 }`.
  - Answering question 1 wrong shows "Read line 01 again".
  - With 2 rows and 1 word, nothing renders.
  - In ExplainPage, after loading the React sample (no AI call), the check button exists and `explainText` was not called.
  - In ExplainPage, finishing a check on an opened History entry stores `check` on that entry.
- [ ] **Step 2: Run** `npx vitest run src/components/checkYourself.test.jsx src/pages/ExplainPage.test.jsx`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** `npm test`. Expected: all PASS. Then run `npm run build`; expected: built.
- [ ] **Step 5: Commit** `feat: check yourself - three questions at the end of an answer`

### Task 6: Docs and browser check

**Files:**
- Modify: `README.md`, "What it does":
  - **Explain:** one sentence on Check yourself and one on stars.
  - **History:** the "Checked N of 3" detail.
- Modify: `docs/manual-checklist.md`: a new section, "Check yourself and stars", with one check per Global Constraints copy line, plus the reduced-motion check.

- [ ] **Step 1: Write the docs.**
- [ ] **Step 2: Browser check.** Run `npm run build` and `npx vite preview --port 4173`.
  - At 390×844 and 1366×768, light and dark: the React sample shows the check button, and the three questions can be answered with the mouse and with keys `1`–`3`. "Read line … again" scrolls to and flashes the row.
  - With 2 saved words that appear in the sample, the stars and "You know 2 words here" show.
  - No sideways scroll, and axe reports 0 violations.
- [ ] **Step 3: Commit** `docs: check yourself and stars in your text`
