# Manual checklist

Run this before each release, on the live site. Tick each line.

## Five real samples

Paste each sample on the Explain page. Every one must return a useful answer in a few seconds.
Errors must show all five parts. Docs paragraphs must show four (no "What to try next").

**Error messages**

1. ```
   TypeError: Cannot read properties of undefined (reading 'map')
       at ProductList (ProductList.jsx:14:22)
       at renderWithHooks (react-dom.development.js:15486:18)
   ```
2. ```
   npm ERR! code ERESOLVE
   npm ERR! ERESOLVE could not resolve
   npm ERR! While resolving: some-chart-lib@2.1.0
   npm ERR! Found: react@19.0.0
   npm ERR! Could not resolve dependency:
   npm ERR! peer react@"^17.0.0" from some-chart-lib@2.1.0
   ```

**Docs paragraphs** (short quotes from public documentation)

3. React docs: "useEffect is a React Hook that lets you synchronize a component with an external system."
4. MDN, Promise: "The Promise object represents the eventual completion (or failure) of an asynchronous operation and its resulting value."
5. MDN, CORS: "Cross-Origin Resource Sharing (CORS) is an HTTP-header based mechanism that allows a server to indicate any origins other than its own from which a browser should permit loading resources."

## History checks

- [ ] Explain two texts, then open History: both are there, newest first, with an Error or Docs label and the date.
- [ ] Open shows the old explanation on the Explain page with "From your history", and the Network tab shows no new `/api/explain` request.
- [ ] Closing and reopening the browser keeps History.
- [ ] Delete removes one entry. Clear all asks first; Cancel keeps everything, OK empties the list.
- [ ] Opening `/history` directly in the address bar works.
- [ ] The four top-bar links fit on one line at 320px and 360px wide.

## Version 2 checks

- [ ] Practice: Multiple choice is off with a hint below 4 saved words. With 4 or more, each question shows four meanings; the right pick says Correct, a wrong pick marks both, keys 1 to 4 and Enter work, and a round ends on the results screen.
- [ ] Explain: after an answer, "Make it simpler" and "More detail" each return a new answer with "Simpler version" or "More detailed version", and the Network tab shows `level` in the request.
- [ ] My Words: new saved words show a topic; words saved before topics show General. The new / learning / known numbers match the cards, and topic buttons filter the list together with search.
- [ ] Free limit: press Explain several times quickly until the limit is hit. The box says "used up for this minute" and counts down; Explain stays off until it reaches 0, then "Try again" works.

## Version 3, phase 1 checks

- [ ] On a phone (or 390px wide), paste a text and press Explain: the page scrolls to the loading cards, then to the answer, without pressing anything else.
- [ ] With a screen reader, the new answer is read from the "Explanation" heading. After "Make it simpler", focus is on that heading, not lost.
- [ ] `Ctrl` + `Enter` (`⌘` + `Enter` on a Mac) in the text box explains. `Enter` alone adds a new line. The hint is hidden on a phone.
- [ ] Before the first answer, the right side shows "What you will get" with the five parts, and the layout does not jump when the answer arrives.
- [ ] Each of the three examples fills the box and shows its answer at once, with "Example answer, written in advance" and no `/api/explain` request in the Network tab. Examples do not appear in History.
- [ ] The sample React error from this checklist returns at most five hard words, with no file names (`react-dom.development.js`) and no names from the code (`ProductList`).
- [ ] Long lines in "Practical example" wrap inside the card.
- [ ] Delete a word: "Deleted “word”" and an Undo button appear. Undo brings the word back in the same place with the same level. The message stays while the pointer or keyboard focus is on it.
- [ ] History: Delete and Clear all both offer Undo, and Clear all no longer opens a browser dialog.
- [ ] The browser tab shows the "Aa" icon and the page name (for example "My Words · Plain-Language Explainer").
- [ ] An unknown address such as `/abc` shows "Page not found" with a link back to Explain.
- [ ] The app name in the top bar goes to the Explain page.
- [ ] A link to the site pasted into a chat app shows the title, the description and the share image.

## Version 3, phase 2 checks

- [ ] The Vercel Firewall rule from the README is published. Press Explain 11 times within a minute (each with a new text): the 11th says "You have asked many times in a short time", counts down, and links to Practice.
- [ ] Explain a text, then explain the same text again: the answer shows "From your history" at once, with no `/api/explain` request in the Network tab. "Ask the AI again" makes one request.
- [ ] Make it simpler, then open that entry from History: it says "Simpler version", and "Ask the AI again" sends `level: "simpler"`.
- [ ] Practice shows only the words due today. After "I knew it" a word says "Review tomorrow" on My Words; after "I forgot" it says "Review today".
- [ ] With nothing due, Practice says when the next review is and "Practise anyway" starts a round of all words.
- [ ] The Practice link shows the number of due words, and it changes as soon as a word is saved or answered, without a reload.
- [ ] Finish a round: the streak goes up by one for today (only once per day), on the results screen and on My Words. The week strip marks today.
- [ ] Export, then Clear all in History and delete a word, then Import the file: the word and the explanations come back, with the message "Added …". Importing the same file again says "Nothing new in this file".
- [ ] Import a file that is not a backup (any other JSON or a picture): "This file is not a Plain-Language Explainer backup." and nothing changes.
- [ ] An old export file (`my-words-….json`, version 1) still imports.
- [ ] The speaker button reads the word aloud on the Explain page, on My Words, on a flashcard and in multiple choice. In a browser without speech the button is not there.
- [ ] After an answer, the hard words are marked in your own text. A tap shows the meaning with Listen and Save; a second tap closes it. A word the AI changed (for example "property" for "properties") is simply not marked.
- [ ] Space on a focused speaker button on a flashcard plays the word, and does not flip the card.

## Version 3, phase 3 checks

- [ ] The firewall rule now says `Request Path` · `Starts with` · `/api/`, so it also covers `/api/ask`.
- [ ] Choose a language under "Help in my language" and explain the five samples above: each answer has the translation under "In simple words", "Why this happens" and each hard word, in that language. The choice is still there after a reload.
- [ ] Choose Arabic or Urdu: the translated lines read right to left, and the English stays left to right.
- [ ] "No, English only" gives an answer with no translation lines, and the request in the Network tab has no `language`.
- [ ] Save a word from a translated answer: My Words and the back of its flashcard show the translated meaning too.
- [ ] Ask about this: ask a real question ("What is a peer dependency?") about sample 2. The answer is short, simple and about the text. A question about something else ("Write me a poem") gets a kind "I can only help with this text".
- [ ] After three questions the box goes away with the reason. Open the entry from History: the three questions and answers are there, and the box does not come back.
- [ ] Practice: "Fill the blank" hides the word in its sentence. Typing it (any letter case) says Correct; a wrong word or "Show the word" shows the right one. Words whose sentence does not use them (for example "property" in "properties") are left out, and the button is off with a reason if none fit.
- [ ] My Words: choose React, then "Practise React (N)" starts a round of only React words, with "Practise all topics" to go back.
- [ ] My Words: "Add a word" adds a word typed by hand; the same word again (any letter case) is refused. "Edit" changes the meaning, topic and note in place, and focus goes back to the Edit button. Escape cancels.
- [ ] A word saved from an explanation has "See the explanation it came from", which opens it. Explaining the same text again keeps the link working.

## Second audit fixes

- [ ] On a phone (390 x 844) and on a 1280 x 720 laptop, the Explain button is on the first screen without scrolling. "Help in my language" sits below the examples.
- [ ] In the browser's Network tab, the page answers with a `content-security-policy` header, and the Console shows no "Content Security Policy" errors on any page, in light and dark mode.
- [ ] Dark mode still opens dark with no white flash (the inline theme script is allowed by the policy).
- [ ] Reload twice: the `/assets/` files come from the browser's cache (`max-age=31536000, immutable`).
- [ ] Confetti plays after a round with 4 of 5 or better, and not after a weaker one.

## Design step 1 (Clear Lens colours, type and states)

- [ ] Light mode: grey page, white panels with thin lines, indigo buttons and links, no hard shadows. Headings in Space Grotesk, reading text in Atkinson Hyperlegible, code in IBM Plex Mono.
- [ ] Dark mode is the night sky (deep blue), and every page passes the browser's contrast check in both modes.
- [ ] While the AI works, your own lines show at once with a placeholder beside each, and "Reading your N lines…". On a slow answer, "Still working. The free AI is busy right now." appears after 8 seconds.
- [ ] The free AI limit shows an amber box with a ring that empties as the countdown runs.
- [ ] No connection and a broken answer both say "Your text is still here" and offer Try again.
- [ ] Text over 3,000 characters shows a red bar and how many characters to remove.
- [ ] Empty My Words, Practice and History show the dashed-star picture and a main button.
- [ ] The four top-bar links fit at 320px and 360px wide, and the tab icon is the dark "Aa" square.

## Design step 2 (line by line)

- [ ] Explain the React error from the samples above: "Line by line" shows the error line beside one plain sentence, and all the "at …" lines as one row ("02–05") that says where it happened (your file and line), not what React does inside.
- [ ] The npm error gives one row per line (6 rows), each in plain English. A docs paragraph gives one row per sentence.
- [ ] With a language chosen, each row has its translation under the English.
- [ ] Hard words are dotted in your text; a tap shows the meaning with Listen and Save, a second tap closes it. The Hard words card does not show your text a second time.
- [ ] The Reading level slider shows the level of the answer on screen. Choosing Simpler or More detail asks again (Network tab: `level`), and the slider is off while it loads. Arrow keys move between the stops.
- [ ] An explanation saved in History before this change still opens, with the five parts and no table.
- [ ] Copy explanation includes a "Line by line" section.
- [ ] On a phone each row stacks: number, your part, then the plain version.

## Design step 3 (My Words sky)

- [ ] My Words has a List | Sky switch; the choice is still there after a reload.
- [ ] Sky: one group per topic in its colour, a star per word. Known words are big and full, new ones small; due words have a dashed ring. No two labels overlap, on a phone too, and nothing sticks out of the sky.
- [ ] Tap a star: its panel shows the meaning, translation, source sentence, "How bright", next review and note, and comes into view. Edit works in the panel; Close puts focus back on the star.
- [ ] With the keyboard, Tab reaches every star, and a screen reader says "word, level" and "due today" when due.
- [ ] Search and the topic buttons filter the sky too.
- [ ] Save a word on the Explain page: a small star flies to My Words in the top bar and the count goes up by one. With "reduce motion" on, there is no flight.
- [ ] The top bar shows "★ N" beside My Words on a tablet or desktop; on a phone the links still fit on one line.

## Design step 4 (quiz focus mode, History by day)

- [ ] Start a practice round: the top bar goes away and an × button leads back to My Words. On the results screen the top bar is back.
- [ ] Progress is a row of stars: the current card is indigo, a known word turns gold (and twinkles once), a forgotten one turns into a dashed circle. A screen reader hears "N known, N to review, N to go".
- [ ] After each answer a line says "“word” is brighter now. Back tomorrow." or "“word” comes back today."
- [ ] Flashcards, Multiple choice and Fill the blank all show the stars and the line.
- [ ] History is grouped under Today, Yesterday and the date, newest first, with the time on each row.
- [ ] An entry with a level, a language, questions or saved words lists them on one line (for example "Simpler · in Spanish · 1 question · 2 words saved").
- [ ] Search History finds entries by their text or their explanation; with no match it says so.

## Third audit fixes

- [ ] A word saved but never practised shows in the Sky as a small "new" star with no dashed ring. After a round, a word that comes back today has the ring.
- [ ] My Words shows one summary line (new, learning, known, and "fading" and "days in a row" only when there are some) instead of three tiles and a streak card.
- [ ] An answer with line by line shows the hard words as chips: a tap opens the meaning with Listen and Save, and a saved word gets a small star. Older History entries still show the full list.
- [ ] "Practical example" is folded: "Show the example" opens it.
- [ ] The React error from the samples above no longer gives "hooks" or "render" as hard words.

## Home screen

- [ ] The headline reads "Paste what you don’t understand. Read it line by line in plain English.", and the Explain button is on the first screen on a phone (including 375 x 667) and on a 1280 x 720 laptop.
- [ ] The box and its bar are one panel. Pasting shows a first guess under it ("Looks like an npm error · 2 lines") with no request in the Network tab; the count turns red past 3,000.
- [ ] Before the first answer, the right side shows a line made plain ("npm ERR! could not resolve" and its plain version) and three points. With saved words, a dark "N words in your sky" card links to My Words.
- [ ] With a word that was practised and is due again, "Welcome back · N words are fading. Review them" appears above the headline and goes to Practice. With none fading, it does not show.

## Fourth polish round

- [ ] Sharing the site link (for example in a chat app) shows the new card: the line-by-line headline beside two npm lines made plain.
- [ ] `/robots.txt` is plain text and `/favicon.ico` is an icon, not the app's HTML page.
- [ ] An unknown address (for example `/abc`) shows Page not found, with `<meta name="robots" content="noindex">` in the page head.
- [ ] On a 320 px and a 390 px phone, the three practice modes sit on one row; "Multiple choice" may break onto two lines inside its own part.
- [ ] Scroll down an answer until the top bar is gone, then save a word: the star flies up to the top edge of the screen, not off it.

## Check yourself and stars

- [ ] An answer with 3 or more lines (or 3 hard words) ends with "Check yourself · 3 questions"; an answer with less shows no button. No request appears in the Network tab while checking.
- [ ] Each question can be answered by click and by the keys 1 to 3; typing a number into the follow-up box does not answer it.
- [ ] The result reads "N of 3". With a missed line question, "Read line 04 again" scrolls to that row and lights it up; "Check again" starts over.
- [ ] After a check on an answer from History, the History list shows "Checked N of 3" for it.
- [ ] With saved words that appear in a new text, they have a gold star in Line by line and "You know N words here" shows above the table; tapping one says "You saved this N days ago" (or today / yesterday).
- [ ] With reduced motion turned on, the stars do not twinkle and the line does not fade.

## Share an explanation

- [ ] After an answer, Share opens a sheet that says "This link contains your text and the answer. Nothing is stored on a server. Check that your text has no passwords or keys." with the link and Copy link ("Link copied"). No request appears in the Network tab.
- [ ] The link opens `/s` in a private window (no saved data): the banner "Shared explanation · read only", the answer with line by line, Save on the hard words (the word appears in My Words), Check yourself, and "Explain your own text". History stays empty.
- [ ] Cutting the end off the link, or opening `/s` alone, shows "This link is broken or cut short".
- [ ] A new answer closes the share sheet. A very long link adds "This link is long. Some chat apps cut long links."

## Polish checks (from Task 7)

- [ ] With the system "reduce motion" setting on, nothing animates and the flashcard still shows its back.
- [ ] Dark mode: with the device set to dark and nothing chosen, the app opens dark with no white flash. The sun/moon button switches theme, the choice survives a reload, and every page passes the contrast check in both themes.
- [ ] Every text and button colour pair passes WCAG AA (use the browser's contrast tool).
- [ ] Every control shows the focus ring and works with the keyboard.
- [ ] No horizontal scroll at 360px wide.
- [ ] Each page looks right at 1280px and 390px wide: Explain, My Words, Practice, Practice results.

## Live site checks (from Task 8)

- [ ] A real error message and a real docs paragraph each return a five-part (error) or four-part (docs) answer.
- [ ] A saved word is still there after closing and reopening the browser.
- [ ] Opening `/words` and `/practice` directly in the address bar works.
- [ ] In the browser's Network and Sources tabs, searching for `gsk_` finds nothing.
- [ ] Text over 3,000 characters is blocked in the browser, and `POST /api/explain` with 3,001 characters answers `400`.
- [ ] Turn off the network, press Explain: "No connection" and a "Try again" button appear and the pasted text stays.
