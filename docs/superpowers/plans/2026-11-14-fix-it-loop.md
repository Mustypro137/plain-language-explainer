# Fix-it loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tick boxes, "Still broken?" and "It works now" on error answers, with a "what changed" strip, all kept in History.

**Architecture:**
- A pure `compareErrors` in `src/lib/compareErrors.js`.
- History store functions for `done`, `after` and `solved`.
- A `FixIt` component that replaces the plain steps list on the Explain page.
- The History page shows "Try N" and "Solved".

**Tech Stack:** React 19, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-14-fix-it-loop-design.md`

## Global Constraints

- No AI calls and no server changes.
- localStorage is touched only through historyStore.
- The copy is exactly as in the spec.
- Style: no semicolons, single quotes, 2-space indent.

## Review Focus

1. **"Still broken?" and then the same text pasted again.** Expect no self-link. Test in Task 2.
2. **"Still broken?" and then an example, or an explanation that fails.** Expect the pending link to be dropped or kept sensibly, and never attached to the wrong entry. Test in Task 3.
3. **A previous try that was deleted from History.** Expect no strip and no crash. Test in Task 3.
4. **Texts with no error lines (a docs paragraph).** Expect no strip. Test in Task 1.
5. **A broken `done`, `after` or `solved` in storage.** Expect the field to be dropped and the entry kept. Test in Task 2.

---

### Task 1: `compareErrors(oldText, newText) -> { gone: string[], added: string[] } | null`
- **File:** `src/lib/compareErrors.js`. **Test:** `src/lib/compareErrors.test.js`.
- It returns null when neither text has an error line. Lines are compared after normalising; the original line is returned for display.
- **Tests:**
  - an ERESOLVE text followed by an EACCES text gives `gone: ['npm ERR! code ERESOLVE']` and `added: ['npm ERR! code EACCES']`;
  - the same error at a different line number gives `{ gone: [], added: [] }`;
  - two docs paragraphs give null;
  - a TypeError followed by a ReferenceError;
  - at most 5 lines per side.

### Task 2: History store
- **Files:** `src/lib/historyStore.js`, plus its test.
- **What it adds:**
  - `setDone(id, indices: number[]) -> boolean`, unique, sorted non-negative integers;
  - `setSolved(id) -> boolean`;
  - `addHistory({ ..., after })`, which keeps `after` only when it is another entry's id (not its own, not missing);
  - `chainLength(entry, items) -> number`, following `after`, at most 20 steps, ignoring missing ids and loops.
- Reads drop a bad `done`, `after` or `solved`, like `withoutBadCheck`. A text explained again keeps no old `done` or `solved`.
- **Tests:** one for each of the above, including the self-link, a loop and broken values.

### Task 3: `FixIt` on the Explain page
- **Files:** `src/components/FixIt.jsx` and `src/pages/ExplainPage.jsx`, with their tests.
- **FixIt props:** `{ steps, done, onToggle, canTrack, solved, onStillBroken, onSolved }`.
  - It renders a checkbox list in which each step is a `<label>` holding a checkbox and the text.
  - When `canTrack` is true, it adds the two buttons. When `solved` is true, the solved note replaces them.
- **ExplainPage:**
  - It keeps `done` and `solved` for the entry on screen, and `pendingAfter` (an id or null).
  - "Still broken?" sets `pendingAfter = entryId`, empties and focuses the box, and shows the note.
  - The next successful AI answer or kept answer for a different text stores `after: pendingAfter`. An example or an error answer leaves it pending. An identical text clears it.
  - The answer shows a `ChangedStrip` (inside FixIt's file, or its own small component) from `compareErrors(previous.text, request.text)` when the entry has `after` and the previous entry still exists.
- **Tests:**
  - ticking saves `done`, and reopening the entry shows the ticks;
  - "Still broken?" then a new error gives `after` and the strip with Gone and New;
  - the same text gives no link;
  - "It works now" saves `solved` and shows the note;
  - examples show ticks but neither button;
  - with the previous entry deleted, there is no strip.

### Task 4: History, docs and browser check
- **HistoryPage:** `details()` adds "Try N" when `chainLength ≥ 2`, and "Solved". **Test:** in `HistoryPage.test.jsx`.
- README "What it does" gets one sentence, and the checklist gets a "Fix-it loop" section.
- **Browser check:**
  - on a phone and a laptop, in light and dark, the tick boxes work with keyboard and touch;
  - the strip shows;
  - axe reports 0, and there is no sideways scroll.
