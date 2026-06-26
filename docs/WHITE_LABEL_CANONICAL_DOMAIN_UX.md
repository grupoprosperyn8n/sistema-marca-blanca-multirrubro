# WHITE_LABEL_CANONICAL_DOMAIN_UX

## Decision

Commercial demo canonical domain:

- https://bellezapro-demo.surge.sh

Technical/internal white-label domain:

- https://sistema-multirrubro-demo.surge.sh

Secondary/legacy demo domain:

- https://belleza-demo.surge.sh

No Surge domain was deleted in this block. The legacy domain stays active to avoid breaking existing demos, but public copy and metadata now distinguish the commercial demo from the technical multirrubro variant.

## Product rule

BellezaPro is the first seeded tenant/demo for a salon business. The frontend and backoffice must continue treating salon/belleza as data/configuration, not as fixed architecture.

## Frontend behavior

- The public app derives brand, domain role, SEO title, description, canonical URL and theme color from `BrandConfigContext`.
- `bellezapro-demo.surge.sh` is marked as `COMERCIAL_CANONICO`.
- `sistema-multirrubro-demo.surge.sh` is marked as `TECNICO_CANONICO`.
- `belleza-demo.surge.sh` is marked as `LEGACY_SECUNDARIO` and canonicalizes to BellezaPro.
- Products remain non-transactional in this phase: no payments, no checkout and no POS/caja were added.

## Guardrails confirmed

- No `.env`, `backend/.env`, `frontend/.env` or `CREDENCIALES.md` changes.
- No Airtable schema changes.
- No backend auth/JWT/cookie changes.
- No physical deletes.
- No `RESERVAS` table usage.
- No payments, checkout, caja/POS or `CIERRES_CAJA` work.
