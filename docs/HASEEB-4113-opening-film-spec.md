# HASEEB-4113 — Opening film spec (founder direction, 2026-09-02, supersedes the three-concept round)

## The direction (verbatim from the founder)

EN statements (uppercase as written):
1. YOU RUN THE BUSINESS.
2. HASEEB PREPARES THE ACCOUNTING.
3. YOU STAY IN CONTROL.

AR statements:
1. أنت تدير أعمالك.
2. حسيب يجهّز حساباتك.
3. وأنت صاحب القرار.

Treatment: everyday business information (sale, invoice, payment, expense,
supplier, customer, KWD amounts) enters from different directions, briefly
accumulates and competes for attention; a single Haseeb-teal movement brings it
into order; transition through the three statements; end with the HASEEB. mark;
then the normal hero with “Haseeb is built for Kuwaiti businesses.”

Hard limits: brand hook, not a product demo — no dashboards, journal-entry
cards, buttons or application screens. Warm white, charcoal, teal only. No
Kuwait skyline, map, flags, generic office footage or repeated “Kuwait”
messaging; local relevance only through KWD / د.ك amounts, Arabic language and
familiar transaction terms. Lightweight original motion graphics; no footage,
no library, no audio. Skip, play-once, reduced-motion and static mobile
fallbacks. Both languages. Do not deploy.

## Palette and type

```
--film-bg:       #F8F6F2   warm white (site --bg)
--film-ink:      #2A2E35   charcoal for tokens and statements (AA on warm white: 11.9:1)
--film-ink-soft: rgba(42,46,53,.55)   receding tokens
--film-teal:     #00A684   the ONE teal movement + the mark; HASEEB in statement 2 may be teal
--film-teal-ink: #00795F   teal used as text (AA)
```
Type: EN statements DM Sans 700, uppercase as written, letter-spacing .01em,
size clamp(40px, 7.2vw, 104px), two to four words per line, `text-wrap:
balance`. AR statements Noto Sans Arabic 700, no uppercase, same clamp, line-
height 1.35. Tokens: DM Sans 500 / Noto Sans Arabic 500 for words, DM Mono 500
for amounts; sizes vary 14–28px to create competition. Amounts always LTR,
Western digits, 3 decimals, “KWD” on the EN page, “د.ك” on the AR page.

## Tokens (the “information”)

EN page (mix in a few Arabic terms for local texture, at most 3):
`Sale` `Invoice #1042` `Payment` `Expense` `Supplier` `Customer` `Rent` `Salaries`
`KNET` `Delivery` `Receipt` `Bank transfer` `28.500 KWD` `1,250.000 KWD`
`450.000 KWD` `3,980.250 KWD` `12,450.000 KWD` `فاتورة` `مورّد` `د.ك 28.500`

AR page (Arabic terms; keep 2–3 Latin tokens such as `KNET` and `#1042`):
`بيع` `فاتورة رقم 1042` `سداد` `مصروف` `مورّد` `عميل` `إيجار` `رواتب` `كي نت`
`توصيل` `إيصال` `تحويل بنكي` `28.500 د.ك` `1,250.000 د.ك` `450.000 د.ك`
`3,980.250 د.ك` `12,450.000 د.ك` `KNET` `Invoice` 

The enumerated lists above are the token set of record (20 EN / 19 AR as
built). Density is a founder tunable (24–30 would read denser). Never a
statistic, never a sentence, never a UI label like Dr/Cr/Approve. No company
names.

## Storyboard (≈10 s; all timings from film start)

| t (s) | Beat | What happens | Motion (transform/opacity only) |
|---|---|---|---|
| 0.0–0.6 | open | Warm white. Skip control visible at the top inline-end from the first frame (`film.skip`). The site's nav is NOT visible yet. | fade-in of the field |
| 0.6–3.2 | information arrives | Tokens enter from all four edges and the corners at different speeds and sizes, drifting toward the centre, overlapping, slightly rotating (±4°), charcoal only, some soft (`--film-ink-soft`). Density rises to the point of visual competition; a few late tokens overshoot and settle. | staggered translate + rotate, ease-out; 60–110 ms stagger |
| 3.2–4.4 | the teal movement | ONE teal band (a thin rounded bar, full height, ~12px wide, soft glow) sweeps once across the field from inline-start to inline-end. As it passes each token, that token snaps into place: words align into a single left column (start-aligned), amounts into a right column aligned on the decimal point, sizes normalise to one size, rotation to 0, spacing to an even rhythm. Nothing else is drawn: no rules, no headers, no card. The result reads as calm, organised text, not a table UI. | band: translateX over 1.1 s, ease-in-out; tokens: 220 ms snap each as the band crosses them |
| 4.4–5.6 | statement 1 | The ordered rows recede (scale .92, opacity .18) and hold as texture; **YOU RUN THE BUSINESS.** / **أنت تدير أعمالك.** lands large, charcoal, centred. | rows: scale+fade; statement: rise 24px + fade, 420 ms |
| 5.6–6.8 | statement 2 | Statement 1 exits upward; **HASEEB PREPARES THE ACCOUNTING.** / **حسيب يجهّز حساباتك.** lands; the word HASEEB / حسيب in `--film-teal-ink`. The ordered rows behind tighten one notch (scale .90). | exit up 24px + fade 260 ms; enter as before |
| 6.8–8.0 | statement 3 | **YOU STAY IN CONTROL.** / **وأنت صاحب القرار.** lands; the rows fade out completely, leaving clean warm white. | as before |
| 8.0–9.0 | the mark | The teal square “H” mark and the HASEEB. wordmark scale in at the centre; a short teal underline draws beneath. | scale .8→1, 380 ms; underline 300 ms |
| 9.0–10.0 | hand-off | The mark travels to the nav's wordmark position (FLIP transition) as the film field fades; the hero text and the locked line “Haseeb is built for Kuwaiti businesses.” fade up beneath. Film overlay removed from the DOM. | FLIP 520 ms; hero fade 400 ms |

## Behaviour and fallbacks (all required)

- **Overlay, not a page.** The film is a `position: fixed` overlay above the fully rendered page; the page (nav, hero, sections) is in the DOM and readable underneath from the first frame, so search engines, screen readers and reader modes never wait. `aria-hidden="true"` on the film field; the Skip control is a real `<button>` outside the hidden region with `film.skipAria`.
- **Skip**: visible from frame 1; keyboard reachable; Esc also skips. Skipping runs the same hand-off (200 ms) so the page never “jumps”.
- **Play once per session**: `sessionStorage` flag (`try/catch`); revisits go straight to the hero. Never `localStorage`.
- **Reduced motion** (`prefers-reduced-motion: reduce`): no film; the hero is shown directly. Nothing animates.
- **Static mobile fallback** (< 720 px, or `navigator.connection.saveData`): no motion; a still poster of the final ordered state with the three statements stacked (small, charcoal, one teal word) for 1.6 s, tap anywhere or Skip to continue, then the hero. Under 720 px this poster must not exceed the viewport height.
- **Focus and scroll**: body scroll locked during the film; focus is placed on the Skip button; after hand-off focus goes to the document start; scroll position restored.
- **Language**: the EN page plays the EN statements and EN tokens; the AR page plays the AR set, mirrored (inline-start/inline-end), with numerals LTR-isolated.
- **Weight**: DOM + CSS + Web Animations API; ≤ 25 KB of additional CSS+JS combined; no images, no canvas required, no library, no audio, no `<video>`.
- **Tripwires** (extend `scripts/check.mjs`): film strings present on both pages (three statements verbatim + skip label); no `<video>`/`<audio>`; the film field is `aria-hidden` and the Skip button is not inside it; `prefers-reduced-motion` guard present in `site.js`/`site.css`; forbidden-in-film words absent from film markup: “dashboard”, “approve”, “Dr”, “Cr”, “Kuwait”/“الكويت” (the film may not repeat Kuwait messaging), and no `<img>`/`<svg>` map or flag assets.

## Copy keys (add to BOTH copy files)

```
film.line1   YOU RUN THE BUSINESS.            أنت تدير أعمالك.
film.line2   HASEEB PREPARES THE ACCOUNTING.  حسيب يجهّز حساباتك.
film.line3   YOU STAY IN CONTROL.             وأنت صاحب القرار.
film.skip    Skip                             تخطّي
film.skipAria Skip the opening                تخطّي الافتتاح
film.tokens  [array, per language, as listed above]
```
