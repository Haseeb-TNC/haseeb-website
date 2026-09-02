# HASEEB-4113 — Round 7 spec (founder message 2026-09-03; SUPERSEDES all earlier feedback)

PR #1 stays DRAFT. Nothing merges, nothing deploys, production stays `fdd2317`.
The next checkpoint is the COMPLETE revised website running locally at one URL.

## 1. Review surface
A local static server that applies `vercel.json`'s rewrites (`/` → `haseeb.html`,
`/ar` → `ar.html`) and serves the repo root, started detached (nohup) so it
survives the session. One URL for the founder; English and Arabic, opening,
hand-off into the hero, navigation, scrolling, popup, form, mobile layouts.

## 2. Opening animation — genuine continuous motion, 6–8 s
Concept unchanged: business activity is constantly moving → Haseeb brings
clarity and order → the owner remains in control. Rules:
- Continuous motion from the first frame to the hand-off. No slideshow, no image
  swapping, no hard cuts, no empty opening. Every element moves or evolves
  continuously; state changes are interpolated, never switched.
- The three statements FORM inside one continuous composition (they end up as a
  three-line block: YOU RUN THE BUSINESS. / HASEEB PREPARES THE ACCOUNTING. /
  YOU STAY IN CONTROL. — Arabic block on the Arabic page: أنت تدير أعمالك. /
  حسيب يجهّز حساباتك. / وأنت صاحب القرار.), not as separate slides.
- Ends on the `HASEEB.` wordmark ONLY (Bebas Neue, as in the nav). The square
  "H" is NOT an approved logo: remove it from the film, popup header, empty
  state, avatars and everywhere else. Do not invent a replacement icon.
- Transitions directly into the real hero (overlay dissolves over the already
  rendered page; wordmark travels into the nav position).
- Keep: Skip from frame 1 (+ Esc), play-once per session (`sessionStorage`,
  try/catch), `prefers-reduced-motion` → no film, `saveData` → no film.
  Mobile PLAYS the film (lighter particle count); no static poster any more.
- Palette: warm white, charcoal, teal. No Kuwait imagery, no product UI.

Design (implementation guide, the builder may refine within the rules):
- Layer A — Canvas 2D field (`aria-hidden`): 28–40 tokens on desktop, 14–18 on
  phones — business words and KWD / د.ك amounts from the fixture vocabulary —
  drifting across in several lanes at different speeds and sizes, crossing
  and overlapping (activity). rAF loop, dt-based, DPR-aware, fonts loaded
  before start (`document.fonts.ready`; if fonts are late, start with the
  fallback face rather than waiting).
- t 0.0–2.4: activity. t 1.6: statement line 1 begins to FORM as DOM text over
  the field (letters/words emerge continuously: opacity + blur + translate,
  600 ms), field keeps moving.
- t 2.4–4.0: a soft teal current (canvas gradient band) moves through the field
  once; as it passes, token velocities damp and tokens interpolate toward
  ordered flowing rows (words column / decimal-aligned amounts) while STILL
  moving slowly (order, not stop). Line 2 forms beneath line 1 during this
  (t 3.2), with HASEEB / حسيب in teal ink.
- t 4.6: line 3 forms; all three lines are now one block; field rows continue
  a slow ordered drift, fading.
- t 6.0–6.8: the block condenses upward and dissolves; the `HASEEB.` wordmark
  forms at the centre out of the teal current; t 6.8–7.6: FLIP of the
  wordmark into the nav position while the overlay dissolves; the hero is
  already beneath. Total ≈ 7.6 s. Skipping runs the same 300 ms dissolve.
- Weight: ≤ 30 KB added CSS+JS; no library, no images, no audio, no `<video>`.

## 3. Popup positioning
- Launcher headline EXACTLY: “Talk to Haseeb like you talk to your accountant.”
  Do NOT translate it into Arabic yet: the Arabic page shows the English
  sentence for now, and the context table (§7) marks it “awaiting Kuwaiti
  copy review”.
- Popup identity = `HASEEB.` wordmark text in the header (no icon, no “The
  Accountant”, no `المحاسب`, no persona). Status line and demo badge stay.

## 4. Suggested-question behaviour (state machine)
- Each suggestion is usable ONCE per conversation: remove it immediately on
  selection; only unused ones remain.
- While an answer is being prepared, ALL remaining suggestions and the send
  button are disabled; rapid clicks cannot create unanswered or duplicate
  messages (guard with a `busy` flag + conversation token).
- “New conversation” cancels any pending timer, clears the thread, and resets
  all three suggestions. An answer from the old conversation must never render
  after a reset (every timer callback checks the conversation token).
- After all three are used, no suggestions are shown until a new conversation.
- Closing the popup cancels pending timers too.

## 5. Demo capabilities and truthful answers
- Keep “Guided demo · sample data” clearly visible in the header.
- ONE fixture: `src/fixture/sample-company.json` — the fictional company, an
  as-of date, bank accounts, open invoices, and the P&L for the current and
  previous month. ALL sample figures in the popup answers AND the example rows
  on the page are rendered from this fixture at build time (copy files carry
  templates with `{placeholders}`, never literal figures). `check.mjs` gains a
  reconciliation tripwire: invoice sum == outstanding total; account sum ==
  cash; revenue − operating expenses == net income (both months); the %
  changes and differences quoted in answers are recomputed and must match the
  rendered text to the digit.
- Fixture values (fictional; “The Company W.L.L.”, as of 30 April 2026):
  accounts: Operating account 118,600.000 · Savings account 24,250.000 → cash
  142,850.000 (2 accounts). Open invoices: 7012 Example Trading Co. W.L.L.
  8,000.000 · 7018 Al Bustan Services Co. 2,950.000 · 7021 Dar Al Noor
  Trading 1,500.000 → 12,450.000 across 3 customers (all names fictional).
  April 2026: revenue 48,420.750 · operating expenses 39,190.590 · net income
  9,230.160. March 2026: revenue 42,475.000 · operating expenses 37,900.000 ·
  net income 4,575.000. Example rows (how cards): ZAIN TELECOM 28.500 ·
  Transfer 450.000 · Supplier invoice 1,840.000 (14/15 April 2026).
- Questions (EN, exact):
  1. “Which unpaid invoices need my attention?”
  2. “How much cash do we have right now?”
  3. “What were our revenue, expenses and net income this month?”
- Answers (EN templates):
  1. “{customerCount} customers have unpaid invoices totalling {openTotal} KWD. The largest open invoice is {largestInvoiceNo} from {largestCustomer}, {largestAmount} KWD.”
  2. “{cash} KWD available across {accountCount} bank accounts, as of {asOfDate}.”
  3. “{month}: revenue {revenue} KWD, operating expenses {opex} KWD, net income {net} KWD. Compared with {prevMonth}: revenue {revenueChangePct}, operating expenses {opexChangePct}, net income {netChangeAbs} KWD {netChangeDir}.”
  No “due last week”, no payroll, no causes.
- Input placeholder replaces “Ask anything about your books…” with: “This website demo answers the suggested questions only.” Free text still gets the boundary reply.
- Arabic: existing Arabic drafts stay as drafts for strings that already had
  one; every NEW string (launcher, placeholder, the three questions and
  answers) shows the ENGLISH text on the Arabic page for now and is listed in
  the §7 table as “awaiting Kuwaiti copy review”. No new Arabic is authored.

## 6. Main website copy (EN)
- Keep the current headline. Keep “Haseeb is built for Kuwaiti businesses.”
  REMOVE `hero.sub` (the explanatory paragraph) on both pages.
- REMOVE the standalone “KWD · 3 decimals” chip and the sentence “KWD to three
  decimals.” from the Kuwait section (both pages). Decimal formatting stays in
  product examples only.

## 7. Arabic
Not approved; no independent translation decisions. After the English
structure is final: a context table listing EVERY Arabic string with its
English source, where it appears, a screenshot of that location, and any
length limitation. Delivered as `docs/HASEEB-4113-arabic-context.html`
(+ `.md`), screenshots under `docs/screenshots/HASEEB-4113/ar-context/`.

## 8. Functional blockers
- JS failure: the page must stay visible and usable. `.reveal` sections are
  visible by default and only hidden under `html.js`; the film overlay is
  hidden by default and only shown by JS once the module has initialised; a
  CSS-only failsafe removes the overlay at 10 s even if JS dies mid-film
  (`animation` → `visibility:hidden; pointer-events:none`) and
  `window.addEventListener('error')` tears it down; the form works without JS
  via `action="mailto:founder@haseeb.app" method="post" enctype="text/plain"`
  (JS enhances subject/body); tripwire 4 changes from “no action” to “action
  is exactly that mailto and nothing else”. Nav anchors and the language
  switch are plain links.
- Popup timers: every timeout is tracked and cleared on answer, close, new
  conversation and page hide.
- Deployed HTML carries NO internal comments: build strips all `<!-- -->` from
  the built pages; the legal pages' hidden legal-review/entity notes move to
  `docs/LEGAL-REVIEW-NOTES.md`; tripwire: no `<!--` in the four deployed pages.
- Privacy text: add (a) the opening-animation session flag (one value in
  `sessionStorage`, no identifier, gone when the tab closes, no tracking) and
  (b) that applications sent by email arrive in a Haseeb mailbox and may be
  read by the Haseeb team for the founding cohort. Factual edits only.

## Definition of done for this round (in addition to the existing tripwires)
No `<svg>`/icon "H" mark anywhere (grep for the mark class and any 1–2 character
teal square); launcher text exact; three questions exact; fixture reconciles;
no literal figure in copy files outside the fixture; no `<!--` in deployed
pages; `hero.sub` and the decimals chip gone; film continuous (a Playwright
probe samples the canvas every 100 ms and asserts the frame changes at every
sample until hand-off, and that total duration is 6–8 s); popup state machine
proven (rapid double-click, new-conversation during thinking, close during
thinking, three-then-none); no-JS render of both pages with hero, nav, form
(mailto action) and footer usable; `npm run site:axe` 0.
