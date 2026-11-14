# Fix-it loop (design)

This is idea E1 from the PROMPT 03 list. The user approved it on 2026-11-14 ("E1, E2, then Visual Explainer").

## Why

An error is rarely fixed in one try. Today, the next error is explained as if it had nothing to do with the last one, and nothing records what was tried or what fixed it.

## Goals

- Error answers have tick boxes on "What to try next", kept with the History entry.
- **"Still broken? Paste the new message"** links the next explanation to this one. That answer opens with a "What changed since the last try" strip, which the app works out itself (no AI call).
- **"It works now"** marks the entry as solved and keeps the ticked steps as what fixed it.
- History shows "Try 2" and "Solved".

## Non-goals

- No AI comparison of the two errors (left for later).
- No extra AI calls.
- Nothing for documentation answers.

## Anti-goals

- Ticks must never change the answer.
- A sample answer must never write History.
- A chain must never link an entry to itself.

## Approaches

1. **Compare the error lines in the browser.** Chosen: free, instant, and enough to name codes like ERESOLVE and EACCES.
2. Send the previous error to the AI with the new one. It reads better, but every follow-up request gets bigger.

## Decisions

### Saved on the History entry
- `done: number[]`: the indices of ticked steps.
- `after: string`: the id of the previous try.
- `solved: true`.
- Broken values are dropped, as with `check`.

### The error lines
The lines that name the error are compared:
- `npm ERR! code X`;
- lines starting with `SomethingError:` or `Error:`;
- lines containing `error`, `fatal`, `failed` or `exception` as a word.

Each line is compared without file positions (`:12:5`) or extra spaces. At most 5 per text.

The result is `{ gone, added }`:
- With both empty: "The error looks the same as last time."
- With no error lines found in either text: no strip.

### Copy
- "Still broken? Paste the new message".
- After pressing it, the box is emptied and focused, with a note: "Paste the new message. It will be linked to the last try."
- "It works now", then: "Solved. The steps you ticked are kept with this answer."
- The strip: "What changed since the last try", listing **Gone** and **New** lines.
- History detail: "Try N" (N ≥ 2) and "Solved".

### Samples
Ticks work but are not saved. The two buttons do not show.

## Left to the builder

- Component names and the exact regular expressions, tested.
