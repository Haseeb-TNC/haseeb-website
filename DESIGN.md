# Design System: Haseeb

Accounting for Kuwaiti service businesses. Haseeb prepares the entries from your bank statements; a person approves them. The site has to feel like a calm, exact ledger made in Kuwait, not a generic SaaS template and not a tourist poster.

Source of truth for every value below: the `:root` block in `css/site.css`, shared by `haseeb.html`, `ar.html`, the legal pages and `404.html`. Product facts the copy relies on live in `PRODUCT-NOTES.md`. If this file and the code disagree, the code wins. Update this file when you change a token.

## 1. Visual Theme & Atmosphere

- **White page, product as the picture.** Sections are plain white with no tinted bands and no divider rules between them. The "imagery" is the product itself: real-looking ledger screens with KWD amounts, Kuwaiti merchants (Zain, Alghanim, MEW, Talabat, PIFSS, Ooredoo, The Sultan Center) and NBK accounts.
- **One photo moment.** The hero is a full-bleed photo of a Gulf team at work, darkened with a gradient so white type sits on it. Every other section is drawn in HTML/SVG.
- **Local, not touristy.** The Gulf touch comes first from content and type: Arabic labels set beside English (and English beside Arabic on `ar.html`), Arabic bank descriptions, three-decimal KWD, KNET, PIFSS and MEW lines.
- **Two ornaments, used sparingly.** An eight-point khatam star lattice (`images/pattern-khatam.svg`) and an original Kuwait City skyline drawing (`images/kuwait-skyline.svg`: Kuwait Towers, Liberation Tower, Al Hamra, Arraya). Both are applied as CSS masks in gold or a faint white, never as full-strength wallpaper. They appear in exactly four places: the navy CTA band, the Kuwait-levies tile, the footer strip and the 404 page.
- **A warm frame.** Deep-navy ink and CTA band, sand for the announcement bar, insets and footer, gold only for ornament. The page itself stays white.
- **Quiet depth.** Hairline borders do the work; shadows only hint.
- **Motion explains the product.** GSAP scroll scenes show a bank line becoming an entry. Nothing moves for decoration only, and everything is still under `prefers-reduced-motion`.

Ideas borrowed (not copied) from the reference systems in the Awesome Design MD collection: Wise (plain-language money copy, status pills with a dot), Stripe (the product screen as the hero visual), Linear (border-first surfaces, restrained shadows), Vercel (one strict type scale and spacing scale), Claude (warm-tinted neutrals with a yellow-brown undertone, which became our sand).

## 2. Color Palette & Roles

### Brand
| Token | Light | Dark | Role |
|---|---|---|---|
| `--teal` | `#007A62` | `#3DD3B0` | Links, positive amounts, brand text |
| `--btn` / `--btn-h` | `#007A62` / `#006B56` | `#007A62` / `#008C70` | Primary button fill / hover |
| `--hl` | `#00A684` | `#00A684` | Focus ring, status dots, logo full stop |
| `--tint` / `--tint-b` | teal 8% / 22% | 14% / 32% | Success pill fill, highlighted card border |

### Gulf accents
| Token | Light | Dark | Role |
|---|---|---|---|
| `--navy` / `--dark-bg` | `#0B1E2D` | `#050E16` | CTA band, Kuwait-levies tile, 404, OG card |
| `--sand` / `--sand-line` | `#F3ECDD` / gold 18% | `#0D1A24` / gold 16% | Announcement bar, footer |
| `--gold` / `--gold-ink` | `#C8963A` / `#8A621A` | `#D9B25E` | Pattern and skyline masks, list diamonds. Never body text on white below `--gold-ink`. |

### Status (the product's three outcomes)
| Status | Dot | Pill |
|---|---|---|
| Ready to approve | `--hl` | `.pill.g` teal tint |
| Needs an answer | `--amber #D4A84B` (gold accent) | `.pill.a` |
| Held for review | `--red #FD361C` | `.pill.r` |

### Neutral
| Token | Light | Dark |
|---|---|---|
| `--bg` | `#FFFFFF` | `#08141D` |
| `--surface` | `#FFFFFF` | `#0E1C27` |
| `--alt` (insets only, never a section band) | `#F8F4EC` (warm sand) | `#0B1822` |
| `--ink` | `#0C1B27` (deep navy) | `#E8EDF1` |
| `--ink60` / `--ink40` | ink 60% / 58% | 64% / 60% |
| `--line` / `--line2` | ink 8% / 14% | white 8% / 16% |

The CTA band is the only dark block in light mode (`--dark-bg`). `<meta name="theme-color">` follows `--bg` and is synced by the theme toggle.

## 3. Typography Rules

### Families
- `--font-sans` DM Sans (opsz axis): everything.
- `--font-mono` DM Mono with `tnum`: amounts, dates, references, counts.
- `--font-ar` Noto Sans Arabic: every Arabic run, always with `lang="ar" dir="rtl"`. On `ar.html` it is the body font; Arabic headings drop the negative tracking (it breaks letter joining) and open the line height to 1.2–1.25.

### Scale
| Token | Size | Use |
|---|---|---|
| `--fs-display` | clamp(44, 5.6vw, 80) | Hero headline |
| `--fs-h1` | clamp(36, 4.6vw, 64) | CTA band headline, big figures |
| `--fs-h2` | clamp(28, 3vw, 40) | Section headings |
| `--fs-h3` | 24 | Card / form headings |
| `--fs-stat` | clamp(26, 2.4vw, 32) | Stat numbers |
| `--fs-xl` | clamp(18, 1.6vw, 22) | Sub-headings, KPI values |
| `--fs-lg` | 20 | Logo |
| `--fs-lead` | clamp(16, 1.3vw, 18) | Intro paragraphs |
| `--fs-base` | 16 | Body |
| `--fs-md` | 14 | UI text, buttons, inputs |
| `--fs-sm` / `--fs-xs` / `--fs-2xs` | 13 / 12 / 11 | Labels, table text, micro labels |

### Principles
- Weights: 400 body, 500 UI and labels, 600 headings, 700 only the logo and marks.
- Headings use tight negative tracking and `text-wrap: balance`; paragraphs `text-wrap: pretty`.
- No raw px sizes, family names or weight numbers in CSS rules. Use the tokens.
- KWD always shows three decimals (`-28.500`, `+4,200.000`).

## 4. Component Stylings

- **Buttons:** `.btn` 48px tall, radius 10, 600 weight. `.btn.p` teal fill, white text, 1px lift on hover. `.btn.s` surface fill + `--line2` border, border goes to ink on hover. `.btn.sm` 40px for the nav.
- **Pills:** 24px, fully round, 6px coloured dot + label. Only for the three statuses and small facts.
- **Cards / windows:** 1px `--line` border, radius 12, `--surface` fill, `--sh-card` hairline shadow. Product windows (`.win`) add a header row with the company mark (TC), name in English and Arabic, and a mono date.
- **Tables:** mono numbers right-aligned, uppercase `--fs-xs` column heads, hairline row dividers.
- **Navigation:** sticky, 68px, transparent over the hero photo and solid `--nav` with blur everywhere else. Mobile: burger opens a full-width list; Escape closes it and returns focus.
- **Forms:** labelled 46px inputs and selects (custom chevron, flips in RTL), teal border + 3px tint ring on focus, inline status line with `aria-live`, a plain note under the buttons explaining the mailto flow.
- **Bento (05 Full books):** five tiles for five facts, 6-column grid (4+2, then 2+2+2). One sand tile, one navy tile with the khatam pattern, three white. Collapses to 3+3 at 1080px and one column at 700px.
- **Approval ladder:** a 4-row list (amount in DM Mono, who approves, a pill). Real product defaults; only the Automatic row uses the teal pill.
- **Legal pages:** same nav and sand footer, a 760px reading column, verbatim legal text.

## 5. Layout Principles

- Container `.wrap`: max 1240px, 32px side padding (16px on phones).
- Spacing scale `--sp-1..8` = 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64. Section gap `--sec` = clamp(64px, 8vw, 104px), the same between every section.
- All section headings share one left edge.
- Radius scale: 8 (chips), 10 (buttons, inputs), 12 (cards), 999 (pills).

## 6. Depth & Elevation

- `--sh-card` / `--sh-tab` / `--sh-win`: hairline, 1–4px, ≤6% opacity. The border is the edge.
- `--sh-pop`: the only lifted shadow, for things that pop over a screen (the Haseeb note, toasts).
- No large soft drop shadows, no glassmorphism, no gradients on surfaces.

## 7. Do's and Don'ts

### Do
- Show the product doing real Kuwaiti work: NBK/KFH statements, KNET, PIFSS, MEW, Arabic descriptions.
- Keep the promise visible: "The engine proposes, a person approves." Say it accurately: the owner sets an automatic-posting limit; everything above it, or unclear, waits for a person.
- Pair English with short Arabic labels where it helps; set Arabic with `--font-ar`, `lang="ar"`, `dir="rtl"`.
- Use the three status colours only for the three statuses.

### Don't
- No tinted section bands or rules between sections.
- No accuracy percentages, no pricing, no em dashes in new copy.
- No invented compliance or legal claims. Banks named: NBK, CBK, Boubyan, KFH (the product's seeded statement layouts). Kuwait has no VAT: never imply VAT handling. E-invoicing is "coming soon".
- No full-strength pattern wallpaper, camels, dhows or postcard skylines. The khatam and skyline masks stay faint and stay in their four places.
- Don't flip the skyline in RTL (it is a real place). Do mirror the hero photo and its shade so the copy never covers the people.
- No stacking-card or side-sliding carousel for 01–03; it is a pinned crossfade.

## 8. Responsive Behavior

| Breakpoint | Behavior |
|---|---|
| ≥ 861px + fine pointer | 01–03 pin under the nav as one scrubbed crossfade with a progress bar |
| ≤ 1200 / 1080px | Hero copy narrows to half width over a stronger shade; two-column sections tighten |
| ≤ 860px (or touch) | Nav collapses to burger; 01–03 stack as normal sections |
| ≤ 640px | Single column, 16px gutter, hero copy at the bottom of the photo, sticky "Join the founding cohort" bar |

Reduced motion: no pin, no scroll scenes, all content visible.

### Right to left (`ar.html`)
- Built from `haseeb.html` by a translation script; layout uses logical properties, so most rules need no RTL twin. The `[dir="rtl"]` block at the end of `css/site.css` holds the rest.
- Amounts stay Western digits, LTR-isolated (`.mono`), so `-28.500` never becomes `28.500-`. Mono spans that hold Arabic words (dates, `د.ك`) carry `dir="rtl"` and switch to Noto Sans Arabic.
- Merchant names and raw statement lines stay as they appear on Kuwaiti statements (mostly Latin). Categories, statuses and UI are Arabic.
- KWD is written `د.ك` after the number.

## 9. Agent Prompt Guide

### Quick reference
- Page `#FFFFFF`, ink `#0C1B27`, navy `#0B1E2D`, sand `#F3ECDD`, brand teal `#007A62`, focus `#00A684`, status gold `#D4A84B`, ornament gold `#C8963A`, red `#FD361C`.
- DM Sans / DM Mono / Noto Sans Arabic. Section h2 = `--fs-h2`, 600, tight tracking.

### Example prompt
"Add a section in the Haseeb style: white background, h2 at `--fs-h2` aligned with the other section headings, one product window card (1px `--line` border, radius 12) showing three NBK statement lines in DM Mono with three-decimal KWD, each tagged with a status pill. No shadow beyond `--sh-card`, no tinted band."

### Iteration checklist
1. Tokens only, no raw values.
2. Check at 1440×900, 1366×768 and 390×844.
3. Check light and dark themes, and `ar.html` (RTL) at the same sizes.
4. Check with reduced motion.
