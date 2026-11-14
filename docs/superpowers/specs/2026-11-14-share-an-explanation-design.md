# Share an explanation (design)

This is idea E5 from the PROMPT 03 list. The user approved it on 2026-11-14 ("go ahead").

## Why

Beginners ask friends, teachers and forums for help. Copy gives plain text only: the line-by-line view and the hard words are lost.

## Goals

- A **Share** button next to "Copy explanation" makes a link that holds the pasted text and the whole answer.
- The person who opens the link sees the answer read-only, can save its hard words into their own sky, and can start on their own text.

## Non-goals

- No server and no stored copies.
- No follow-up questions in the link.
- No accounts.
- No short links.

## Anti-goals

- A hand-edited or cut-off link must never crash the page or put unchecked data on screen.
- A link must never add anything to the opener's History.
- A link must never call the AI.

## Approaches

1. **Everything in the link, after the `#`, compressed by the browser.** Chosen. It needs no server, and browsers never send the part after `#` to a server.
2. A small store on the server with short ids. This conflicts with "no database" and adds data to look after.
3. Answer only, without the text. It gives shorter links but loses line by line.

## Decisions

### The link
- **Address:** `<site>/s#d=<data>`.
- **What it holds:** `{ v: 1, text, result, level, language }` as JSON, compressed with `CompressionStream('deflate-raw')` and written in base64url, with the prefix `z`. Where the browser has no CompressionStream, the JSON is written in base64url without compression, with the prefix `j`.

### Checking an opened link
- The data is checked with the same rules History uses for saved answers. Those rules move to a shared module so both use one copy.
- The text is at most 3,000 characters.
- Decompression stops past 200 KB, so a crafted link cannot exhaust memory.
- **Anything wrong:** the page says "This link is broken or cut short" and links to the Explain page.

### The share sheet
- It opens under the answer's actions and says: "This link contains your text and the answer. Nothing is stored on a server. Check that your text has no passwords or keys."
- It holds the link in a read-only box and a **Copy link** button, which shows the toast "Link copied".
- Over 8,000 characters, it adds: "This link is long. Some chat apps cut long links."

### The shared page (`/s`)
- A banner: "Shared explanation · read only".
- In simple words, Line by line (with the opener's own saved words starred), Why this happens, What to try next, the example, the hard words with Save, and Check yourself.
- An **Explain your own text** link to `/`.
- The page title is "Shared explanation", and the page is marked noindex.
- Saving a word from it works as on the Explain page, but the word has no `source`, because the explanation is not in the opener's History.

## Left to the builder

- Component names and how much of the answer view is shared with ExplainPage.
