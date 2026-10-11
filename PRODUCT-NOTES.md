# Product notes: what Haseeb really does

Source of truth for website copy. Read-only survey of the product code at `D:\Projects\NowCompany\Haseeb` (frontend `haseeb-corporate/src`, API `haseeb-corporate-api/Hasseb_Standalone_Api/src`) on 2026-10-11. **If the site and this file disagree, this file wins; if this file and the product disagree, the product wins.** Update it when the product changes.

## Who it is for
- Bookkeeping and accounting for Kuwaiti small and mid-sized businesses ("AI-native bookkeeping for Gulf SMEs ... Kuwait first"). Built by **Aljasem Financial Technology (The Now Company), Kuwait** (API `CLAUDE.md`).
- Access is invitation-only while a **founding cohort** is onboarded (`en/auth.json:140`). The site's "8–12 Kuwaiti service businesses" figure comes from the original site, not the product.
- Three role views in the app: Owner, CFO, Junior. Account roles: Owner, Accountant, Viewer, Auditor.

## Core loop (what the site leads with)
- **Upload a bank statement.** Seeded layouts for **NBK, CBK, Boubyan and KFH** (KIB and Burgan deferred). Also MT940, camt.053, OFX and CSV/Excel; unknown CSV layouts get a header-mapping assist.
- **The engine proposes, a person approves.** Every line is categorised from rules, verified merchant patterns and learned answers. The AI never writes to the ledger on its own: a person confirms every AI-to-ledger path.
- **Approval policy by amount** (owner-only setting). Defaults: automatic posting up to 1,000.000 KWD (only high-confidence entries), reviewer approval up to 25,000.000, CFO approval up to 100,000.000, board approval above. So "nothing is ever posted without you" is NOT accurate; "you set what posts on its own and what waits for you" is.
- **Held for review, not posted** when information is missing. Questions about unknown merchants are asked once and remembered.
- **Settlements recognised:** KNET, Talabat, Deliveroo, MyFatoorah, Tap, Benefit. With the platform's settlement report, the entry splits sales, commission and fees; from the bank line alone the gross is unknown and the line goes to review.
- **Payroll and PIFSS** matching; PIFSS payments settle what payroll owes.
- **Aminah** is the assistant's name in the product ("Ask Aminah", "Aminah can make mistakes. Always verify critical numbers."). Answers questions about the books in English or Arabic.

## Everything else in the product
- Books: journal entries (templates, recurring), chart of accounts (bilingual names), customers and invoices, vendors and bills, payment vouchers, purchase orders, petty cash, fixed assets, inventory count, cheque register, letters of credit, Islamic finance.
- Close and planning: month-end and year-end close, budgets.
- Reports: income statement, balance sheet, cash flow, changes in equity, trial balance, general ledger, aging, management report, board pack. Export to Excel, CSV and print.
- Kuwait compliance: KFAS, NLST, Zakat and CIT (the "four levies"), statutory reserve, PIFSS, compliance calendar.
- Multi-currency with CBK reference rates (entered manually today) and FX revaluation. Base currency KWD, always 3 decimals. Accrual basis only.
- Moving in: imports from QuickBooks, Zoho and Odoo; opening balances import.
- Security: activity log, audit trail with an integrity chain, two-factor sign-in, active sessions.

## Language
- Full Arabic interface with right-to-left layout (same ~90 translation files in `en` and `ar`), Noto Sans Arabic. Arabic text in bank descriptions is tolerated by the matchers; keep claims modest.

## Tax
- **Kuwait has no VAT** and the product does not add VAT to Kuwaiti companies. Never claim VAT handling.
- **E-invoicing: coming soon** (API returns 501). Forecast and variance analysis are also "coming soon". Don't claim them as live.

## Pricing
- No prices in the product (billing screen is a placeholder). Internal price ideas are not approved. **Publish no prices.**

## Contact and legal facts (keep exactly)
- Email: founder@haseeb.app (the only contact). Product app: app.haseeb.app. Site: haseeb.app.
- Wordmark: HASEEB with a teal full stop. Arabic name: حسيب.
- Legal pages: Privacy Policy and Website Terms, both "Last updated 19 August 2026". Their wording is not changed by the redesign.
- No street address or phone number exists anywhere. Do not invent one.

## Old site vs product: mismatches found
| Old / in-progress site said | Product reality | Fixed on the site |
|---|---|---|
| "Nothing is posted without your approval" (meta) | Auto-posting up to an owner-set limit is the default | Reworded around the approval policy |
| Assistant called "Haseeb" (redesign) | Assistant is **Aminah** | Uses Aminah, "the assistant inside Haseeb" |
| Only NBK and KFH named | NBK, CBK, Boubyan, KFH layouts | All four named |
| "KNET fees split out", "Talabat gross and commission separated" from the bank line | Split needs the settlement report | Says so |
| "KFAS, NLST and Zakat" | Also CIT, PIFSS, statutory reserve | Added |
| Site described only statement prep | Full ledger, AR/AP, payroll, reports, close, imports, Arabic UI | New "the rest of your books" section |
| "العربية — soon" | Product is fully bilingual | Arabic site added |
| Form: name, company, contact only | Privacy Policy says the form asks role, business type and accounting setup too, and explains the mailto flow | Fields and notice restored |

## Still to confirm (not verifiable from code)
- "8–12 Kuwaiti service businesses" cohort size and "within minutes" timing.
- "Needs an answer" is a site label; the product's own wording is "Needs your judgment" / "Awaiting your review". Kept as the plain-language summary.
- Whether to name the operating company on the site. The API docs say Aljasem Financial Technology (The Now Company), but the legal pages carry an internal note that they deliberately name no entity until legal review, so the site doesn't either.
- Source and licence of `images/hero-team*.jpg` and the photo inside `images/og-haseeb.jpg` (not recorded anywhere).
- Batch review runs in "shadow mode" per company, and one known issue (HASEEB-4778) still auto-posts on bulk upload. The site shows the intended flow.
