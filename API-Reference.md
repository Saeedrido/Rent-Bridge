# Rent Bridge API — Reference & Integration Gaps

> For the backend engineer + frontend integration.
> Spec source: `https://rentbridge-5pwk.onrender.com/swagger/index.html` (OpenAPI 3.0.4 at `/swagger/v1/swagger.json`).
> Frontend integration status: **all non-admin roles wired to real API with graceful seed-data fallback; admin intentionally left on mock data for now.**

---

## 1. Overview

| Item | Value |
|---|---|
| Base URL | `https://rentbridge-5pwk.onrender.com` |
| API prefix | `/api/v1` (webhooks live under `/api/...` without `v1`) |
| Auth | JWT Bearer — send `Authorization: Bearer <accessToken>` on every endpoint except the public ones below |
| Refresh token | Sent in the **JSON body** (`refreshToken`), not in a header or cookie |
| Error shape | All failures return `{ "error": "message" }` (400/401/403 are also documented as ASP.NET `ProblemDetails`) |
| Success shapes | **Undocumented in swagger** — every 200 response schema is `{}` (see §2.2) |

**Public (no auth) endpoints:**

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/listings/search`
- `POST /api/webhooks/dojah`, `POST /api/webhooks/smile`, `POST /api/payments/paystack/webhook`

Everything else requires a Bearer JWT.

### 1.1 Enums

| Enum | Values (integers) | Notes |
|---|---|---|
| `ListingStatus` | `0 Draft`, `1 Published`, `2 Unpublished`, `3 Closed` | Inferred — integer values are not documented in the swagger; frontend uses this mapping (`src/services/api/listingApi.ts`) |
| `LawyerStatus` | `0 Pending`, `1 Verified`, `2 Suspended`, `3 Rejected` | Inferred from admin lawyer workflow summaries |
| `MetricsGranularity` | `0 Day`, `1 Week`, `2 Month` | Used by `/dashboard/metrics/transactions` and `/admin/metrics/transactions` |
| `Role` (registration) | `"Landlord"`, `"Tenant"`, `"Caretaker"`, `"Agent"`, `"Lawyer"` | Admin **cannot** be registered publicly |
| Lease status (state machine) | `Initiated`, `InspectionRequested`, `InspectionConfirmed`, `LegalReview`, `Certified`, `PartiallySigned`, `FullySigned` | From endpoint summaries (string values to be confirmed — swagger doesn't publish the response DTO) |
| KYC status | `none`, `pending`, `verified`, `rejected` | From `/kyc/status` description |

### 1.2 Pagination quirk (please standardise)

Some endpoints use **PascalCase** query params, others camel/lowercase:

| Endpoint | Params |
|---|---|
| `GET /listings/search` | `Page`, `PageSize` |
| `GET /properties/mine` | `Page`, `PageSize` |
| `GET /leases/{id}/transactions` | `page`, `pageSize` |
| `GET /transactions` | `page`, `pageSize` |
| `GET /admin/lawyers`, `GET /admin/listings` | `page`, `pageSize` |

Defaults: `page = 1`, `pageSize = 20`.

### 1.3 Lease lifecycle (state machine)

```
POST /leases                      Tenant creates lease            → Initiated
POST /{id}/inspection             Tenant requests date            → (pending request)
POST /{id}/inspection/begin       Landlord begins                 → InspectionRequested
POST /{id}/inspection/confirm     Landlord/admin confirms         → InspectionConfirmed
POST /{id}/inspection/decline     Landlord/admin declines         → Initiated
POST /{id}/inspection/cancel      Tenant cancels own request      → Initiated
POST /{id}/inspection/reschedule  Tenant proposes new date         → (reschedule pending)
POST /{id}/inspection/reschedule/confirm | reject   Landlord/admin
POST /{id}/legal-review           Any party (tenant/landlord/lawyer/admin) → LegalReview
                                  (auto-assigns a verified lawyer if none)
POST /{id}/certify                ASSIGNED LAWYER only            → Certified
POST /{id}/sign                   Tenant or landlord              → PartiallySigned → FullySigned
POST /{id}/escrow/fund            Tenant funds; returns provider checkout URL
POST /{id}/escrow/release         ADMIN-ONLY manual retry of automatic payout
GET  /{id}/agreement | /agreement/pdf     Read-only agreement content / PDF
GET  /{id}/transactions           Escrow ledger lines for one lease
GET  /{id}                        Lease detail (parties, status, signatures, escrow trail)
```

Publishing a listing requires **all three**: identity-verified owner (KYC) + ownership-verified property + registered payout account.

---

## 2. Known issues

### 2.1 🔴 B1 — `GET /api/v1/listings/search` always returns HTTP 500

**Repro:** `GET /api/v1/listings/search?Page=1&PageSize=5` (any params, or none) → `500` on production.

**Cause (from the returned EF Core trace):** the query projects to `ListingSearchItem` **first** and then calls `.OrderByDescending(ti => new ListingSearchItem(...).PublishedAt)` on the projected type, which EF cannot translate:

```
.OrderByDescending(ti => new ListingSearchItem(...).PublishedAt)
'... could not be translated. Either rewrite the query in a form that can be
translated, or switch to client evaluation...'
```

**Suggested fix:** order on the entity **before** projecting:

```csharp
.OrderByDescending(l => l.PublishedAt)   // on DbSet<Listing>, before Select
.Select(l => new ListingSearchItem(...))
```

(or `.AsEnumerable()` before the final order, or `ToListAsync()` then order in memory).

**Blast radius:** this is the **only public listing source**. Home (featured), Properties, Buy, Rent, search filters, and property details all depend on it. The frontend currently falls back to seed data until this is fixed.

### 2.2 🟠 Response schemas are undocumented

All 57 operations return `{}` as their 202 response schema in the spec. The frontend has to parse defensively. **Please publish response DTOs (or one example JSON per endpoint).**

### 2.3 🟠 List/detail endpoints missing for several flows

See §3. Without these, the frontend falls back to seed data (by design).

---

## 3. Missing endpoints (requested by frontend)

### M1 — `GET /api/v1/leases` (caller-scoped lease list) 🔴 high

*Needed by: Tenant Inspections + Agreements tabs, Landlord Inspections + Agreements tabs, Lawyer queue.*

Today the only read is `GET /leases/{leaseId}` — **there is no way to list “my leases”** for any role. The frontend currently tries to reconstruct lists from `GET /transactions` (which contains lease references) and falls back to seed data when there is no ledger activity.

**Proposed:**

```
GET /api/v1/leases?page=1&pageSize=20&status=InspectionRequested
Authorization: Bearer <token>
```

- Visibility rules: Tenant → leases where they are the tenant; Landlord/Caretaker/Agent → leases on their own listings; Lawyer → leases assigned to them; Admin → all (optional).
- `status` optional filter (values from the state machine in §1.3).

**Example 200 (proposed):**

```json
{
  "items": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "listingId": "…uuid",
      "listingTitle": "2-bedroom flat, newly serviced",
      "propertyAddress": { "street": "14 Herbert Macaulay Way", "city": "Lagos", "area": "Yaba", "state": "Lagos" },
      "tenantId": "…uuid", "tenantName": "Adaeze Okonkwo",
      "landlordId": "…uuid", "landlordName": "Emeka Adeyemi",
      "assignedLawyerId": "…uuid|null",
      "status": "InspectionConfirmed",
      "rentAmount": { "amount": 1400000, "currency": "NGN" },
      "inspection": { "preferredDate": "2026-09-28", "scheduledDate": "2026-08-15T10:00:00Z", "status": "confirmed" },
      "signatures": { "tenantSigned": false, "landlordSigned": false },
      "escrow": { "state": "not-funded" },
      "createdAt": "2026-08-12T09:15:00Z",
      "updatedAt": "2026-08-13T11:00:00Z"
    }
  ],
  "page": 1, "pageSize": 20, "totalCount": 3
}
```

### M2 — `GET /api/v1/listings/{listingId}` (public listing detail) 🔴 high

*Needed by: property details page (`/properties/:slug`), related listings.*

`GET /listings/search` items only carry scalars:

| Field (from live query trace) | Type |
|---|---|
| `id` | uuid |
| `title` | string |
| `description` | string |
| `priceAmount` | number (double) — from `Money.Amount` |
| `priceCurrency` | string — from `Money.Currency` (e.g. `"NGN"`) |
| `status` | int (ListingStatus) |
| `coverImageKey` | string \| null |
| `createdAt`, `publishedAt` | ISO datetime |
| `propertyId` | uuid |
| `street`, `city`, `area`, `state` | string (from owned `PropertyAddress`) |

The details page also needs **`beds`, `baths`, `areaSqM`, `amenities` (list of strings), `images` (list of `{id, url, alt}`), `propertyType`, `landlord` (name/verified/rating), `coordinates {lat, lng}`** — **none of these are returned by any public endpoint today.** (`GET /properties/mine` requires auth + ownership.)

**Proposed:** `GET /api/v1/listings/{listingId}` — public for `Published` listings only, returning the full detail DTO including the fields above. `amenities` should be a **list of strings** (e.g. `["Prepaid meter", "Borehole water"]`), `images` a **list of objects**, `landlord` a nested object.

**Example 200 (proposed):**

```json
{
  "id": "…uuid", "propertyId": "…uuid",
  "title": "Serviced 2-bedroom flat",
  "description": "Second-floor flat off Herbert Macaulay Way…",
  "price": { "amount": 1400000, "currency": "NGN" },
  "status": 1,
  "propertyType": "flat",
  "beds": 2, "baths": 2, "areaSqm": 95,
  "amenities": ["Borehole water", "Prepaid meter", "Gated compound"],
  "images": [{ "id": "…", "url": "https://…/1.jpg", "alt": "Living room" }],
  "coverImageKey": "…",
  "address": { "street": "…", "city": "Lagos", "area": "Yaba", "state": "Lagos", "lat": 6.5158, "lng": 3.3794 },
  "landlord": { "id": "…uuid", "name": "Emeka Adeyemi", "verified": true, "rating": 4.8 },
  "publishedAt": "2026-08-12T09:00:00Z"
}
```

### M3 — `GET /api/v1/reviews/queue` (lawyer work queue) 🟠 medium

*Needed by: Lawyer dashboard “Review desk”.*

Lawyers are auto-assigned to property-document reviews and lease legal review, but there is **no endpoint to fetch assigned work** — only per-ID actions (`certify`, `documents/{id}/verify`, …).

**Proposed:**

```
GET /api/v1/reviews/queue?page=1&pageSize=20
Authorization: Bearer <token>   (role = Lawyer)
```

**Example 200 (proposed):**

```json
{
  "items": [
    { "kind": "lease",     "leaseId": "…uuid", "listingTitle": "Sabo, Yaba — 2-bed flat",
      "tenantName": "Adaeze Okonkwo", "landlordName": "Emeka Adeyemi",
      "rentAmount": 1400000, "status": "LegalReview", "submittedAt": "2026-08-12T…" },
    { "kind": "property",  "propertyId": "…uuid", "documentId": "…uuid",
      "address": { "street": "…", "city": "Lagos", "area": "Ikeja", "state": "Lagos" },
      "ownerName": "Kunle Adebayo", "status": "InReview", "submittedAt": "2026-08-11T…" }
  ],
  "page": 1, "pageSize": 20, "totalCount": 4
}
```

Until this exists, the lawyer queue UI runs on seed fallback data.

### M4 — `GET/POST/DELETE /api/v1/favorites` (saved listings) 🟠 medium

*Needed by: Favorites page, tenant Saved tab.*

No favorites concept exists in the API. The frontend persists saved listing IDs in `localStorage` — no cross-device sync, lost on cache clear.

**Proposed:**

```
GET    /api/v1/favorites?page=1&pageSize=20   → { items: [ <listing detail DTO> ], … }
POST   /api/v1/favorites/{listingId}          → 200 / 201 (idempotent)
DELETE /api/v1/favorites/{listingId}          → 204
```

### M5 — `GET /api/v1/users/me` (+ optional `PUT`) 🟡 low

*Needed by: Profile tabs (all roles).*

No “who am I / edit profile” endpoint. Profiles currently render from the login response cached in `sessionStorage`. A `GET /users/me` (fresh profile incl. KYC status, role, verification labels) and optionally `PUT /users/me { firstName, lastName, phone }` would complete the profile tab.

**Example 200 (proposed):**

```json
{
  "id": "…uuid", "email": "…", "phone": "…",
  "firstName": "…", "lastName": "…", "role": "Landlord",
  "kycStatus": "verified",
  "payoutAccount": { "bankName": "…", "accountNumberMasked": "****1234" },
  "createdAt": "2026-08-01T…"
}
```

### M6 — Tenant dashboard summary 🟡 low

*Needed by: Tenant dashboard stats.*

`GET /api/v1/dashboard` is documented as the **owner’s** dashboard (their listings, escrow held, payouts). Tenants have no equivalent summary (active leases, upcoming inspections, escrow owed). Either:

- document that `GET /dashboard` already adapts to the caller’s role, **or**
- add `GET /api/v1/dashboard/tenant` returning e.g. `{ activeLeases, upcomingInspections, escrowOwed, recentTransactions }`.

The frontend calls `GET /dashboard` for tenants too and falls back to seed data if it returns owner-shaped/empty data.

---

## 4. Endpoint reference (all 55 paths / 57 operations)

Legend: 🌐 public · 🔒 requires Bearer JWT · 🛡️ admin role only · ⚖️ lawyer-or-admin · ⏳ deprecated

### 4.1 Auth

#### 🌐 `POST /api/v1/auth/register` — Register a user
Creates an account. Admin accounts **cannot** be created here (seeded default admin only).

| Body field | Type | Notes |
|---|---|---|
| `email` | string | unique login email |
| `phone` | string | |
| `firstName` | string | |
| `lastName` | string | |
| `role` | enum string | `"Landlord"` \| `"Tenant"` \| `"Caretaker"` \| `"Agent"` \| `"Lawyer"` |
| `password` | string | |
| `barNumber` | string | **required when `role = "Lawyer"`** (bar-roll number) |

- `200` — token/user payload (schema undocumented; frontend normalises camelCase/snake_case and decodes role from the JWT, including the MS claims URI)
- `400 { error }`

#### 🌐 `POST /api/v1/auth/login` — Login

| Body field | Type |
|---|---|
| `email` | string |
| `password` | string |

- `200` — `{ accessToken, refreshToken, user {...} }` expected by frontend (schema undocumented)
- `400 / 401 { error }`

#### 🌐 `POST /api/v1/auth/refresh` — Refresh access token

| Body field | Type | Notes |
|---|---|---|
| `refreshToken` | string | sent in **body**, not header |

- `200` — new access token (frontend also tolerates a rotated refresh token)
- `400 / 401 { error }`

#### 🌐 `POST /api/v1/auth/logout` — Revoke refresh token

| Body field | Type |
|---|---|
| `refreshToken` | string |

- `200` — cleared session; frontend clears sessionStorage regardless

---

### 4.2 KYC

#### 🔒 `POST /api/v1/kyc/verify` — Start identity verification (Dojah default)

Frontend flow: ① POST with NIN → ② open Dojah Connect widget with returned bootstrap, `reference_id = referenceId`, pre-fill `gov_data.nin` → ③ on widget success, **poll `GET /kyc/status`** — widget `onSuccess` alone never proves a pass.

| Body field | Type |
|---|---|
| `nin` | string — 11-digit NIN |

- `200` — widget bootstrap:

```json
{
  "referenceId": "…uuid  (our kyc id — do NOT change it)",
  "data": {
    "appId": "…", "publicKey": "p_key (safe for clients)",
    "widgetId": "…", "environment": "sandbox" | "production"
  }
}
```

- `400 / 401 / 403 { error }`

#### 🔒 `GET /api/v1/kyc/status` — Poll KYC verdict

Poll every ~3 s after widget success (timeout ~2 min).

- `200` — `{ "kycId": "…", "provider": "dojah", "status": "none|pending|verified|rejected", "completedAt": "ISO|null" }`
- `"none"` = user never started verification

#### 🔒⏳ `POST /api/v1/kyc/smile-token` — Legacy Smile ID flow (deprecated)

Same body (`nin: string`). Returns Smile SDK bootstrap token. Prefer `POST /kyc/verify`.

---

### 4.3 Property

#### 🔒 `POST /api/v1/properties` — Create property (Draft) + ownership docs

| Body field | Type | Notes |
|---|---|---|
| `street` | string | |
| `city` | string | |
| `area` | string | locality/neighbourhood |
| `state` | string | |
| `documentUrls` | **list\<string\>** | URLs of ownership documents (deed, etc.) |

- `200` — created property (`id` uuid, `verified: false` until a lawyer verifies it)
- Publish flow requires a lawyer/admin to verify the property first (endpoints below)

#### 🔒⚖️ `POST /api/v1/properties/{propertyId}/documents/{documentId}/start-review`
Lawyer/admin flags one document (by `documentId` uuid) as under review.

#### 🔒⚖️ `POST /api/v1/properties/{propertyId}/documents/{documentId}/verify`
Lawyer/admin verifies that document.

#### 🔒⚖️ `POST /api/v1/properties/{propertyId}/documents/{documentId}/reject?reason=…`
Lawyer/admin rejects a document. `reason` is an optional **query string**.

#### 🔒⚖️ `POST /api/v1/properties/{propertyId}/verify`
Lawyer/admin verifies property **ownership** → emails the owner, unlocks listing creation for it.

#### 🔒 `GET /api/v1/properties/mine` — Current user’s properties

Query: `Page` (default 1), `PageSize` (default 20), `IsVerified` (bool), `State`, `City`.
- `200` — paged list of the caller’s property records (`id`, address fields, `documentUrls` list, `verified`, `createdAt`)

---

### 4.4 Listing

#### 🔒 `POST /api/v1/listings` — Create listing (Draft) from a verified property

| Body field | Type | Notes |
|---|---|---|
| `propertyId` | uuid | must be a **verified** property owned by the caller |
| `title` | string | |
| `priceAmount` | number (double) | annual rent amount (NGN) |
| `description` | string | |

- `400` if the property isn’t verified or payout account is missing.

#### 🔒 `POST /api/v1/listings/{listingId}/publish` — Publish a Draft
Requires identity-verified owner (KYC) + ownership-verified property + registered payout account. Emails the owner on success.

#### 🔒 `PATCH /api/v1/listings/{listingId}` — Edit own listing (only sent fields change)

| Body field | Type |
|---|---|
| `title` | string (optional) |
| `description` | string (optional) |
| `priceAmount` | number (optional) |

Only allowed while `Draft`/`Published` (not `Closed`).

#### 🔒 `POST /api/v1/listings/{listingId}/unpublish` — Remove from public search (re-publishable)

#### 🔒 `POST /api/v1/listings/{listingId}/close` — Close permanently (cannot edit/re-publish)

#### 🌐 `GET /api/v1/listings/search` — Public listing search 🔴 currently 500 (see §2.1)

Query (note PascalCase): `Page`, `PageSize`, `State`, `City`, `Area`, `MinPrice`, `MaxPrice`, `Status` (ListingStatus int).

Response item fields — see the table in **§3 M2** (scalars only; no beds/ baths/ amenities/ images).

---

### 4.5 Lease (18 endpoints — see state machine §1.3)

#### 🔒 `POST /api/v1/leases` — Tenant initiates a lease

| Body field | Type |
|---|---|
| `listingId` | uuid — must be a **Published** listing |

Listing owner becomes the landlord. Lease starts `Initiated`.

#### 🔒 `POST /api/v1/leases/{leaseId}/inspection` — Tenant requests an inspection date

| Body field | Type | Notes |
|---|---|---|
| `preferredDate` | string (ISO date, e.g. `2026-09-28`) | |
| `note` | string (optional) | message to the landlord |

#### 🔒 `POST /api/v1/leases/{leaseId}/inspection/begin` — Landlord begins inspection flow
`Initiated → InspectionRequested`. No body.

#### 🔒 `POST /api/v1/leases/{leaseId}/inspection/confirm` — Landlord/admin confirms

| Body field | Type | Notes |
|---|---|---|
| `scheduledDate` | string (ISO datetime, optional) | physical inspection slot |
| `notes` | string (optional) | |

`InspectionRequested → InspectionConfirmed`; auto-assigns a verified lawyer at confirm time.

#### 🔒 `POST /api/v1/leases/{leaseId}/inspection/decline` — Landlord/admin declines → back to `Initiated`

#### 🔒 `POST /api/v1/leases/{leaseId}/inspection/cancel` — Tenant cancels own pending request → `Initiated`

#### 🔒 `POST /api/v1/leases/{leaseId}/inspection/reschedule` — Tenant proposes a new date
Same body as `/inspection` (`preferredDate`, `note?`).

#### 🔒 `POST /api/v1/leases/{leaseId}/inspection/reschedule/confirm` — Landlord/admin accepts reschedule

#### 🔒 `POST /api/v1/leases/{leaseId}/inspection/reschedule/reject` — Landlord/admin rejects (original schedule kept)

#### 🔒 `POST /api/v1/leases/{leaseId}/legal-review` — Move lease into legal review
Tenant, landlord, lawyer, or admin. Auto-assigns a lawyer lazily if none was assigned at confirm time. No body.

#### 🔒⚖️ `POST /api/v1/leases/{leaseId}/certify` — Assigned lawyer certifies
`LegalReview → Certified`. Only the **assigned** lawyer (or admin) may call it. No body.

#### 🔒 `POST /api/v1/leases/{leaseId}/sign` — Tenant or landlord signs

| Body field | Type | Notes |
|---|---|---|
| `signatureImage` | string (optional) | **base64** image; omitted → deterministic hash stored as signature |

`Certified → PartiallySigned → FullySigned` (raises fully-signed once both parties signed).

#### 🔒 `GET /api/v1/leases/{leaseId}/agreement` — Canonical agreement content
Terms + pinned hash + certification/signature status. Composed on first view.

#### 🔒 `GET /api/v1/leases/{leaseId}/agreement/pdf` — Rendered PDF (binary blob)
Terms, certified-by, signature blocks, audit trail. Frontend downloads as blob.

#### 🔒 `POST /api/v1/leases/{leaseId}/escrow/fund` — Tenant funds escrow (fully-signed lease only)
- `200` — `{ checkoutUrl: "https://checkout.paystack.com/…" }` (provider checkout; idempotent)

#### 🔒🛡️ `POST /api/v1/leases/{leaseId}/escrow/release` — Admin-only manual payout retry
Privileged, audit-logged. Pays the landlord net of platform commission + legal fee.

#### 🔒 `GET /api/v1/leases/{leaseId}/transactions` — Escrow ledger lines for one lease
Query: `page`, `pageSize`. Newest first. Access: landlord, tenant, assigned lawyer, admin.
`200` — list of ledger lines (fund → fees → payout) — DTO undocumented.

#### 🔒 `GET /api/v1/leases/{leaseId}` — Lease detail
Status, agreement certification/signature state, escrow payment trail, parties. Access: landlord/tenant/lawyer/admin.

---

### 4.6 Payout account (landlord/agent/caretaker)

#### 🔒 `GET /api/v1/payout-account/banks` — Banks available for payout
`200` — list of banks: each `{ code: string, name: string, … }` (`code` is the `bankCode` used below).

#### 🔒 `POST /api/v1/payout-account/resolve` — Name enquiry (not persisted)

| Body field | Type |
|---|---|
| `bankCode` | string |
| `accountNumber` | string (10 digits) |

`200` — `{ accountName: string, … }` — provider-verified account name.

#### 🔒 `PUT /api/v1/payout-account` — Register/replace caller’s payout account

| Body field | Type |
|---|---|
| `bankCode` | string |
| `bankName` | string |
| `accountNumber` | string |

Creates the transfer recipient server-side. **Publishing a listing is blocked until this exists.**

#### 🔒 `GET /api/v1/payout-account` — Caller’s payout account (masked)
`200` — `{ bankName, accountNumberMasked: "****1234", accountName, … }` or 404-ish error when unset.

---

### 4.7 Dashboard

#### 🔒 `GET /api/v1/dashboard` — Signed-in owner’s dashboard
Their listings & leases, money held in escrow, payout totals, recent ledger lines. (See **M6** re: tenants.)

#### 🔒 `GET /api/v1/dashboard/metrics/transactions` — Owner’s transaction time-series

| Query | Type | Notes |
|---|---|---|
| `from` | ISO datetime | inclusive |
| `to` | ISO datetime | **exclusive** |
| `granularity` | enum int | `0 Day` \| `1 Week` (Monday-start) \| `2 Month` |

Empty buckets are returned as zeros.

---

### 4.8 Transactions

#### 🔒 `GET /api/v1/transactions` — Caller’s entire transaction history
All leases, newest first. Query: `page`, `pageSize`. Admins see every line.
Primary source for the tenant/landlord **Payments** tabs; also the fallback source for deriving lease IDs until **M1** exists.

---

### 4.9 Admin 🛡️

All admin endpoints are now integrated in the frontend (`AdminDashboard` → `adminApi.ts`), with seed fallback while the backend is unreachable.

| # | Endpoint | Body / query | Purpose |
|---|---|---|---|
| 1 | `POST /api/v1/admin/users/{userId}/verify-lawyer` | `userId` uuid | Approve pending lawyer → auto-assignable |
| 2 | `POST /api/v1/admin/users/{userId}/suspend-lawyer` | `userId` uuid | Remove lawyer from auto-assignment (re-verifiable) |
| 3 | `POST /api/v1/admin/users/{userId}/reject-lawyer` | `userId` uuid | Terminal rejection of application |
| 4 | `GET /api/v1/admin/dashboard` | — | Platform counts, escrow held, ledger metrics |
| 5 | `GET /api/v1/admin/metrics/transactions` | `from`, `to`, `granularity` | Platform time-series (same contract as §4.7) |
| 6 | `GET /api/v1/admin/lawyers` | `status` (LawyerStatus int), `page`, `pageSize` | Lawyer approval queue |
| 7 | `GET /api/v1/admin/listings` | `status` (ListingStatus int), `page`, `pageSize` | Listing moderation queue (incl. owner + property verification state) |
| 8 | `GET /api/v1/admin/settings/fees` | — | Current escrow fee split |
| 9 | `PUT /api/v1/admin/settings/fees` | `{ platformCommissionRate: number, legalFeeRate: number }` | Update split; each ≥ 0, each < 100, **sum < 100** |
| 10 | `POST /api/v1/admin/admins` | `{ email, phone, firstName, lastName, password }` | Create admin — **only the seeded default admin may call this** |

---

### 4.10 Webhooks (server-to-server, not called by the frontend)

| Endpoint | Purpose |
|---|---|
| `POST /api/webhooks/dojah` | KYC verdict ingress (authenticated by shared secret) |
| `POST /api/webhooks/smile` | Legacy Smile KYC verdict ingress |
| `POST /api/payments/paystack/webhook` | Paystack escrow payment events — always answers 200 (no retries); failures surface via escrow status on the lease |

---

## 5. Frontend integration map (what talks to what)

| Role / screen | Real API | Seed fallback while gaps exist |
|---|---|---|
| Public Home/Properties/Buy/Rent/Details | `listings/search` (🔴 B1 → fallback active) | `properties.ts` |
| Auth + KYC (all roles) | `auth/*`, `kyc/*` | — |
| Landlord/Caretaker properties + publish | `properties/mine`, `listings/*`, `payout-account/*` | — |
| Landlord inspections/agreements/payments | `dashboard`, `leases/{id}…`, `transactions` (M1 needed) | `data.ts` |
| Tenant dashboard/inspections/payments/agreements | `dashboard`, `transactions`, `leases/{id}…` (M1 needed) | `tenantData.ts`, `dashboardProperties.ts` |
| Agent dashboard | `dashboard`, `listings/search` | `dashboardProperties.ts` |
| Lawyer queue | **none (M3)** | `initialQueue` |
| Lawyer listings tab + actions | `listings/search`, `leases/{id}/certify`, `properties/…/verify` | `initialNewListings` |
| Favorites / Saved | browser localStorage | — (**M4** to move server-side) |
| Profile tabs | login response cached in sessionStorage | — (**M5**) |
| Admin dashboard | `admin/dashboard`, `admin/metrics/transactions`, `admin/lawyers`, `admin/listings`, `admin/settings/fees` | `adminData.ts` |
