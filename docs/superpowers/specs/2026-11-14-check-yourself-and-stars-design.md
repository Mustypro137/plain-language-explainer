# Check yourself + Stars in your text (design)

Approved by the user on 2026-11-14 ("go ahead"). These are ideas E3 and H4 from the PROMPT 03 feature list.

## Why

A plain answer feels understood, but nothing asks the reader to show it. Practice covers single words, never the meaning of a text.

Saved words live in My Words. The reader never sees that they now recognise those words in new text, which is the moment knowing them matters.

## Goals

- **Check yourself.** Three questions at the end of an answer, built only from the answer that is already stored. The result names the line to read again.
- **Stars in your text.** Saved words are marked with a small gold star in the line-by-line original, and a count line says "You know N words here".

## Non-goals

- No AI calls.
- No new page.
- No change to review dates or word levels.

## Anti-goals

- The answer must not get noticeably taller on a phone.
- A question must not be wrong for the wrong reasons, for example asking about the order of steps.

## Approaches

1. **Build the questions in the browser from the stored answer.** Chosen: no AI cost, and it works for every answer already in History.
2. Ask the AI to write questions in the same Explain call. This makes every answer bigger, and old History entries would have no questions.
3. Make a separate AI call for questions. This costs the shared free limit.

For the stars, the existing `markWords` already marks words in a line, so it is reused rather than writing a second matcher.

## Decisions

### Check yourself
- **Where it shows:** under the answer cards, only when the answer has at least 3 lines or at least 3 hard words.
- **The questions:** up to 3, in the browser:
  - **Line match:** show an original line; the choices are its plain sentence and two other lines' plain sentences.
  - **Word meaning:** show a hard word; the choices are its meaning and two other hard words' meanings.
- **How they mix:** questions alternate between the two kinds where both are possible.
- **Choices:** shuffled, and keys `1`–`3` work, using the same look as multiple choice in Practice.
- **Result:** "N of 3". When a line question was missed, a link "Read line 04 again" scrolls to that row and highlights it for a moment.
- **History:** the score is saved on the entry (`check: { right, total }`) and shown in the History list as "Checked 2 of 3". Starting again is allowed.
- **Effect on words:** none. Words keep their practice levels whatever the answers.

### Stars in your text
- **Which words:** saved words that appear in a line's original text are marked, unless they are already one of this answer's hard words.
- **Tapping one:** opens the existing word panel with that word's saved meaning and "You saved this N days ago".
- **The count line:** above the table, "You know N words here", counting each distinct saved word found, the hard words included.
- **Effect on reviews:** none.

### Motion and access
- The stars twinkle once when the answer appears; not with reduced motion.
- A right answer makes the matching row glow briefly.
- Choices are real buttons. The result is announced politely to screen readers.

## Left to the builder

- Component names, CSS class names and test layout, following the existing patterns (`ChoiceQuestion`, `WordPanel`, `markWords`, `historyStore`).
