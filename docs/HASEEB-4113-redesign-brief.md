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
4. Main headline unchanged. Options (EN + AR) are in `_headlineOptions` for Tarek; none ships without his line. The Arabic H1 is a translation of the current headline and is itself shown at the checkpoint.
5. Sections removed entirely: “Intelligent accounting will become normal” and “Better information. Faster accounting. Less routine work”. Also removed: the announcement bar, the large conversation section, the Owner-Today frame in “How it works”, the statement-import frame in “Kuwait”, three form fields.
6. PREPARES / ASKS / HOLDS kept, presented as three simple cards.
7. Zero “Aminah” anywhere in the repo's public output AND source: text, frames, class names, comments, JSON keys, alt text, metadata, accessibility text. No replacement character brand.
8. Large embedded conversation section replaced by a compact floating chatbot: launcher “تكلّم مع محاسبك كما تتكلّم مع أي شخص”, dialog titled Haseeb / حسيب with a visible “Guided demo” tag on the launcher and badge in the dialog. (“المحاسب” remains an option for the AR title if Tarek prefers; parity with EN is why “حسيب” ships.)
9. Cohort form = Name / Phone number / Email (الاسم / رقم الهاتف / البريد الإلكتروني). Existing mailto behaviour preserved; nothing stored; no network call.
10. info@haseeb.app present and linked as the general contact (footer + legal pages).
11. Simpler nav, copy and density. One primary action: “Join the founding cohort”. The demo is reached by a text link in the Ask band and by the launcher; nav shows the primary button on desktop only; mobile keeps the sticky bar as its one button.
12. Hero motion: original 10–12 s sequence on genuine product UI; borrows only the expand → contract → slide → reveal principle. **No KPMG footage, colours, typography, slogans or assets; no reference to KPMG anywhere in source or output.** Pause/play, reduced-motion fallback, static mobile fallback, no audio, no video, no library.
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
    site.js                   hero sequence, chatbot, form, nav; no network calls
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
--text-3:        #697180
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
z-index:         nav 50 · sticky mobile CTA 60 · chatbot launcher 70 · chatbot dialog 80
```

Type: body 17px/1.65; H1 clamp(36px, 5vw, 60px) weight 600; H2 clamp(28px,
3.4vw, 40px). Arabic: same sizes, letter-spacing 0, body line-height 1.8,
headings 1.3. Numbers and KWD amounts in DM Mono, LTR-isolated, Western
digits, 3 decimals. Section padding 96px desktop / 64px mobile.

## 4. Page / section map (revised)

| # | Section (id) | Purpose | Content | Change vs live |
|---|---|---|---|---|
| 0 | Nav | Orientation | Wordmark · How it works · Kuwait · Founding cohort · **English / العربية** · primary button (desktop) | 5 links → 3 + language switch; announcement bar removed |
| 1 | Hero (`#top`) | The one message + one action | H1 (unchanged) · supporting line (locked) · one sentence · primary CTA · secondary text link · cohort fact line · **hero sequence** with its own pause/play | Adds the sequence; light |
| 2 | How it works (`#how`) | PREPARES / ASKS / HOLDS | H2 + one intro sentence + three cards (label, product status pill, one example row, two sentences) + closing line | Merges live `#how` + `#why`; drops the large Owner-Today frame |
| 3 | Ask (`#ask`) | Plain-language questions | Eyebrow + H2 + one sentence + text link “Try the guided demo →” (opens the chatbot) | Replaces the large conversation section |
| 4 | Kuwait (`#kuwait`) | Local fit | Eyebrow + H2 + one sentence + four chips | Drops the statement-import frame (now stages 1–2 of the sequence) |
| 5 | Founding cohort (`#cohort`, form `#apply`) | Application | H2 + one sentence + three bullets · form card: Name / Phone / Email · submit · small “Speak with the founder” text link | 6 fields → 3; mailto preserved |
| 6 | Footer | Legal + contact + language | Wordmark · Website Terms · Privacy Policy · **info@haseeb.app** · English / العربية · © | Adds info@, real language switch |
| — | Floating chatbot | Compact demo | Launcher pill with “Guided demo” tag (bottom inline-end; icon-only on mobile, above the sticky bar) → dialog “Haseeb / حسيب” · badge · intro · 3 question chips · scripted answers · “Ask another question” · close | New; no free-text field |
| — | Mobile sticky CTA | One action | “Join the cohort →” after the hero, hidden while the chatbot dialog is open | Kept |

Section id set on both pages, exactly: `top`, `how`, `ask`, `kuwait`, `cohort` (form `#apply` inside `#cohort`).

## 5. Copy of record

`src/copy/en.json` and `src/copy/ar.json`. Notes for the builder:
- Both files must keep identical key sets. `_headlineOptions` is NOT rendered.
- `hero.support` is locked verbatim in both languages. `bot.launcher` is the founder's text.
- Two live claims were deliberately removed as broader than v8 evidence: “and invoices” (ingestion) and “in Arabic or English” (bilingual answers). Do not reintroduce them.
- The chat demo's example customer is the fictional “Example Trading Co. W.L.L. / شركة مثال للتجارة ذ.م.م” (the live page named a real Kuwaiti company; the v6 rule forbids that). Tarek may choose another fictional name at the checkpoint.
- Product vocabulary reused verbatim: EN “Ready to approve / Needs an answer / Held for review”, “Taskbox · N open”, “Write a reply...”, “Reply”, “Approve”; AR “جاهزة للاعتماد” (`rbeBatchReview.json`), “بحاجة إلى إجابة” (`migration-workspace.json`), “موقوف” (`migration.json`), “صندوق المهام” (`taskbox.json`).
- Mailto: subject from `form.mailSubject` with `{name}` substituted; body = `form.mailHeading`, a dashed line, `Name: …`, `Phone: …`, `Email: …` (labels from `form.name/phone/email`), blank line, `form.mailtoTrailer`. Target `mailto:founder@haseeb.app`. Founder link subject from `form.founderSubject`. No `action` attribute, no fetch/XHR/beacon anywhere in `site.js`.

## 6. Hero sequence storyboard (≈12 s, loops; the motion principle only)

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
- Full keyboard: nav (including a mobile menu button labelled `nav.menu`), language switch, CTAs, form, chatbot (focus trap in the dialog, Esc closes, focus returns to the launcher), pause/play.
- Landmarks: one `<main>`, `<nav aria-label>`, `<footer>`; heading order h1 → h2 → h3.
- Stage: `role="img"` + `aria-label` = `seq.srDescription`; inner frames `aria-hidden="true"`; captions are visible text outside the `role="img"` element.
- Chatbot: `role="dialog" aria-modal="true" aria-labelledby`; launcher `aria-expanded` + `aria-controls`; answers announced via an `aria-live="polite"` region; the sticky mobile CTA is hidden while the dialog is open.
- RTL: CSS logical properties only (`margin-inline-*`, `inset-inline-*`, `padding-inline-*`, `text-align: start`); no `left/right` in layout rules; directional arrows mirror via `[dir=rtl]`; phone/email inputs `dir="ltr"` with `text-align: start`; numerals LTR-isolated (§2).
- Language switch: visible in nav and footer on both pages; preserves the current section anchor (`/ar#how` ↔ `/#how`); `hreflang` + canonical (§2).
- Form: exactly three inputs (`type=text|tel|email`, `autocomplete` name/tel/email, `required`), labels bound, inline errors with `aria-describedby`, `role="status"` region for the summary.
- Mobile stacking: launcher icon-only, positioned above the sticky bar (`inset-block-end` = bar height + 12px); z-index per §3.

## 8. Definition-of-done tripwires (`scripts/check.mjs`, exit 1 on any failure)

1. **No assistant brand anywhere:** every tracked file under `src/`, `assets/`, `scripts/` plus the four built pages, `vercel.json`, `.vercelignore`, `package.json` (same file set as tripwire 11) has zero case-insensitive matches of `amin[ae]h?|ameena|أمينة|امينة`.
2. `en.json` and `ar.json` have identical key sets (deep) and no empty string values.
3. Built pages (WHOLE file, head included, no carve-outs) contain none of the removed-section copy: “will become normal”, “put it to work first”, “catches up”, “Better information. Faster accounting”, “more value from the accounting”, “Intelligent accounting”; and each page's `<section id>` set is exactly `top, how, ask, kuwait, cohort`. (Ruling 2026-09-02: “Founding cohort now forming” was the announcement BAR, not a removed section; it stays in `meta.description` only and must not appear in the body — assert that separately.)
4. Each built page: `#cohortForm` has exactly three `<input>` (types text, tel, email), no `<select>`, no `<textarea>`, no `action` attribute; `assets/site.js` contains no `fetch(`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`; `mailto:founder@haseeb.app` present.
5. Each built page contains `mailto:info@haseeb.app`, `website-terms.html`, `privacy.html`; both legal pages contain `mailto:info@haseeb.app` and the AR back link.
6. `ar.html` has `lang="ar" dir="rtl"`; `haseeb.html` has `lang="en"` and no `dir="rtl"`; both have `rel="canonical"` and three absolute `hreflang` links.
7. The `.hero-support` element (not the whole file) contains the locked supporting line verbatim on both pages.
8. Both pages contain the pause/play control (`aria-pressed`) and `assets/site.css` contains a `prefers-reduced-motion: reduce` rule.
9. Light-first: no `data-theme="dark"`, no `#0B0F14`/`#0b0f14` in any of the four pages or `site.css`.
10. External hosts: every `src`/`href` with a scheme is `https://fonts.googleapis.com` or `https://fonts.gstatic.com`; no `<video>`, `<audio>`, `<iframe>`, no external `<script>`.
11. `kpmg` (case-insensitive) appears nowhere in tracked source or output.
12. `.vercelignore` exists and lists `docs/`, `src/`, `scripts/`, `package.json`.
13. In `ar.html`, no digit run appears in a text node outside an element with class `num` (numerals are isolated).
14. Build idempotence: running `site:build` twice yields no diff.

## 9. Verification the builder runs and records

- Playwright: prefer `~/Downloads/haseeb-corporate/node_modules` (Playwright 1.59.1, Chromium installed); fallback `npx -y playwright@1.59.1` with `npx playwright install chromium`. Never skip silently.
- Render both pages at 390×844, 768×1024, 1280×800, 1440×900: assert `document.documentElement.scrollWidth <= innerWidth`, zero console errors; screenshots to `docs/screenshots/HASEEB-4113/`.
- Checkpoint captures: `desktop-en-hero.png` (1440×900, sequence paused at stage 2), `mobile-ar.png` (390×844 full page), `chatbot-open-ar.png` + `chatbot-open-en.png` (1440×900), `reduced-motion-en.png`, `storyboard.png` (five beats side by side), `mobile-en.png`, `desktop-ar.png`.
- axe-core if present in that node_modules (`@axe-core/playwright`); otherwise record a manual landmark/heading/contrast check in the PR body.
- `node scripts/check.mjs` exit 0 and `site:build` idempotent, both recorded in the commit body.
