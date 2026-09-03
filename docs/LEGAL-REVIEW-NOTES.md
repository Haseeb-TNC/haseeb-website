# HASEEB-4113 — legal-page review notes (INTERNAL, never deployed)

These notes used to live as hidden HTML comments inside `privacy.html` and
`website-terms.html`. Round 7 (founder, 2026-09-03) forbids internal comments
in deployed HTML — `scripts/check.mjs` tripwire 19 now fails the build if any
of the four deployed pages contains `<!--` — so the text was moved here
verbatim and removed from the pages. Nothing was reworded on the way.

`docs/` is excluded from the deployment by `.vercelignore`.

---

## privacy.html — note of record (originally dated 2026-08-19)

> ⚠️ INTERNAL DEVELOPMENT NOTE — NOT VISITOR-FACING (2026-08-19).
> This document still REQUIRES PROFESSIONAL LEGAL REVIEW before
> publication and is not represented as satisfying Kuwaiti (or any
> other) legal requirements. The visible draft banner was removed by
> operator instruction 2026-08-19; this hidden note is its replacement
> and must not be deleted until legal review is complete.
> Scope: the public landing page only — NOT the Haseeb product. Limited
> to what this static page actually does: a mailto: application, email
> to founder@haseeb.app, and font loading — no cookies, no analytics,
> no tracking, no form endpoint. Names NO operating entity.
> 2026-09-02 (HASEEB-4113): restyled light; the §2 field list rewritten to
> the three fields the form now asks for; general contact moved to
> info@haseeb.app; Arabic back link added. Arabic legal text is NOT
> produced — this page is English only.

## website-terms.html — note of record (originally dated 2026-08-19)

> ⚠️ INTERNAL DEVELOPMENT NOTE — NOT VISITOR-FACING (2026-08-19).
> This document still REQUIRES PROFESSIONAL LEGAL REVIEW before
> publication and is not represented as satisfying Kuwaiti (or any
> other) legal requirements. The visible draft banner was removed by
> operator instruction 2026-08-19; this hidden note is its replacement
> and must not be deleted until legal review is complete.
> Scope: website terms only — NOT the Haseeb product Terms of Service.
> Deliberately names NO operating entity — none is incorporated yet.
> 2026-09-02 (HASEEB-4113): restyled light; general contact moved to
> info@haseeb.app; Arabic back link added. Arabic legal text is NOT
> produced — this page is English only.

---

## Still open

1. **Both documents still require professional legal review before
   publication.** Neither is represented as satisfying Kuwaiti, or any
   other, legal requirements. This is unchanged by round 7 and is the
   reason these notes exist at all.
2. **No operating entity is named** in either document, because none is
   incorporated yet. That is deliberate and must be revisited before launch.
3. **Arabic legal text is not produced.** Both pages are English only, and
   the Arabic pages link to them under a label that says so.

## Round 7 changes to `privacy.html` (2026-09-03, factual only)

- §2 “Website operation” gains a sentence about the opening animation: it
  records one value in `sessionStorage` so the animation plays once per
  visit, the value is not an identifier, it disappears when the tab closes,
  and it is not used for tracking. This is what `assets/site.js` actually
  does (`haseeb.film.v2`, set in a `try`/`catch`).
- §3 “How applications are handled” gains a sentence saying that
  applications sent by email arrive in a Haseeb mailbox and may be read by
  the Haseeb team while the founding cohort is being formed.
- “Last updated” moves from 2 September 2026 to 3 September 2026 on both
  legal pages.
