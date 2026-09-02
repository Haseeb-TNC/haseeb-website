# HASEEB-4113 — Public-website redesign brief · v2 (Lane 1, founder dispatch 2026-09-02)

v2 folds in an adversarial review (35 findings, 6 blocking) and the Arabic copy
review (`docs/HASEEB-4113-arabic-review.md`). This is the build spec for the
redesign of haseeb.app and the first-checkpoint artifact (section map +
storyboard). **Copy of record lives in `src/copy/en.json` and
`src/copy/ar.json`; the builder renders it and does not rewrite it.**

## 0. Ground truth (measured 2026-09-02)

- haseeb.app is served by Vercel from this repo, `main@fdd2317`. `vercel.json`
  rewrites `/` → `/haseeb.html`. `privacy.html` and `website-terms.html` are
  served at their file names. No `/ar` exists today.
- All three live files are byte-identical to `main`. The aft-command copy under
  `launch/pages/` is stale by one email edit. The old Arabic page
  (`launch/pages/haseeb-ar.html`, v6, 57 “Aminah” mentions) is NOT a base for
  anything here.
- The product has a light theme (`src/styles/themes.css` in corp-FE); its
  light tokens are reused so product frames match the real product.
- No public or unauthenticated chat endpoint exists or is approved. The
  chatbot is a labelled guided demonstration on sample data.
- The three demo questions map to registered, allowlisted, read-only product
  tools: `get_ar_aging`, `get_cash_position_advisor`,
  `get_management_report_summary` (corp-api `src/ai/aminah/agent-runtime.ts`
  allowlist; definition `src/modules/reports/management-report.aminah-tool.ts`).
- The product's Taskbox has a reply box on a task (“Write a reply...” /
  “Reply”, corp-FE `src/i18n/locales/en/taskbox.json`), so the storyboard's
  question beat shows the owner replying in that box. Product vocabulary for
  the count is “OPEN” (`taskbox.json:129`).
- Vercel serves the repo root as-is, so everything not meant to be public must
  be excluded with `.vercelignore` (§2).

## 1. Locked decisions (from the dispatch)

1. Light-first design: warm white / light grey / Haseeb teal / dark text. No theme toggle.
2. Complete Arabic version with a visible “English / العربية” switch, real RTL, natural copy.
3. Hero supporting line, verbatim: EN “Haseeb is built for Kuwaiti businesses.” · AR “حسيب مصمّم للأعمال الكويتية.”
4. Main headline unchanged. Options (EN + AR) were carried in `_headlineOptions`; **that group was deleted from both copy files on 2026-09-02 and now lives in this document only** (A–D below). None ships without Tarek's line.
   - A “Get ahead with accounting software that understands your business.” · “كن في المقدّمة مع برنامج محاسبة يفهم عملك.”
   - B “Accounting that does the work, and asks when it needs you.” · “محاسبة تُنجز العمل، وتسألك حين تحتاج إليك.”
   - C “Your books, prepared for you. You approve.” · “دفاترك مُجهَّزة لك. وأنت تعتمد.”
   - D “Accounting software built for Kuwait that understands your business.” · “برنامج محاسبة مصمّم للكويت، ويفهم عملك.”
    The Arabic H1 is a translation of the current headline and is itself shown at the checkpoint.
5. Sections removed entirely: “Intelligent accounting will become normal” and “Better information. Faster accounting. Less routine work”. Also removed: the announcement bar, the large conversation section, the Owner-Today frame in “How it works”, the statement-import frame in “Kuwait”, three form fields.
6. PREPARES / ASKS / HOLDS kept, presented as three simple cards.
7. Zero “Aminah” anywhere in the repo's public output AND source: text, frames, class names, comments, JSON keys, alt text, metadata, accessibility text. No replacement character brand.
8. Large embedded conversation section replaced by a floating launcher — “تكلّم مع محاسبك كما تتكلّم مع أي شخص” — opening a **faithful recreation of the product's in-app conversation drawer** (2026-09-02 founder instruction), titled HASEEB / حسيب, with the “Guided demo” tag on the launcher and a badge in the drawer. There is still no endpoint, so the three suggested questions have scripted answers on sample figures and **free text is answered only with `bot.demoBoundary`** — never fabricated. (“المحاسب” remains an option for the AR title if Tarek prefers; parity with EN is why “حسيب” ships.)
9. Cohort form = Name / Phone number / Email (الاسم / رقم الهاتف / البريد الإلكتروني). Existing mailto behaviour preserved; nothing stored; no network call.
10. info@haseeb.app present and linked as the general contact (footer + legal pages).
11. Simpler nav, copy and density. One primary action: “Join the founding cohort”. The demo is reached by a text link in the Ask band and by the launcher; nav shows the primary button on desktop only; mobile keeps the sticky bar as its one button.
12. ~~Hero motion: original 10–12 s sequence on genuine product UI.~~ **SUPERSEDED 2026-09-02 (founder): the product-UI hero sequence is SHELVED and the hero is text-first (§4, §6). The opening is a brand film and its concept is undecided — `docs/HASEEB-4113-opening-concepts.md`.** The constraints that survive and still bind whatever ships: **no reference footage, colours, typography, slogans or assets, and no reference to that firm anywhere in source or output**; no audio, no video, no library; reduced-motion and mobile fallbacks; nothing autoplays without a control.
13. Website only. No product, backend, tenant or production-deploy change. No new or broader product claims (v8 copy is the ceiling; §5 lists the two claims deliberately removed).

## 2. Architecture

```
haseeb-website/
  src/
    site.template.html        one template; {{key}} placeholders; no conditionals
    copy/en.json              English string table (copy of record)
    copy/ar.json              Arabic string table (identical key set)
  assets/
    site.css                  shared styles; logical properties only
    site.js                   reveal, nav, language switch, conversation drawer, form, sticky CTA; no network calls
  scripts/
    build.mjs                 node ≥ 18, zero deps: template + copy → haseeb.html, ar.html
    check.mjs                 definition-of-done tripwires (§8), exit 1 on any failure
  haseeb.html                 BUILT — English (served at /)
  ar.html                     BUILT — Arabic (served at /ar)
  privacy.html                light restyle + the factual edits in §2.1; EN only
  website-terms.html          light restyle + the factual edits in §2.1; EN only
  vercel.json                 { rewrites: [ {"/","/haseeb.html"}, {"/ar","/ar.html"} ], "framework": null }
  .vercelignore               docs/ src/ scripts/ *.md package.json .github/
  package.json                { "scripts": { "site:build": "node scripts/build.mjs", "site:check": "node scripts/check.mjs" } } — no dependencies, no "build" script
  docs/                       this brief, the Arabic review, screenshots (never deployed)
```

- Two generated pages from one template keep EN and AR structurally identical
  by construction. Built files are committed; Vercel stays a pure static deploy
  (`package.json` is ignored by Vercel via `.vercelignore`, and the npm script
  is deliberately not named `build` so zero-config detection cannot run it).
- `<html lang dir>` from `html.*` keys; both pages emit `<link rel="canonical">`
  and absolute `hreflang` alternates (`en`, `ar`, `x-default` → `/`).
- Copy values may contain `<span class="num">…</span>`; `build.mjs` wraps any
  digit run (`[0-9][0-9,.٪%٪–-]*`) in AR prose values with that span
  automatically so numerals stay LTR-isolated. `html.*`, `*Ph`, `footer.contact`
  and `brand.*` are exempt from wrapping.
- Fonts: DM Sans + DM Mono + Bebas Neue (wordmark only) + Noto Sans Arabic
  (the product's Arabic face). Google Fonts as today; the only external hosts
  allowed are `fonts.googleapis.com` and `fonts.gstatic.com`.
- Wordmark “HASEEB.” stays Latin on both pages (as the product does in Arabic).

### 2.1 Legal pages (English only, factual edits only)

Both pages are restyled light with content unchanged EXCEPT:
- Structure and links (2026-09-02): the back links are a `<nav>`, the document body is a `<main>`, the page footer stays a `<footer>`, and every link carries a permanent underline (`text-decoration: underline; text-underline-offset: 2px`) so colour is not the only signal (WCAG 1.4.1).
- `privacy.html` §2 lists the six old form fields; rewrite that sentence to “your name, phone number and email address”.
- Contact lines in both pages: replace `founder@haseeb.app` with `info@haseeb.app` (general contact); the application mail itself still goes to founder@haseeb.app and privacy §2 keeps saying so.
- Add a second back link “← العودة إلى حسيب” → `ar.html` beside the existing “← Back to haseeb”.
- Keep both hidden “professional legal review still required” notes. Arabic legal texts are NOT produced (flagged at the checkpoint).

## 3. Design tokens (light-first)

```
--bg:            #F8F6F2   warm white (product --bg-base)
--surface:       #FFFFFF
--surface-2:     #F1EFEB   light grey (sunken)
--border:        rgba(0,0,0,.09)
--border-strong: rgba(0,0,0,.14)
--text-1:        #1A1F26
--text-2:        #4A5260
--text-3:        #5D6472   tertiary; >=5.0:1 on all three grounds (bg 5.510 / surface 5.947 / surface-2 5.178)
--teal:          #00A684   brand fill for primary buttons and accents
--teal-on:       #04231C   TEXT ON TEAL (product --accent-primary-on; 5.8:1) — never white on teal at body size
--teal-ink:      #00795F   teal used AS TEXT on white (4.7:1)
--teal-soft:     rgba(0,166,132,.10)
--amber:         #B45309   "needs an answer" text on white
--amber-soft:    rgba(217,119,6,.12)
--red:           #B91C1C   "held" text on white
--red-soft:      rgba(220,38,38,.10)
--radius:        14px cards · 10px inputs · 999px pills
--shadow-card:   0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)
--max-w:         1120px
z-index:         nav 50 · sticky mobile CTA 60 · chatbot launcher 70 · drawer backdrop 75 · conversation drawer 80
```

Type: body 17px/1.65; H1 clamp(36px, 5vw, 60px) weight 600; H2 clamp(28px,
3.4vw, 40px). Arabic: same sizes, letter-spacing 0, body line-height 1.8,
headings 1.3. Numbers and KWD amounts in DM Mono, LTR-isolated, Western
digits, 3 decimals. Section padding 96px desktop / 64px mobile.

## 4. Page / section map (revised)

| # | Section (id) | Purpose | Content | Change vs live |
|---|---|---|---|---|
| 0 | Nav | Orientation | Wordmark · How it works · Kuwait · Founding cohort · **English / العربية** · primary button (desktop) | 5 links → 3 + language switch; announcement bar removed |
| 1 | Hero (`#top`) | The one message + one action | H1 (unchanged) · supporting line (locked) · one sentence · primary CTA · secondary text link · cohort fact line. **Text-first: one centred column, generous whitespace, subtle reveal-on-scroll, nothing that moves on its own.** | **2026-09-02 · the animated product-UI stage is SHELVED (§6); the hero is text only** |
| 2 | How it works (`#how`) | PREPARES / ASKS / HOLDS | H2 + one intro sentence + three cards (label, product status pill, one example row, two sentences) + closing line | Merges live `#how` + `#why`; drops the large Owner-Today frame |
| 3 | Ask (`#ask`) | Plain-language questions | Eyebrow + H2 + one sentence + text link “Try the guided demo →” (opens the chatbot) | Replaces the large conversation section |
| 4 | Kuwait (`#kuwait`) | Local fit | Eyebrow + H2 + one sentence + four chips | Drops the statement-import frame (it moved into the hero sequence, which was then shelved — §6) |
| 5 | Founding cohort (`#cohort`, form `#apply`) | Application | H2 + one sentence + three bullets · form card: Name / Phone / Email · submit · small “Speak with the founder” text link | 6 fields → 3; mailto preserved |
| 6 | Footer | Legal + contact + language | Wordmark · Website Terms · Privacy Policy · **info@haseeb.app** · English / العربية · © | Adds info@, real language switch |
| — | Conversation drawer (guided demo) | A faithful recreation of the product's in-app accounting-conversation drawer, on sample data | Launcher pill with the “Guided demo” tag (bottom inline-end; on mobile a compact pill with the tag still visible, above the sticky bar) → a 440 px `<div role="dialog" aria-modal="true">` slide-over from the inline-end edge (the product uses `<aside>`; ARIA-in-HTML does not allow `role="dialog"` there and axe flags it, so the marketing site uses a `div` with identical semantics) (mirrors to the left in RTL; full-width < 720 px). Header: teal “H” mark · title `bot.title` · 9 px `bot.status` · demo badge · “New conversation” · close. Body: empty state (mark, `bot.emptyTitle`, `bot.emptySub`, `bot.suggestedLabel`, three chips) then the transcript — user bubble inline-end, plain assistant text inline-start, a ~600 ms thinking row before each answer. Input row: textarea + send. **Free text is never answered — it gets `bot.demoBoundary` and the chips again.** 9 px disclaimer under the input | **2026-09-02 · rebuilt to the product drawer.** Free-text input added and answered honestly rather than not offered |
| — | Mobile sticky CTA | One action | “Join the cohort →” after the hero, hidden while the chatbot dialog is open | Kept |

Section id set on both pages, exactly: `top`, `how`, `ask`, `kuwait`, `cohort` (form `#apply` inside `#cohort`).

## 5. Copy of record

`src/copy/en.json` and `src/copy/ar.json`. Notes for the builder:
- Both files must keep identical key sets. The `_headlineOptions` and `seq` groups were **deleted** on 2026-09-02 (headline options moved to §1.4; `seq` shelved with the sequence).
- The `bot` group is the conversation drawer's copy: `launcher`, `launcherTag`, `launcherAria`, `title`, `status`, `badge`, `newConversation`, `close`, `emptyTitle`, `emptySub`, `suggestedLabel`, `q1..q3`, `a1..a3`, `thinking`, `demoBoundary`, `inputLabel`, `placeholder`, `send`, `disclaimer`. `status`, `newConversation`, `emptySub`, `suggestedLabel`, `thinking` and `close` are the product's own strings, reused verbatim (corp-FE, the assistant's own locale bundle under `src/i18n/locales/{en,ar}/`) minus every occurrence of the assistant's name.
- `hero.support` is locked verbatim in both languages. `bot.launcher` is the founder's text.
- Two live claims were deliberately removed as broader than v8 evidence: “and invoices” (ingestion) and “in Arabic or English” (bilingual answers). Do not reintroduce them.
- The chat demo's example customer is the fictional “Example Trading Co. W.L.L. / شركة مثال للتجارة ذ.م.م” (the live page named a real Kuwaiti company; the v6 rule forbids that). Tarek may choose another fictional name at the checkpoint.
- Product vocabulary reused verbatim: EN “Ready to approve / Needs an answer / Held for review”, “Taskbox · N open”, “Write a reply...”, “Reply”, “Approve”; AR “جاهزة للاعتماد” (`rbeBatchReview.json`), “بحاجة إلى إجابة” (`migration-workspace.json`), “موقوف” (`migration.json`), “صندوق المهام” (`taskbox.json`).
- Mailto: subject from `form.mailSubject` with `{name}` substituted; body = `form.mailHeading`, a dashed line, `Name: …`, `Phone: …`, `Email: …` (labels from `form.name/phone/email`), blank line, `form.mailtoTrailer`. Target `mailto:founder@haseeb.app`. Founder link subject from `form.founderSubject`. No `action` attribute, no fetch/XHR/beacon anywhere in `site.js`.

## 6. Hero sequence storyboard — SUPERSEDED

> **SHELVED 2026-09-02; opening film pending concept decision, see
> `docs/HASEEB-4113-opening-concepts.md`.** Founder instruction: the opening is
> a brand film, not a product demo. The sequence specified below was built at
> `cc186c2`, is kept in git history only, is not in the deployed site, and is
> not to be polished further. The table is retained as the record of what was
> built and is superseded in full.

### 6.1 The shelved storyboard (≈12 s, loops; the motion principle only)

Stage frame = a product-UI window (light theme) inside the hero, 16:10, on the
inline-end side of the hero text on desktop; below the text on tablet; a static
composite on mobile (< 720 px). Every movement is transform/opacity only. The
**owner's approval is an explicit beat**: nothing posts before it.

| t (s) | Beat (caption key) | What the viewer sees | Motion |
|---|---|---|---|
| 0.0–2.2 | `seq.stage1` A bank transaction arrives | Small statement-line card: `f1Line` · `f1Amount` · `f1Meta` | Fades in small, then **expands to fill the frame** (scale .42 → 1, 900 ms ease-out) |
| 2.2–4.6 | `seq.stage2` Haseeb organizes the information | Card **contracts into a smaller window** and **slides** to the inline-start edge; a panel **reveals**: `f2Merchant` → `f2Category` → two lines Dr `f2Dr` `f2Amount` · Cr `f2Cr` `f2Amount` · pill `f2Status` | Contract (1 → .38) + translate; panel slides in from inline-end; lines appear with 120 ms stagger |
| 4.6–7.4 | `seq.stage3` A question, only when something is missing | New line slides in: `f3Line` · `f3Amount` · `f3Meta`; it **expands**; a Taskbox task card appears: `f3Question` · pill `f3Status` · a reply box (`f3ReplyPlaceholder`); the owner's reply `f3Reply` types in; `f3ReplyButton` highlights once | Expand as stage 1; card scales from .9; typing 700 ms; single 300 ms highlight |
| 7.4–9.8 | `seq.stage4` A balanced draft. You approve. | Task **contracts and slides** away; draft entry **reveals**: `f4Title` · Dr `f4Dr` `f4Amount` · Cr `f4Cr` `f4Amount` · `f4Balanced` · pill `f4Status` · button `f4Approve`; the button is **pressed** (pressed state, 350 ms) and changes to `f4Approved` | Contract + slide; reveal; press state; no pulse loop |
| 9.8–12.0 | `seq.stage5` The books and the report update | Draft **contracts** into a thumbnail; Owner view **reveals**: `ownerView` · tiles `f5Revenue` `f5RevenueValue` · `f5Expenses` `f5ExpensesFrom → f5ExpensesTo` · `f5Net` `f5NetFrom → f5NetTo` (both tween together, 600 ms) · row `f5Taskbox` · caption `f5Updated` | Contract; reveal; tween; hold 1.2 s; cross-fade to stage 1 |

Rules:
- Stable page text: H1, supporting line, sub, CTAs never move with the sequence.
- Controls: one pause/play button placed OUTSIDE the `role="img"` stage, as a sibling inside a `role="group"` labelled from `seq.preview`. `aria-pressed`, labels `seq.pause` / `seq.play`, 44 px target, Space/Enter toggle. Autoplay pauses when the tab is hidden or the stage leaves the viewport; resumes only if the user did not pause.
- Reduced motion (`prefers-reduced-motion: reduce`): no autoplay; the stage shows the **five beats as a static strip** with captions; the play button still works (opt-in).
- Mobile (< 720 px): the **static composite** (the stage-4 frame) with the five captions listed beneath. No timers run.
- No audio, video, iframe, or third-party library. Frames are DOM + CSS in the product's light tokens; no assistant pill/header anywhere.
- Product fidelity: same vocabulary as the product; tenant stays the fictional `seq.tenant`; all figures are sample data and the stage carries `seq.preview`. Arithmetic is consistent: expenses +478.500 (28.500 + 450.000) and net income −478.500 in stage 5; `bot.a3` states the post-update net income.
- Arabic: the stage mirrors (inline-start/end), captions in Arabic, numbers stay LTR.

## 7. Accessibility + RTL requirements (hard gates)

- WCAG AA contrast on every text/background pair (teal buttons use `--teal-on` text; teal text on white uses `--teal-ink`).
- Full keyboard: nav (including a mobile menu button labelled `nav.menu`), language switch, CTAs, form, and the conversation drawer (focus trap, Esc closes, focus returns to the opener, chips / textarea / send / new-conversation / close all reachable).
- Landmarks: one `<main>`, `<nav aria-label>`, `<footer>`; heading order h1 → h2 → h3.
- Hero: text only. Nothing in it autoplays, so it needs no motion control (§8 tripwire 8). Decorative `<svg>` anywhere on the page carries `aria-hidden="true" focusable="false"`.
- Conversation drawer: `role="dialog" aria-modal="true" aria-labelledby`; the rest of the page is `inert` while it is open; launcher `aria-expanded` + `aria-controls`; the transcript is an `aria-live="polite"` region; the textarea has a bound (visually hidden) label and the send button an `aria-label`; the sticky mobile CTA and the launcher are hidden while it is open; 44 px targets below 720 px.
- RTL: CSS logical properties only (`margin-inline-*`, `inset-inline-*`, `padding-inline-*`, `text-align: start`); no `left/right` in layout rules; directional arrows mirror via `[dir=rtl]`; phone/email inputs `dir="ltr"` with `text-align: start`; numerals LTR-isolated (§2).
- Language switch: visible in nav and footer on both pages; preserves the current section anchor (`/ar#how` ↔ `/#how`); `hreflang` + canonical (§2).
- Form: exactly three inputs (`type=text|tel|email`, `autocomplete` name/tel/email, `required`), labels bound, inline errors with `aria-describedby`, `role="status"` region for the summary.
- Mobile stacking: launcher is a compact pill (icon + the “Guided demo” tag), positioned above the sticky bar (`inset-block-end` = bar height + 12px); z-index per §3.

## 8. Definition-of-done tripwires (`scripts/check.mjs`, exit 1 on any failure)

1. **No assistant brand anywhere:** every tracked file under `src/`, `assets/`, `scripts/` plus the four built pages, `vercel.json`, `.vercelignore` and `package.json` — the identical set to tripwire 11, built by one shared `SCAN_SET()` — has zero case-insensitive matches of `amin[ae]h?|ameena|أمينة|امينة`.
2. `en.json` and `ar.json` have identical key sets (deep) and no empty string values.
3. Built pages (WHOLE file, head included, **no carve-out**) contain none of the removed-section copy: “will become normal”, “put it to work first”, “catches up”, “Better information. Faster accounting”, “more value from the accounting”, “Intelligent accounting”. **Separately**, and body-only, “Founding cohort now forming” / “الدفعة التأسيسية قيد التشكيل” is absent from `<body>` on both pages (ruling 2026-09-02: it was the announcement BAR, not a removed section, so it may stay in `meta.description`). Each page's `<section id>` set is exactly `top, how, ask, kuwait, cohort`. The `meta.description` allowance is the only exemption and is printed on the check's own output line.
4. Each built page: `#cohortForm` has exactly three `<input>` (types text, tel, email), no `<select>`, no `<textarea>`, no `action` attribute; `assets/site.js` contains no `fetch(`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`; `mailto:founder@haseeb.app` present.
5. Each built page contains `mailto:info@haseeb.app`, `website-terms.html`, `privacy.html`; both legal pages contain `mailto:info@haseeb.app` and the AR back link.
6. `ar.html` has `lang="ar" dir="rtl"`; `haseeb.html` has `lang="en"` and no `dir="rtl"`; both have `rel="canonical"` and three absolute `hreflang` links.
7. The **rendered text of the `.hero-support` element**, trimmed and with markup removed, is byte-equal to the locked supporting line on both pages. Not a substring test and not a whole-file test: the same sentence also lives in `meta.description`, so a file-level `includes` passes even when the hero line is changed or deleted (measured 2026-09-02 — the previous form of this tripwire was inert against all three mutations).
8. `assets/site.css` contains a `prefers-reduced-motion: reduce` rule AND nothing on either built page autoplays: no `autoplay` attribute, no `<video>`, and any element carrying `data-autoplay` has an `id` referenced by an `aria-pressed` control's `aria-controls`. The check prints the tag count, the autoplay count, the `<video>` count, the `data-autoplay` count and the `aria-pressed` count for each page.
9. Light-first: no `data-theme="dark"`, no `#0B0F14`/`#0b0f14` in any of the four pages or `site.css`.
10. External hosts: every `src`/`href` with a scheme is `https://fonts.googleapis.com` or `https://fonts.gstatic.com`; no `<video>`, `<audio>`, `<iframe>`, no external `<script>`.
11. `kpmg` (case-insensitive) appears nowhere in tracked source or output.
12. `.vercelignore` exists and lists `docs/`, `src/`, `scripts/`, `package.json`.
13. In `ar.html`, no digit run appears in a text node outside an element with class `num` (numerals are isolated).
14. Build idempotence: running `site:build` twice yields no diff.

## 9. Verification the builder runs and records

- **axe evidence rule (QA pass 2, 2026-09-02):** every axe run must be taken in the READING state — force every `.reveal` (and any other opacity-0 / lazy section) visible, or scroll them into view, before invoking axe; a run at page load skips 15 hidden sections and concealed a real AA failure. Guards must assert against the SOURCE intent (copy tables) rather than the artifact the build produced, so a build that silently reclassifies bad input cannot green its own check.

- Playwright: prefer `~/Downloads/haseeb-corporate/node_modules` (Playwright 1.59.1, Chromium installed); fallback `npx -y playwright@1.59.1` with `npx playwright install chromium`. Never skip silently.
- Render both pages at 320×568, 390×844, 768×1024, 1280×800, 1440×900: assert `document.documentElement.scrollWidth <= innerWidth`, zero console errors; screenshots to `docs/screenshots/HASEEB-4113/`.
- Checkpoint captures: `desktop-en.png` + `desktop-ar.png` (1440×900), `mobile-en.png` + `mobile-ar.png` (390×844 full page), `chatbot-open-en.png` + `chatbot-open-ar.png` (drawer with a transcript, 1440×900), `chatbot-empty-ar.png` (drawer just opened, empty state, 1440×900), plus the overflow matrix. The shelved-sequence captures (`desktop-en-hero.png`, `reduced-motion-en.png`, `storyboard.png`) were deleted on 2026-09-02.
- axe-core if present in that node_modules (`@axe-core/playwright`); otherwise record a manual landmark/heading/contrast check in the PR body.
- `node scripts/check.mjs` exit 0 and `site:build` idempotent, both recorded in the commit body.
