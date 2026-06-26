# WHITE_LABEL_CANONICAL_DOMAIN_UX

## Current decision

The only public Surge website that must remain active is:

- https://bellezapro-demo.surge.sh

The following Surge projects were intentionally removed on 2026-06-26 after explicit user approval:

- `sistema-multirrubro-demo.surge.sh`
- `belleza-demo.surge.sh`

## Product rule

BellezaPro is the first seeded tenant/demo for a salon business. The architecture remains white-label/multirrubro, but public demo traffic must point to the single commercial domain above.

## Frontend behavior

- The public app derives brand, SEO title, description, canonical URL and theme color from `BrandConfigContext`.
- `bellezapro-demo.surge.sh` is the only active Surge domain configured in the frontend.
- Products remain non-transactional in this phase: no payments, no checkout and no POS/caja were added.

## Guardrails confirmed

- No `.env`, `backend/.env`, `frontend/.env` or `CREDENCIALES.md` changes.
- No Airtable schema changes.
- No backend auth/JWT/cookie changes.
- No physical deletes of business data.
- No `RESERVAS` table usage.
- No payments, checkout, caja/POS or `CIERRES_CAJA` work.
