# HASEEB-4113 — Opening film: three concepts (concept round, 2026-09-02)

Founder correction (2026-09-02): the opening is a brand film, not a product demo.
No product UI, accounting steps, journal entries, dashboards or transaction
cards in the opening. Big minimal typography + cinematic or abstract moments
about running a business in Kuwait; confident and human; light identity with
teal accent; grammar borrowed from the reference only: bold statement → visual
tension → curiosity → brand reveal → hero with “Haseeb is built for Kuwaiti
businesses.” No reference footage, wording or branding. The product-UI hero
sequence built in `cc186c2` is SHELVED (kept in history, not deployed, not
polished further). The chatbot is separate: a popup that faithfully recreates
Haseeb's in-app accounting-conversation interface in Arabic.

## Shared rules (all concepts)

- ~9–10 s, four beats + 1 s hand-off into the hero; hero text never moves.
- Type: DM Sans 600 (EN) / Noto Sans Arabic 700 (AR), two to three words per line, very large. EN page plays EN hooks; AR page plays AR hooks. Wordmark stays Latin.
- Motion grammar: expand to full frame → contract to a small window → slide aside → reveal. Transform/opacity only.
- Palette: warm white ground (#F8F6F2), ink #1A1F26, teal #00A684 as one accent per beat and at the reveal. Footage graded light and natural.
- Visitor respect: visible “Skip” from frame 1; plays once per session (sessionStorage); no audio; `prefers-reduced-motion`, viewports < 720px and `navigator.connection.saveData` go straight to the hero with a still poster; page content is in the DOM and readable underneath from frame 1.
- Honesty: no numbers/statistics in the film; no claim beyond approved page copy; faces only with releases.

## Concept 1 — “Kuwait doesn't wait” (documentary footage) — RECOMMENDED if a shoot is possible

Hooks: EN “Kuwait doesn't wait.” / “Neither should your books.” / “Accounting that moves with you.” · AR “الكويت ما تنطر.” / “ولا دفاترك.” / “محاسبة تمشي معك.” (standard-register alternative: “الكويت لا تنتظر.” / “ولا دفاترك.” / “محاسبة تواكبك.”). Reveal: HASEEB. · locked line.

| t (s) | Beat | Visual | Motion |
|---|---|---|---|
| 0.0–1.2 | open | A shutter rolls up at Mubarakiya at dawn, tight crop | slow push-in; Skip visible |
| 1.2–2.6 | statement | “Kuwait doesn't wait.” over the clip | clip expands to full bleed; line lands in two beats |
| 2.6–4.2 | reveal ×3 | KNET tap at a counter · van loading in Shuwaikh · office lift doors | contract to window, slide aside, three quick reveals |
| 4.2–5.8 | tension | a ledger still on a desk while the city keeps moving in the small window; “Neither should your books.” | hold |
| 5.8–7.4 | curiosity | clean warm white; “Accounting that moves with you.”; teal line draws under | ledger contracts and slides away |
| 7.4–8.8 | reveal | HASEEB. scales in from the teal line | scale + settle |
| 8.8–10 | hand-off | wordmark into nav; hero + locked line fade in | page at rest |

Source: preferred = commissioned half-day shoot in Kuwait (8–12 clips, 4K, releases; shot list above; delivered 1280-wide H.264 + WebM ≈ 3 MB, muted). Fallback = licensed stock filtered to Kuwait (Shutterstock/Getty/Storyblocks); Pexels/Unsplash thin at counter level; reject anything that reads as Dubai. Not used: AI-generated video. Cost: 1–2 weeks; site can ship with Concept 2 and swap.

## Concept 2 — “Every morning, Kuwait gets to work” (typographic + abstract, no footage) — SHIPS TODAY

Hooks: EN “Every morning, Kuwait gets to work.” / “Every evening, the books fall behind.” / “Not any more.” · AR “كل صباح، الكويت تشتغل.” / “وكل مساء، الدفاتر تتأخر.” / “ليس بعد اليوم.” (spoken alt: “مو بعد اليوم.”). Tile captions (evocative, never statistical): مخبز في السالمية · عيادة في حولي · مقاول في الشويخ.

| t (s) | Beat | Visual | Motion |
|---|---|---|---|
| 0.0–1.0 | dawn | warm white, thin teal horizon, pale amber glow rises | gradient settles; Skip visible |
| 1.0–2.4 | statement | line set huge across two rows; first tiles light teal along the horizon | type lands |
| 2.4–4.0 | reveal | tiles light up in the shape of the country with three captions | type contracts to window, slides aside |
| 4.0–5.6 | tension | field dims to evening, one tile flickers; “Every evening, the books fall behind.” arrives word by word, late on purpose | lag = meaning |
| 5.6–7.0 | curiosity | a teal pulse runs the horizon and relights every tile at once; “Not any more.” | pulse |
| 7.0–8.4 | reveal | the horizon becomes the wordmark's underline; HASEEB. | scale + settle |
| 8.4–9.5 | hand-off | wordmark into nav; hero + locked line | page at rest |

Source: generated in-browser (Canvas + CSS), no footage, no licence, ≈60 KB, bilingual by construction. Trade-off: less human; one or two real stills can be layered in later. Cost: build time only.

## Concept 3 — “Business in Kuwait is personal” (photographic stills, hands at work)

Hooks: EN “Business in Kuwait is personal.” / “Your accounting shouldn't be a stranger.” / “Accounting that knows your business.” · AR “التجارة في الكويت شخصية.” / “ولا ينبغي أن تكون محاسبتك غريبة عنك.” (spoken alt: “ومحاسبتك ما لازم تكون غريبة عنك.”) / “محاسبة تعرف شغلك.”

| t (s) | Beat | Visual | Motion |
|---|---|---|---|
| 0.0–1.2 | open | hands kneading dough, warm light | slow push-in; Skip visible |
| 1.2–2.6 | statement | still expands to full bleed; line in the negative space | expand |
| 2.6–4.2 | reveal ×3 | hand holding out a KNET terminal · a dishdasha cuff signing a delivery note · coffee passed across a desk | contract, slide, reveals |
| 4.2–5.8 | tension | a cold grey spreadsheet fills the frame; “Your accounting shouldn't be a stranger.” | hold |
| 5.8–7.4 | curiosity | warm still of a phone in hand with a plain-language question typed; “Accounting that knows your business.” | spreadsheet contracts and slides away |
| 7.4–8.8 | reveal | HASEEB. on warm white with a teal underline | scale + settle |
| 8.8–10 | hand-off | wordmark into nav; hero + locked line | page at rest |

Source: preferred = one-day stills shoot in Kuwait (20–30 frames, releases; WebP ≈150 KB each, opening < 1 MB). Fallback = licensed stills (Unsplash/Pexels free; Getty/Stocksy paid) with Kuwait carried by props in frame (KNET terminal, dishdasha cuff, dinar notes, Arabic signage). Stills double as reduced-motion posters. Cost: 2–5 days licensed, ~1 week shot.

## Recommendation

Concept 1 if a half-day shoot can be commissioned within two weeks; otherwise Concept 2. Pairing is valid: ship 2 now, upgrade to 1 when footage lands. Decisions owed by the founder: concept (or pairing), Arabic register for the hooks (spoken touches vs standard throughout), whether a shoot can be commissioned.
