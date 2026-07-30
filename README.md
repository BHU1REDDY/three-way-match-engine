# Three-Way Match Engine

Full-stack app that lets a user upload Purchase Order (PO), Goods Receipt Note (GRN), and Invoice
documents, extracts structured data via the Gemini API, resolves line items against a SKU Master
catalogue, stores everything in MongoDB, and computes a three-way match with reason codes.

- **Backend**: Node.js, Express, MongoDB (Mongoose), Gemini API
- **Frontend**: Next.js (App Router), Tailwind CSS, TanStack Query
- **Auth**: static-credential login that returns a signed JWT Bearer token

## Setup & run

Prerequisites: Node.js 20+, MongoDB running locally (or an Atlas URI).

### Backend

```bash
cd backend
npm install
cp .env.example .env      # edit if needed (see "Gemini config" below)
npm run seed              # seeds SkuMaster records used by the mock-Gemini fixtures
npm run dev                # http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local # NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev                # http://localhost:3000
```

Log in with the demo credentials in `backend/.env` (`admin` / `admin123` by default).

## Gemini config

The parsing pipeline calls Gemini through `backend/src/services/gemini.js`. Until a real API key
is supplied, the app runs against **mock-Gemini fixtures** (`backend/src/fixtures/*.fixture.js`) so
every other part of the system (master resolution, matching, duplication, the whole UI) is fully
testable offline:

- `MOCK_GEMINI=true` in `.env` forces the mock path.
- If `GEMINI_API_KEY` is empty, the mock path is used automatically even if `MOCK_GEMINI` is unset.
- To use the real API: set `GEMINI_API_KEY` and `MOCK_GEMINI=false` in `backend/.env`, restart the
  backend. `GEMINI_MODEL` defaults to `gemini-2.0-flash`.

The mock fixtures are **not arbitrary** - they're transcribed from the assignment's actual sample
PO/GRN/Invoice PDFs (`CI4PO05788` / M/s AFP → Cloudstore Retail), including the real partial
delivery on two line items, so the demo data exercises genuine matching logic rather than
hand-picked happy-path numbers. Two additional real-data quirks were replicated on purpose:

- **Item 33387** (Frozen Chicken Chilli Salami) has no seeded `SkuMaster` in `seed.js` by default,
  so it starts as `unmapped_master_sku`. Creating a `SkuMaster` with `skuErpCode: "33387"` (or
  `eanCode: "FG-P-F-0234"`) through the SKU Master screen and reloading the PO's Purchase Order tab
  demonstrates the spec's "recomputed match should pick it up" requirement live, with no
  re-upload needed.
- **Item 253430** and **398656** have deliberately off-market `agreedRate`/`mrp` in `seed.js` to
  exercise `price_mismatch` and `mrp_mismatch` without needing a second invoice.

Sample outputs (parsed JSON, a `/match` result, a `/summary` result) are checked in under
`docs/samples/`. A Postman collection is at `docs/postman_collection.json`. UI screenshots are
under `docs/screenshots/`.

## Data model

- **SkuMaster** - `skuErpCode` (unique), `name`, `eanCode`, `hsnCode`, `uom`, `agreedRate`, `mrp`,
  `priceTolerance`.
- **PurchaseOrder / Grn / Invoice** - each stores its own header fields, `items[]`, the raw file
  metadata, and `rawParsed` (the untouched Gemini/mock output, kept for debugging). `poNumber` is a
  plain indexed string on all three - not a foreign key - so any document type can be persisted
  before the others exist.
- **MatchAudit** - one document per `poNumber`, appended to on every upload with a `steps[]` log
  (`{ step, status, message, at }`) covering extract → validate → resolve_masters → persist →
  duplicate_check.

## Parsing flow

`backend/src/services/parsingPipeline.js` runs as a plain sequence of functions (no
engine/plugin abstraction, per the assignment's scope guidance):

1. **Extract** - `services/extraction.js` picks real Gemini or the mock fixture based on env, using
   a document-type-specific prompt (`prompts/documentPrompts.js`) that pins the exact JSON schema.
   On malformed JSON, `gemini.js` retries once with a clarifying instruction before giving up.
2. **Validate** - `services/validateExtracted.js` checks the minimum required fields from the spec
   table and throws a 422 (nothing persisted) on failure. Gemini output is treated as untrusted
   input throughout.
3. **Resolve masters** - `services/masterResolution.js` looks up each item's `itemCode` against
   `SkuMaster.skuErpCode`, then `eanCode`, trimmed and case-insensitive. Unresolved items are kept
   with `unmappedReason: "unmapped_master_sku"` - never dropped.
4. **Persist** - saved to the right collection (`PurchaseOrder`/`Grn`/`Invoice`) regardless of
   whether a matching PO already exists for that `poNumber`.
5. **Duplicate check** - runs right after persistence (see below).
6. **Audit** - a `MatchAudit` row is appended summarizing every step above.

## Master resolution & matching-key rationale

The matching key for every line item is the resolved `SkuMaster._id` when available, falling back
to the normalized raw `itemCode` when a SKU can't be resolved (per spec). This is what lets a PO
line coded `11423` and an Invoice line coded `FG-P-F-0503` for the same physical product be
recognized as the same item: `SkuMaster.eanCode` is used as the vendor's alternate code specifically
to bridge cases like the real sample documents here, where the Invoice's own internal item code
(`FG-*`) doesn't match the PO/GRN's numeric code at all. This is a deliberate, spec-sanctioned use
of `eanCode` as "alternate lookup key," not a hack - see the note above about item 33387 for how to
observe this resolution happening live.

**Important:** master resolution is **re-run live on every `/match` and `/summary` call**
(`matchEngine.js` calls `masterResolution.buildSkuIndex`/`resolveItemCode` fresh each time), not
read from the `skuMaster` field frozen on each document at upload time. That stored field is kept
only as a per-document historical snapshot (visible in the Fulfillment/Delivery tabs' item tables).
This is what makes "the missing SKU Master record is created later, a recomputed match should pick
it up" actually true, rather than only true for documents uploaded after the SKU was added.

## Matching logic

`backend/src/services/matchEngine.js` groups every PO/GRN/Invoice line by matching key, sums
quantities per key per document (handles the same SKU appearing on multiple lines), and applies the
full rule table from the spec (`grn_qty_exceeds_po_qty`, `invoice_qty_exceeds_grn_qty`,
`invoice_qty_exceeds_po_qty`, `invoice_date_after_po_date`, `duplicate_po`, `duplicate_document`,
`item_missing_in_po`, `price_mismatch`, `mrp_mismatch`, `unmapped_master_sku`). Missing/zero
`agreedRate` or `mrp` never produces a mismatch and never divides by zero (explicitly guarded).
Status ladder: `insufficient_documents` (any of PO/GRN/Invoice missing entirely - **not** treated as
zero quantity) → `mismatch` (any hard violation) → `partially_matched` (soft warnings, or quantities
not fully reconciled) → `matched`. `GET /match/:poNumber` always recomputes from whatever is
currently stored - never cached.

## Out-of-order handling

Every document type is validated and persisted independently the moment it's uploaded, keyed by the
`poNumber` string parsed from that document - never a foreign key to an existing PO. Uploading an
Invoice before its PO exists succeeds and returns `insufficient_documents` from `/match` until the
PO (and a GRN) arrive; nothing is rejected or held back. This was verified manually by uploading
Invoice → PO → GRN in that order against the sample documents.

## Duplicate handling

Right after persistence, `runDuplicationCheck` in `parsingPipeline.js` looks for another document of
the same type/number combination:

- A second PO for a `poNumber` that already has one → `duplicate_po`. Both PO documents are stored
  (never overwritten); `linkedDocs.po` in the match result is an array, and the earliest-created one
  is treated as canonical for PO-quantity comparisons while the conflict is surfaced via the
  `duplicate_po` reason code.
- A second GRN/Invoice reusing a `grnNumber`/`invoiceNumber` under the same `poNumber` →
  `duplicate_document`.

Both are hard violations (`mismatch` status) since a duplicate is a genuine data-integrity signal
that needs a human to look at it, not something the engine should quietly resolve.

## Frontend architecture & state management

Next.js App Router, all data-bearing screens are Client Components using **TanStack Query**
(`frontend/src/lib/queries.ts`) - chosen over Redux Toolkit because almost everything in this app
(documents, match, summary, SKU masters) is server state with a natural cache-invalidation story
(upload → invalidate `documents`/`match`/`summary` for that `poNumber`), which is exactly what
TanStack Query is for; a Redux store would mostly be re-implementing a cache TanStack Query gives
for free. The only client-only UI state (active tab, active GRN/Invoice sub-tab, upload modal open,
preview zoom) lives in a small React Context (`lib/uiContext.tsx`), per the assignment's suggested
split.

Other notable pieces:
- `lib/apiClient.ts` - fetch wrapper attaching `Authorization: Bearer <token>` to every request.
- `lib/authContext.tsx` - token persisted in `localStorage`; `(protected)/layout.tsx` redirects to
  `/login` when absent.
- `lib/useFilePreview.ts` - `<iframe>`/`<img>` can't send auth headers, so the original file is
  fetched as a blob with the Bearer token and handed to the preview as an object URL.
- Component layout mirrors the reference screenshots: left icon rail (`AppShell`), top tabs with
  count badges (`TopTabs`), one sub-tab pill per GRN/Invoice (`SubTabPills`), a bordered/accented
  form panel + file preview + full-width item grid per document tab, and a Summary tab with stat
  cards + the cumulative Associated Invoice & GRN table.

## Assumptions & tradeoffs

- PO/GRN line items don't carry a price in the minimal extraction schema (per spec), so the
  Summary tab's **PO Amount** and **Total Received** stat cards are valued at the resolved
  `SkuMaster.agreedRate` (0 when unresolved); **Total Invoiced** uses the Invoice's own billed
  `unitRate`, the one real monetary figure the documents actually carry. This is documented here
  rather than silently guessed at.
- Local disk storage for uploaded files and a static demo login are used per the assignment's
  explicit "Assumptions" section - no cloud blob storage, no real identity provider.
- UOM conversion is out of scope (assumed comparable units across documents), per spec.
- When an item can't be resolved to a SkuMaster on more than one document, each document's raw
  itemCode is used as its own fallback matching key - so two *different* unresolved raw codes for
  the same physical product (e.g. a GRN's `33387` vs an Invoice's `FG-P-F-0234`, before a SkuMaster
  bridges them) are treated as two separate line items, each showing `item_missing_in_po`. This is
  the correct, spec-compliant behavior (fallback matching is on raw string only) but can look like
  "two problems" for what a human would recognize as one - resolving the SkuMaster (as shown in the
  worked example above) is what collapses them back into one line.

## Known limitations / what I'd improve next

- No automated test suite yet beyond manual end-to-end verification (upload out of order, duplicate
  PO, live SKU-master creation, price/MRP mismatch, unresolved items) - `matchEngine.js` and
  `masterResolution.js` are pure functions and would be the first things I'd add Jest unit tests for.
- The Fulfillment/Delivery tabs' own item tables show each document's resolution state *as parsed at
  upload time* (a historical snapshot from `rawParsed`/stored `skuMaster`), while the PO tab's item
  grid and the Summary tab are always live-recomputed. This split is intentional (documented above)
  but could be confusing without this note.
- No real per-stage upload progress from the backend (bonus item) - the frontend shows a
  simulated "uploading → parsing → mapping → finalizing" sequence timed against the request's
  actual pending state, not truly wired to backend pipeline events. A future version could stream
  pipeline step updates over SSE/WebSocket using the same steps already recorded in `MatchAudit`.
- SKU Master delete has no reference check against existing documents; deleting a SKU that's
  in use just means the next `/match` recompute treats those items as unmapped again (which is
  arguably correct given the "always re-resolve live" design, but worth calling out).

## AI tools used

Built with Claude Code (Anthropic), including reading the assignment PDF and sample documents,
scaffolding both apps, implementing the backend pipeline/matching engine, building the frontend,
and running an end-to-end browser-driven smoke test against the running app.
