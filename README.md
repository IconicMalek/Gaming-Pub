# Gaming Pub

**Public repository:** https://github.com/IconicMalek/Gaming-Pub  
**Live website:** https://3000-ien1d97wl9klpv2ik9k79-4ad06f8a.sg2.manus.computer

Gaming Pub is a production-oriented futuristic storefront for legitimate games, movies, series, and hardware. It is an order-management platform rather than a launcher or a download service. Customers can browse the catalog, save favorites, build a server-validated cart, choose a hard-drive path at checkout, submit orders for review, communicate through generated WhatsApp deep links, track order status, and request unavailable titles. Staff and administrators operate the catalog, order queue, request center, inventory, and derived analytics through the same visual system.

## Stack

The managed project uses React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui primitives, Framer Motion, Lucide, Recharts-ready analytics foundations, tRPC, Drizzle ORM, MySQL/TiDB-compatible managed database services, Manus OAuth, Vitest, and Playwright. The store schema is intentionally portable to Supabase PostgreSQL: the domain entities, ownership boundaries, role model, server-side validation rules, and documented Supabase environment variables are kept explicit even though the current session did not have a Supabase connector enabled.

## Implemented product surface

The customer surface includes the home page, games, movies, series, hardware, global search, product details, cart, checkout, account overview, orders, favorites, requests, settings, order tracking, WhatsApp discussion links, and game/movie/series request forms. Checkout now shows an animated submission state, automatically opens WhatsApp with the server-generated order message, offers a copy-details fallback, and supports Arabic or English message templates. The owner account can open any product detail page and use **Edit full listing** to jump directly into the complete admin editor for that product. The editor supports rich descriptions with bold text, lists, and links; secure cover and gallery uploads; IMDb title, identifier, URL, year, and rating fields; featured titles; and drag-and-drop game menu ordering. Only administrators can create or edit product records, including movies and series. The admin surface includes a dedicated protected `/admin/account` identity area, a custom command center with derived overview metrics, complete game-menu metadata controls including size, genre, platform, developer, publisher, release date, description, price, stock, and visibility, one-click live catalog CSV export/import, persisted WhatsApp business-number settings and fully customizable English/Arabic templates with required placeholders, order status management, request status management, hardware inventory controls, analytics summaries, and secure-configuration guidance. The storefront includes route-level Framer Motion transitions and an English/Arabic language context with RTL direction and Arabic-capable fonts.

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

The project is published to the public GitHub repository above, and the live managed website URL above is reachable publicly for browsing, authentication, ordering, requests, and WhatsApp order discussion. The managed runtime supplies the server, database, authentication, and storage needed by the current website. No separate Vercel deployment is claimed because the Vercel MCP server is not available in this session.

## Known limitations and next configuration

The live site uses the managed WebDev server/database/auth substrate. Realtime order updates use a short polling interval in the current runtime; a Supabase deployment should add Realtime subscriptions to the same order/status-history entities. The specification requests native Next.js; the managed WebDev runtime available in this session scaffolds Vite + React, so the implementation preserves the requested React/TypeScript/Tailwind architecture while using the supported managed runtime rather than creating an unsupported duplicate deployment. Promotions and discount codes are not enabled in the current business surface; adding them requires explicit pricing policy. A legitimate IMDb API can be added later without changing request storage or validation. Stripe is intentionally not included because the specification requires WhatsApp communication rather than online payment.

## Asset provenance

The storefront hero uses a downloaded cinematic neon city visual from the image-search asset workflow, uploaded to managed storage as `/manus-storage/gaming-pub-neon_fdf3de65.jpg`. Product cards fall back to that abstract artwork when a product-specific cover has not been configured; no product-specific identity, rating, price, or stock is inferred from the artwork.
