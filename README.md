# Gaming Pub

Gaming Pub is a production-oriented futuristic storefront for legitimate games, movies, series, and hardware. It is an order-management platform rather than a launcher or a download service. Customers can browse the catalog, save favorites, build a server-validated cart, choose a hard-drive path at checkout, submit orders for review, communicate through generated WhatsApp deep links, track order status, and request unavailable titles. Staff and administrators operate the catalog, order queue, request center, inventory, and derived analytics through the same visual system.

## Stack

The managed project uses React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui primitives, Framer Motion, Lucide, Recharts-ready analytics foundations, tRPC, Drizzle ORM, MySQL/TiDB-compatible managed database services, Manus OAuth, Vitest, and Playwright. The store schema is intentionally portable to Supabase PostgreSQL: the domain entities, ownership boundaries, role model, server-side validation rules, and documented Supabase environment variables are kept explicit even though the current session did not have a Supabase connector enabled.

## Implemented product surface

The customer surface includes the home page, games, movies, series, hardware, global search, product details, cart, checkout, account overview, orders, favorites, requests, settings, order tracking, WhatsApp discussion links, and game/movie/series request forms. The admin surface includes a dedicated protected `/admin/account` identity area, a custom command center with derived overview metrics, product configuration, validated CSV product import, order status management, request status management, hardware inventory controls, analytics summaries, and secure-configuration guidance.

The seeded game title list comes from the project specification. Seeded titles intentionally have no fabricated price, rating, or stock. They remain unavailable until an authorized administrator configures them. IMDb fields only accept a user-provided identifier or URL and are not synthesized.

## Business and security rules

Prices and totals are recalculated from database product records on the server. Cart quantities are checked against availability and hardware inventory. Customer order, request, favorites, cart, notification, and analytics queries are scoped to the authenticated customer. Admin and staff procedures are role protected; destructive product deletion is admin-only. Order and request status transitions are whitelisted and invalid jumps fail. Only `COMPLETED` orders contribute to revenue and purchase analytics. Requests never contribute to revenue. WhatsApp links are communication-only and never update payment or order status.

The service-role key is never read by client code. No secret is embedded in the frontend bundle. The current managed runtime provides the live authenticated application database and Manus OAuth session. For an external Supabase deployment, configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and server-only `SUPABASE_SERVICE_ROLE_KEY`; configure `WHATSAPP_BUSINESS_NUMBER` to generate a direct WhatsApp destination. These variables are intentionally not populated in source control.

## Local development

```bash
pnpm install
pnpm dev
```

The initialized managed runtime injects its database, OAuth, and storage variables. The live database schema is represented in `drizzle/schema.ts` and the reviewed migration is `drizzle/0001_abandoned_spitfire.sql`.

## Verification

```bash
pnpm check
pnpm test
BASE_URL=https://<managed-preview-url> pnpm test:e2e
pnpm build
```

The Vitest suite covers the order lifecycle, request lifecycle, IMDb validation, WhatsApp message semantics, and the existing auth logout regression. The Playwright suite covers the home experience, seeded catalog search, global search, request center routes, and unauthenticated account protection.

## Deployment

The project is prepared for the managed WebDev deployment pipeline and can be checkpointed and published from the WebDev tools. Vercel and GitHub were not connected in this session, so no duplicate repository or Vercel project was created and no production deployment was claimed. When those connectors are enabled, connect the existing project rather than creating duplicates, set production secrets server-side, apply the migration, run the same build and browser checks against production, and then commit the checkpointed project.

## Known limitations and next configuration

The current session has GitHub, Supabase, Supabase API, and Vercel connectors explicitly disabled. The live preview therefore uses the managed WebDev server/database/auth substrate. Realtime order updates use a short polling interval in the current runtime; a Supabase deployment should add Realtime subscriptions to the same order/status-history entities. The specification requests native Next.js; the managed WebDev runtime available in this session scaffolds Vite + React, so the implementation preserves the requested React/TypeScript/Tailwind architecture while using the supported managed runtime rather than creating an unsupported duplicate deployment. Promotions and discount codes are not enabled in the current business surface; adding them requires explicit pricing policy. A legitimate IMDb API can be added later without changing request storage or validation. Stripe is intentionally not included because the specification requires WhatsApp communication rather than online payment.

## Asset provenance

The storefront hero uses a downloaded cinematic neon city visual from the image-search asset workflow, uploaded to managed storage as `/manus-storage/gaming-pub-neon_fdf3de65.jpg`. Product cards fall back to that abstract artwork when a product-specific cover has not been configured; no product-specific identity, rating, price, or stock is inferred from the artwork.
