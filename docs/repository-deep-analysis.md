# Repository Deep Analysis (Docmost / `life-algorithm` checkout)

## 1) What this repository is

This is a **PNPM workspace monorepo** for Docmost, an open-source collaborative wiki/documentation platform. The repo is organized around three primary code units:

- `apps/server`: NestJS + Fastify backend API and background services.
- `apps/client`: React + Vite frontend web app.
- `packages/editor-ext`: reusable TipTap editor extension package shared by client/server flows.

The workspace orchestration is handled by **Nx** and package management by **pnpm**.

---

## 2) Top-level architecture and build model

### Monorepo/build terms used here

- **Workspace**: Multiple packages/apps managed from one root `package.json` and `pnpm-workspace.yaml`.
- **Nx target**: Named lifecycle action such as `build`, `start:dev`, `lint` executed against one or many projects.
- **Project graph dependency build**: Nx `dependsOn: ["^build"]` ensures dependencies build before dependents.
- **Patched dependency**: `react-arborist@3.4.0` is patched locally via `patches/react-arborist@3.4.0.patch`.

### Runtime architecture

- Main HTTP API starts in `apps/server/src/main.ts`.
- Frontend SPA starts in `apps/client/src/main.tsx` and routes in `apps/client/src/App.tsx`.
- Real-time collaboration has a dedicated collab runtime (`collab:prod`/`collab:dev`).

---

## 3) Core modules and what each one does (backend)

The backend is a NestJS app where each domain is a **Nest Module**.

### Root application and composition modules

- **`AppModule`** (`apps/server/src/app.module.ts`): root module wiring all major subsystems: core business modules, database, redis, queue, static serving, health, import/export, storage/mail abstractions, telemetry, and optional enterprise module loading.
- **`CoreModule`** (`apps/server/src/core/core.module.ts`): aggregates business-domain modules and installs `DomainMiddleware` globally (except setup/health/webhook exclusions).
- **`DatabaseModule`** (`apps/server/src/database/database.module.ts`): central DB access layer (Kysely + services/repos).
- **`CollaborationModule`** (`apps/server/src/collaboration/collaboration.module.ts`): collaborative editing integration (Yjs/Hocuspocus side).
- **`WsModule`** (`apps/server/src/ws/ws.module.ts`): websocket features/transport.

### Domain/business modules (inside `core/`)

- **`AuthModule` / `TokenModule`**: authentication flows and JWT/token issuance/validation.
- **`UserModule`**: user lifecycle, user profile/account operations.
- **`WorkspaceModule`**: tenancy boundary / workspace-level management.
- **`SpaceModule`**: spaces as organizational containers for pages/resources.
- **`PageModule`**: document/page CRUD, structure, and content-domain logic.
- **`AttachmentModule`**: file upload metadata and attachment lifecycle.
- **`CommentModule`**: threaded/in-document comment functionality.
- **`SearchModule`**: indexing/search orchestration.
- **`GroupModule`**: group membership and permission grouping.
- **`CaslModule`**: authorization policy integration based on CASL.
- **`ShareModule`**: externally shared page/link behavior.
- **`NotificationModule`**: notifications/events surfaced to users.
- **`WatcherModule`**: event watch/subscription-style domain handling.
- **`ProjectModule`**: project/task/mission related features.
- **`AdminModule`**: administrative dashboard/system operations.

### Integration modules (inside `integrations/`)

- **`EnvironmentModule`**: env/config loading/validation abstractions.
- **`StorageModule`**: storage-provider abstraction for attachments/assets.
- **`MailModule`**: email transport + transactional sending interfaces.
- **`QueueModule`**: async job processing (BullMQ/Redis-backed).
- **`StaticModule`**: static content serving integration.
- **`HealthModule`**: liveness/readiness endpoint support.
- **`ImportModule`**: content ingestion/conversion pipelines.
- **`ExportModule`**: data/page export pipelines.
- **`SecurityModule`**: security-related integrations/controls.
- **`TelemetryModule`**: analytics/usage/diagnostic telemetry hooks.

### Infrastructure terms visible in bootstrap (`main.ts`)

- **Fastify adapter**: Nest uses Fastify runtime instead of Express.
- **Global prefix**: API is namespaced under `/api` with specific path exclusions.
- **Redis WebSocket adapter**: cross-instance websocket scaling via Redis pub/sub.
- **ValidationPipe**: DTO validation/transformation with whitelist enforcement.
- **Global interceptor**: wraps/normalizes HTTP response payload structure.
- **Domain middleware / workspace resolution**: request-scoped workspace context enforcement.

---

## 4) Frontend modules and structure (client)

### Frontend platform layer

- **React + Vite + TypeScript** SPA in `apps/client`.
- **Mantine UI** for component system/theme/provider stack.
- **TanStack Query** for server-state caching/fetch orchestration.
- **React Router** for route-level module composition.
- **PostHog provider** for cloud telemetry instrumentation.

### Startup composition (`main.tsx`)

Provider stack order:

1. `BrowserRouter`
2. `MantineProvider`
3. `ModalsProvider`
4. `QueryClientProvider`
5. `Notifications`
6. `HelmetProvider`
7. `PostHogProvider`

This indicates the app is designed around client-side routing, centralized style system, async data caching, and optional analytics.

### Route module map (`App.tsx`)

Major route groups:

- **Auth**: login, invites, password reset, MFA challenge/setup.
- **Cloud-only setup**: workspace create/select.
- **Sharing**: public/shared-page routes and redirects.
- **Primary app layout routes**: home, spaces, page display, projects/tasks/mission views, trash.
- **Settings**: account, workspace, groups, spaces, sharing, security, AI, billing/license.
- **Admin**: dashboard/users/system.

### Feature-module organization (`src/features/*`)

The frontend is domain-sliced into feature directories (`user`, `group`, `space`, `page`, `editor`, `comment`, `notification`, `project`, `websocket`, etc.), which typically encapsulate:

- API query hooks/services,
- UI components,
- feature-local state atoms/utilities,
- route-level usage points.

---

## 5) Editor extension package (`packages/editor-ext`)

This package exports a large suite of TipTap extensions and editor helpers used by the product:

- core formatting/content extensions: table, image, video, math, callout, heading, highlight.
- rich embed/asset extensions: drawio, excalidraw, embed provider, attachment.
- collaboration/editor utilities: unique-id, shared-storage, recreate-transform, selection helpers.
- authoring quality features: markdown import/export helpers, search-and-replace, mention, link.

This package acts as a reusable abstraction layer over ProseMirror/TipTap primitives so the application can keep editor behavior consistent across contexts.

---

## 6) Data, queue, and real-time terms used in this codebase

- **Kysely**: typed SQL query builder used on server side.
- **Migration scripts**: custom TSX-driven migration commands in server scripts.
- **Redis**: used for queueing and websocket scaling.
- **BullMQ**: durable background processing queue.
- **Socket.io / ws adapters**: realtime messaging path.
- **Yjs + Hocuspocus**: CRDT-based collaborative editing transport/synchronization.

---

## 7) Deployment/runtime packaging

- Docker uses a multi-stage build (`base` -> `builder` -> `installer`).
- Final image ships built server/client/editor-ext artifacts and installs production deps only.
- `docker-compose.yml` provisions app + PostgreSQL + Redis with persistent volumes.

Operationally this means a standard self-hosted deployment is:

1. Postgres for persistence.
2. Redis for realtime + jobs.
3. Node service serving API + frontend assets.

---

## 8) Enterprise edition boundary

Enterprise features are conditionally loaded from `apps/server/src/ee` and `apps/client/src/ee`. The root README explicitly marks those directories and `packages/ee` as enterprise-licensed areas; the OSS core remains AGPL-licensed.

---

## 9) Important vocabulary guide (“each term/module” quick glossary)

- **Module (NestJS)**: dependency-injection boundary that groups providers/controllers.
- **Provider**: injectable service/class in NestJS.
- **Middleware**: request pre-processing layer before route handlers.
- **Interceptor**: wraps route execution for cross-cutting concerns.
- **DTO**: typed request/response contract for validation.
- **CASL**: authorization rules engine used for ability-based permissions.
- **Workspace**: tenant boundary in Docmost.
- **Space**: logical section inside a workspace.
- **Page**: core editable document entity.
- **Share**: externally consumable representation of page content.
- **Collaboration service**: realtime synchronization channel for editor state.
- **Queue worker**: background asynchronous processor for long-running jobs.
- **Editor extension**: TipTap/ProseMirror plugin adding schema/commands/rendering behavior.
- **Enterprise module**: optional closed-source feature pack dynamically loaded.

---

## 10) Practical mental model for contributors

Think of the repository as three layers:

1. **Domain/backend (`apps/server`)**: business logic + persistence + auth/security + APIs + realtime infra.
2. **Product/frontend (`apps/client`)**: user experience, routing, feature UIs, and data-fetch orchestration.
3. **Editing platform (`packages/editor-ext`)**: shared structured-content engine powering rich page authoring.

If you are tracing a feature end-to-end, start at a route in `App.tsx`, jump to a feature folder in `apps/client/src/features`, then follow API calls to the matching `apps/server/src/core/*` module and its database/integration dependencies.


## 11) Database reference

For a dedicated schema/ER reference, see `docs/database-structure.md`.
