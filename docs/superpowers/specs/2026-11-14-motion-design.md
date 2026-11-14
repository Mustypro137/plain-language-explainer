# Motion (design)

This is the PROMPT 04 proposal. The user approved it on 2026-11-14 with "merge, then build all".

## Why and how much

The app already has one motion vocabulary in `src/styles/tokens.css`: `--ease`, `--t-press` (120ms), `--t-state` (200ms), `--t-enter` (320ms) and `--t-star` (600ms). Only opacity and position move.

The aim is a little more motion, with a purpose for each:
- feedback;
- where something came from;
- a state change you would otherwise miss;
- one small success moment.

**Not in scope:**
- motion on the home page;
- magnetic buttons;
- faked typing;
- scroll-triggered reveals;
- hover lifts;
- diagrams (they come with ideas D1–D3);
- canvas;
- a motion library.

## The changes

| # | Where | Trigger | Movement | Time | Phone | Reduced motion |
|---|---|---|---|---|---|---|
| 0 | everywhere | "reduce motion" on | today every animation and transition is removed; instead, movement goes and short fades stay | 120ms | same | — |
| 1 | Line by line | a new answer (from the AI, an example, or a kept answer for the same text), not one reopened from History | each plain sentence fades in, sliding 8px from the original column; 50ms between rows, capped at row 8, starting 120ms in | 200ms each, done by about 0.6s | slides 4px down instead | a fade together, no stagger |
| 2 | Toasts | appear and close | rise 16px from the bottom edge, leave the same way; the total time on screen is unchanged | 200ms in, 150ms out | same | a fade |
| 3 | Share sheet | opens | fades in from 98% size and 6px up, growing from the top right | 200ms | grows from the top centre | a fade |
| 4 | Check yourself | Next | the new question fades in and rises 6px; the old one is removed at once | 200ms | same | a fade |
| 5 | Folds ("Show the example") | open or close | height from 0 to auto, with a fade (`::details-content`; browsers without it snap as today) | 200ms | same | instant |
| 6 | Check yourself result | the result appears | one star per question, gold if right and grey if not (the Practice convention), each twinkling 120ms after the last; on a full score the last star pops bigger | 600ms each | same | stars already shown, no scale |
| 7 | Hard-word chips and dotted words | pressed | scale to 0.97 | 120ms | the same on touch | colour only |

## Left to the builder

- Class names, and how the distances are passed: CSS custom properties, so reduced motion can set them to 0.
