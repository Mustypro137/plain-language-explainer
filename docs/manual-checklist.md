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
- [ ] Explain: after an answer, "Make it simpler" and "More detail" each return a new answer with "Simpler version" or "More detailed version", and the Network tab shows  in the request.
- [ ] My Words: new saved words show a topic; words saved before topics show General. The new / learning / known numbers match the cards, and topic buttons filter the list together with search.

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
