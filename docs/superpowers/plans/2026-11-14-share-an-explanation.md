# Share an explanation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Share button that makes a link holding the text and answer, and a read-only `/s` page that opens it.

**Architecture:**
- History's answer checks move into `src/lib/answerShape.js`, used by both History and sharing.
- `src/lib/share.js` encodes and decodes the link data, using the browser's own compression.
- `SharedPage` builds the answer from existing components. ExplainPage gets the Share button and its sheet.

**Tech Stack:** React 19, React Router 7, Vitest + Testing Library, CompressionStream.

**Spec:** `docs/superpowers/specs/2026-11-14-share-an-explanation-design.md`

## Global Constraints

- No server changes and no AI calls. Opening a link never writes History.
- The link format is `/s#d=` followed by `z<base64url deflate-raw JSON>` or `j<base64url JSON>`, with the payload `{ v: 1, text, result, level, language }`.
- Limits: decompressed data at most 200,000 bytes; text at most 3,000 characters; the "long link" note appears over 8,000 characters.
- Copy:
  - "Share";
  - the sheet text exactly as in the spec;
  - "Copy link" and the toast "Link copied";
  - "This link is long. Some chat apps cut long links.";
  - "Shared explanation · read only";
  - "This link is broken or cut short";
  - "Explain your own text".
- Style: no semicolons, single quotes, 2-space indent.

## Review Focus

1. **A link cut off part-way, or with characters changed.** Expect the broken-link message and no exception. Test in Task 2.
2. **A decompression bomb: tiny data that expands past 200 KB.** Expect it to be refused. Test in Task 2.
3. **A valid link whose result has an unexpected field shape (lines with `from: 0`, words without `meaning`).** Expect the broken-link message. Test in Task 2.
4. **Non-ASCII text (Arabic, emoji) and a `help` translation.** Expect it to arrive unchanged. Test in Task 2.
5. **Opening `/s` with no hash, or with a hash in the wrong form.** Expect the broken-link message. Test in Task 3.

---

### Task 1: Move the answer checks into `answerShape.js`

**Files:**
- Create: `src/lib/answerShape.js`
- Modify: `src/lib/historyStore.js` (import the checks; behaviour unchanged)

**Interfaces:**
- Produces:
  - `isResult(r) -> boolean`, moved as it is;
  - `isLevel(level) -> boolean`, with the same allowed values as History's `LEVELS`;
  - `isLanguage(code) -> boolean`, moved as it is;
  - `isFollowUp(f)`, moved.
- **Test:** the existing `historyStore.test.js` and `backup.test.js` pass unchanged.

- [ ] Move the checks, run `npx vitest run src/lib/historyStore.test.js src/lib/backup.test.js` and expect PASS.

### Task 2: Encode and decode

**Files:**
- Create: `src/lib/share.js`
- Test: `src/lib/share.test.js`

**Interfaces:**
- `encodeShare({ text, result, level, language }) -> Promise<string>` returns the data after `d=`.
- `decodeShare(data: string) -> Promise<{ text, result, level, language } | null>`.
- `shareUrl(data, origin = location.origin) -> string`, which is `${origin}/s#d=${data}`.
- `readShareHash(hash) -> string | null` returns the data from a `#d=…` hash.

- [ ] **Step 1: Write the failing tests**
  - A round trip returns the same object, including Arabic and emoji text and a `help` field.
  - Data starting with `z` is compressed, and its length is less than that of the plain JSON for a 2 KB answer.
  - Without `CompressionStream` (stubbed away), encoding gives `j…` and still round-trips.
  - Each of these gives null:
    - the data with its last 10 characters cut;
    - one character changed;
    - an unknown prefix;
    - `v: 2`;
    - `text` over 3,000 characters;
    - a result failing `isResult`;
    - an unknown language;
    - a `z` payload that expands past 200,000 bytes.
  - `readShareHash('#d=abc')` is `'abc'`; `readShareHash('')` and `readShareHash('#x=1')` are null.
- [ ] **Step 2:** Run `npx vitest run src/lib/share.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - base64url through `btoa`/`atob` on byte strings, in chunks.
  - Decompression reads the stream with a running byte count and stops past the cap.
  - Every failure, including thrown errors, returns null.
- [ ] **Step 4:** Run the tests. Expected: PASS.

### Task 3: The shared page

**Files:**
- Create: `src/pages/SharedPage.jsx`, test `src/pages/SharedPage.test.jsx`
- Modify: `src/App.jsx` (route `/s`), `src/styles/base.css`

**Interfaces:**
- Consumes `decodeShare` and `readShareHash`, plus `LineByLine`, `buildRows`, `ResultCard`, `HelpLine`, `WordChips`, `CheckYourself`, `listWords`, `saveWord`, `hasWord`, `flyStar`, `useToast` and `usePageTitle`.
- Behaviour:
  - While decoding, the page shows "Opening the shared explanation…".
  - With good data: the banner, then the answer parts, in the same order and with the same headings as the Explain page.
  - The example is folded under "Show the example".
  - Steps show only for errors.
  - A `Link` "Explain your own text" goes to `/`.
  - `<meta name="robots" content="noindex">`.
  - With bad data: an h1 "This link is broken or cut short", a line of help, and a link to `/`.

- [ ] **Step 1: Write the failing tests** (render at `/s` with a hash made by `encodeShare`):
  - It shows the banner, the explanation and the line-by-line plain sentence.
  - Saving a hard word puts it in `listWords()` without `source`, and History stays empty.
  - A word already saved shows as Saved, with a star in the text.
  - `/s` with no hash, and `/s#d=zzzz`, show "This link is broken or cut short".
  - The title is "Shared explanation · Plain-Language Explainer".
- [ ] **Step 2:** Run the tests and see them fail. **Step 3:** Implement. **Step 4:** Run them and see them pass.

### Task 4: The Share button and sheet

**Files:**
- Modify: `src/pages/ExplainPage.jsx`, `src/styles/base.css`, test `src/pages/ExplainPage.test.jsx`

**Behaviour:**
- **Share** (an outline button next to Copy) toggles a sheet under the results head with:
  - the sheet text;
  - a read-only `input` labelled "Link to this explanation", holding `shareUrl(...)`;
  - **Copy link**, which uses `navigator.clipboard.writeText`. It toasts "Link copied", or on failure selects the input and toasts "Could not copy. The link is selected."
- The long note shows when the URL is over 8,000 characters.
- A new answer closes the sheet.
- The sheet's data comes from `{ text: request.text, result, level: request.level, language: request.language }`. Follow-ups are left out.

- [ ] **Step 1: Write the failing tests:**
  - After an answer, Share shows the warning and a link starting with `http://localhost:3000/s#d=` (jsdom's origin).
  - Decoding that link's data gives back the answer's explanation.
  - Copy link writes that URL to the clipboard, and "Link copied" appears.
- [ ] **Step 2:** Run the tests and see them fail. **Step 3:** Implement. **Step 4:** Run `npm test` and expect all PASS; run `npm run build` and expect it to build.

### Task 5: Docs and browser check

- [ ] README "What it does" gains a **Share** sentence, and `docs/manual-checklist.md` gains a "Share an explanation" section, one line per copy item plus the broken-link check.
- [ ] **Browser check** (`vite preview`):
  - Share the npm example, open the link in a fresh tab with no saved data, and save a word there.
  - Phone and laptop, light and dark.
  - axe reports 0, and there is no sideways scroll.
