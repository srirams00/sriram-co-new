# Hardened Admin Panel Product CRUD Implementation Plan

## Problem Statement
How might we provide Sri Ram & Co store managers with a secure, fast, and aesthetic administrative workspace to create, view, update, toggle inventory, and delete catalog products without unauthorized access or data corruption?

## Recommended Direction
Build a hardened Admin Workspace inside Next.js (`/admin/products`) backed by secured Express REST API endpoints (`/api/products`), strictly aligned with the uploaded reference UI and security constraints:
1. **Access Control**: Strict JWT and `requireAdmin` role check on all mutating endpoints; client-side route guard redirecting unauthorized visitors.
2. **Input Sanitization**: Zod validation schemas enforcing HTTPS-only image URLs, length bounds, and valid 24-char MongoDB ObjectIds.
3. **Data Integrity**: Dependency verification before deletion to protect order references.
4. **Visual Alignment**: Deep forest green (`#174A2B`) sidebar, 4 KPI inventory metrics, data table matching the reference image, and dedicated full-page routes (`/admin/products/new`, `/admin/products/[id]/edit`).

## Key Assumptions & Validations
- [ ] Only users with `role: 'admin'` can access admin routes and perform product mutations.
- [ ] Image URLs must use secure `https://` protocol to prevent XSS and SSRF risks.
- [ ] Product deletion verifies no pending or active customer orders depend on the product.

## MVP Scope
1. **Auth Middleware**: `server/src/middleware/authMiddleware.ts` with `authenticate` and `requireAdmin`.
2. **Schema & Model**: Add `sku`, `inventoryCount`, and `isArchived` to `server/src/models/Product.ts`.
3. **Hardened Endpoints**: `POST`, `PUT`, `DELETE`, `PATCH /:id/stock`, and `GET /admin/stats` in `server/src/routes/productRoutes.ts`.
4. **Admin Shell**: `client/src/app/admin/layout.tsx` + `AdminSidebar.tsx` with role guard.
5. **Catalog Workspace**: `client/src/app/admin/products/page.tsx` with 4 KPI cards and data table.
6. **Dedicated Routes**: `/admin/products/new` and `/admin/products/[id]/edit`.

## Not Doing (and Why)
- Complex multi-tier staff permissions matrix — Single store owner admin role is sufficient for MVP.
- Binary multipart uploads — HTTPS image URLs keep the database lightweight and fast.
- Silent cascading order deletion — Refusing deletion when active orders exist preserves business accounting.
