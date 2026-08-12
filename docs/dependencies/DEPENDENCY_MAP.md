# Mapa de Dependencias — Cotizador Orbynex

> **Última auditoría:** 2026-08-12 
> **Método:** Análisis estático de código (grep + lectura de archivos) 
> **Resultado:** Este documento lista las dependencias con uso real confirmado.

---

## Resumen

| Categoría | Cantidad | Porcentaje |
|---|---|---|
| Uso directo confirmado (A) | 25 | 52% |
| Infraestructura / Build (B) | 16 | 33% |
| Uso indirecto confirmado (C) | 7 | 15% |
| **Total con uso real** | **48** | **100%** |

---

## A — Dependencias con Uso Directo Confirmado

### `react` + `react-dom`
- **Función:** Framework UI + DOM rendering
- **Versión:** ^19.2.0
- **Archivos:** Todos los `.tsx` del proyecto

### `@supabase/supabase-js`
- **Función:** Autenticación, acceso a datos (PostgreSQL + RLS), Storage
- **Archivos clave:**
  - `src/integrations/supabase/client.ts` — Cliente browser
  - `src/integrations/supabase/client.server.ts` — Cliente server-side con cookies
  - `src/integrations/supabase/auth-attacher.ts` — Middleware para inyectar user
  - `src/integrations/supabase/auth-middleware.ts` — Auth middleware
  - `src/lib/sync.ts` — Sincronización bidireccional con Supabase
  - `src/lib/auth-state.ts` — Estado de autenticación centralizado
  - `src/hooks/use-auth.ts` — Hook de autenticación React
  - `src/routes/auth.tsx` — Login/Registro
  - `src/routes/reset-password.tsx` — Reseteo de contraseña
  - `src/routes/_authenticated/route.tsx` — Layout autenticado (sign out)
  - `src/routes/_authenticated/negocio.tsx` — Supabase Storage (logos)
  - `src/routes/_authenticated/perfil.tsx` — Cambio de contraseña

### `@tanstack/react-router`
- **Función:** Routing completo, navegación, file-based routes
- **Archivos clave:**
  - `src/router.tsx` — Creación del router
  - `src/routeTree.gen.ts` — Árbol de rutas generado
  - Todas las rutas en `src/routes/`

### `@tanstack/react-start`
- **Función:** SSR, server functions, middleware, CSRF
- **Archivos clave:**
  - `src/start.ts` — `createStart()` con middlewares
  - `src/server.ts` — Server entry, importa `@tanstack/react-start/server-entry`
  - `src/lib/ai.functions.ts` — `createServerFn()` para IA
  - `vite.config.ts` — Plugin `tanstackStart()` desde `@tanstack/react-start/plugin/vite`

### `@google/genai`
- **Función:** Redacción asistida por IA (mejorar descripción, resumir, ortografía)
- **Entorno:** Exclusivamente server-side
- **Archivos clave:**
  - `src/lib/ai.server.ts` — Instanciación: `new GoogleGenAI({ apiKey })`
  - `src/lib/ai.functions.ts` — Server function `rewriteDescription`
- **Variables de entorno:** `GEMINI_API_KEY` / `GEMINI_API_KEYS`
- **Consumidor UI:** `src/components/quotes/ai-assist.tsx` → `src/components/quotes/quote-editor.tsx`

### `@react-pdf/renderer`
- **Función:** Generación de PDFs de cotizaciones (declarativo con React)
- **Archivos clave:**
  - `src/components/pdf/quote-document.tsx` — Componente `<QuoteDocument>` con `Document`, `Page`, `Text`, `View`
  - `src/lib/pdf.tsx` — `pdf(<QuoteDocument />).toBlob()` para descargar/compartir
- **Consumidor UI:** `src/components/quotes/quote-editor.tsx` → `src/components/quotes/pdf-preview-dialog.tsx`

### `dexie`
- **Función:** Base de datos IndexedDB local (offline-first)
- **Archivos clave:**
  - `src/lib/db.ts` — Definición: `class CotizaDB extends Dexie` con 7 tablas (`businesses`, `clients`, `quotes`, `items`, `outbox`, `conflicts`, `meta`)
  - `src/lib/repo.ts` — CRUD local con `enqueue` a la outbox
  - `src/lib/sync.ts` — `flushOutbox` (push), `pullAll` (pull), detección de conflictos

### `dexie-react-hooks`
- **Función:** `useLiveQuery` para lectura reactiva de IndexedDB
- **Archivos clave:**
  - `src/routes/_authenticated/panel.tsx`
  - `src/routes/_authenticated/clientes.tsx`
  - `src/routes/_authenticated/negocio.tsx`
  - `src/hooks/use-sync-status.ts` → `src/components/layout/sync-indicator.tsx`

### `react-hook-form`
- **Función:** Manejo de formularios complejos
- **Archivos clave:**
  - `src/components/clientes/ClientFormDialog.tsx`
  - `src/routes/_authenticated/perfil.tsx`

### `@hookform/resolvers`
- **Función:** Integración Zod ↔ React Hook Form (`zodResolver`)
- **Archivos clave:**
  - `src/components/clientes/ClientFormDialog.tsx`
  - `src/routes/_authenticated/perfil.tsx`

### `zod`
- **Función:** Validación de datos (formularios + server functions + validación manual)
- **Archivos clave:**
  - `src/lib/ai.functions.ts` — Schema `RewriteInput` para server function
  - `src/routes/auth.tsx` — `credentials.safeParse` (validación manual)
  - `src/routes/_authenticated/negocio.tsx` — `businessSchema.safeParse`
  - `src/components/clientes/ClientFormDialog.tsx` — Schema de cliente

### `sonner`
- **Función:** Notificaciones toast
- **Archivos clave:**
  - `src/routes/__root.tsx` — Provider `<Toaster />` global (via `src/components/ui/sonner.tsx`)
  - `src/components/quotes/ai-assist.tsx` — Toast de error/éxito
  - `src/components/quotes/quote-editor.tsx` — Toast en acciones
  - `src/routes/_authenticated/clientes.tsx`
  - `src/routes/_authenticated/negocio.tsx`
  - `src/routes/_authenticated/perfil.tsx`

### `lucide-react`
- **Función:** Iconos SVG (tree-shakeable)
- **Uso:** Masivo en todo el proyecto (rutas, componentes clientes, layout, quotes, landing)

### `clsx`
- **Función:** Construcción condicional de clases CSS
- **Archivo:** `src/lib/utils.ts` → helper `cn()`

### `tailwind-merge`
- **Función:** Deduplicación inteligente de clases Tailwind
- **Archivo:** `src/lib/utils.ts` → helper `cn()`

### `class-variance-authority`
- **Función:** Definición de variantes para componentes UI (`cva()`)
- **Archivos:** `button.tsx`, `badge.tsx`, `label.tsx`, `alert.tsx`, `toggle.tsx` y otros componentes UI activos

### `buffer`
- **Función:** Polyfill de Node.js `Buffer` para el bundle SSR/browser
- **Archivos clave:**
  - `src/start.ts` — `globalThis.Buffer = Buffer` (líneas 5-9)
  - `vite.config.ts` — Alias `buffer: "buffer/"` + `optimizeDeps.include`
- **Motivo:** Requerido por `@react-pdf/renderer` y/o `@google/genai` que dependen de APIs Node.js

---

## B — Infraestructura / Build

### Vite + Plugins
| Paquete | Archivo de configuración | Rol |
|---|---|---|
| `vite` | `vite.config.ts`, scripts npm | Bundler principal |
| `@vitejs/plugin-react` | `vite.config.ts` L21 | React Refresh + JSX transform |
| `@tailwindcss/vite` | `vite.config.ts` L22 | Plugin nativo Tailwind v4 |
| `vite-tsconfig-paths` | `vite.config.ts` L23 | Resolución alias `@/` |
| `vite-plugin-pwa` | `vite.config.ts` L24-64 | Generación Service Worker + manifest |

### Tailwind CSS
| Paquete | Archivo | Rol |
|---|---|---|
| `tailwindcss` | `src/styles.css`, `vite.config.ts` | Motor CSS |
| `tw-animate-css` | `src/styles.css` L4: `@import "tw-animate-css"` | Animaciones CSS |

### TypeScript
| Paquete | Archivo | Rol |
|---|---|---|
| `typescript` | `tsconfig.json` | Compilador TS |
| `@types/react` | — | Tipos React 19 |
| `@types/react-dom` | — | Tipos React DOM |
| `@types/node` | — | Tipos Node.js (`process.env` en server) |

### Linting + Formatting
| Paquete | Archivo | Rol |
|---|---|---|
| `eslint` | `eslint.config.js`, script `lint` | Linter |
| `@eslint/js` | `eslint.config.js` L1 | Config base ESLint |
| `typescript-eslint` | `eslint.config.js` L6 | ESLint + TypeScript |
| `eslint-plugin-react-hooks` | `eslint.config.js` L4 | Reglas React Hooks |
| `eslint-plugin-react-refresh` | `eslint.config.js` L5 | Reglas HMR |
| `eslint-plugin-prettier` | `eslint.config.js` L2, L39 | Prettier como regla |
| `eslint-config-prettier` | Vía `eslint-plugin-prettier/recommended` | Desactiva conflictos |
| `globals` | `eslint.config.js` L3 | `globals.browser` |
| `prettier` | `.prettierrc`, script `format` | Formateador |

---

## C — Uso Indirecto Confirmado (via wrappers activos)

Estos paquetes Radix UI se importan en `src/components/ui/` y sus wrappers SÍ son consumidos por pantallas activas.

| Paquete | Wrapper | Consumidores finales |
|---|---|---|
| `@radix-ui/react-alert-dialog` | `alert-dialog.tsx` | `ClientDeleteDialog.tsx` → `clientes.tsx` |
| `@radix-ui/react-dialog` | `dialog.tsx` | `ClientFormDialog.tsx`, `pdf-preview-dialog.tsx` |
| `@radix-ui/react-dropdown-menu` | `dropdown-menu.tsx` | `ClientMobileCard.tsx`, `ClientsTable.tsx` |
| `@radix-ui/react-label` | `label.tsx` | `quote-editor.tsx`, `form.tsx`, `negocio.tsx`, `auth.tsx`, `reset-password.tsx` |
| `@radix-ui/react-select` | `select.tsx` | `quote-editor.tsx` |
| `@radix-ui/react-slot` | `button.tsx`, `form.tsx` | 20+ archivos (button es el componente más usado) |
| `@radix-ui/react-tabs` | `tabs.tsx` | `auth.tsx` (login/registro) |

---

## Componentes UI Activos

De los 46 componentes originales en `src/components/ui/`, los siguientes **15** tienen consumidores activos (los demás fueron eliminados):

| Componente | Consumidores principales |
|---|---|
| `button.tsx` | 20+ archivos (componente más usado) |
| `card.tsx` | `onboarding-alert`, `quote-editor`, `cotizaciones/index`, `negocio`, `panel`, `perfil`, `auth`, `reset-password` |
| `input.tsx` | `ClientFormDialog`, `ClientSearch`, `quote-editor`, `negocio`, `perfil`, `auth`, `reset-password` |
| `textarea.tsx` | `ClientFormDialog`, `quote-editor`, `negocio` |
| `label.tsx` | `quote-editor`, `form.tsx`, `negocio`, `auth`, `reset-password` |
| `dialog.tsx` | `ClientFormDialog`, `pdf-preview-dialog` |
| `alert-dialog.tsx` | `ClientDeleteDialog` |
| `dropdown-menu.tsx` | `ClientMobileCard`, `ClientsTable` |
| `select.tsx` | `quote-editor` |
| `table.tsx` | `ClientsTable` |
| `tabs.tsx` | `auth` |
| `form.tsx` | `ClientFormDialog`, `perfil` |
| `badge.tsx` | `cotizaciones/index`, `panel` |
| `skeleton.tsx` | `ClientsTable` |
| `sonner.tsx` | `__root.tsx` |

---

## Arquitectura de Datos (Flujo completo)

```
React UI (useLiveQuery)
       ↕ lectura/escritura reactiva
Dexie (IndexedDB: cotiza-db)
       ↓ outbox queue
sync.ts → flushOutbox()
       ↓ upsert/delete
Supabase (PostgreSQL + RLS)
       ↓ pullAll()
Dexie (reconciliación)
```

---

## Arquitectura Server-Side

```
Cliente (React)
       ↓ createServerFn (RPC)
TanStack Start (middleware: CSRF + auth + error)
       ↓
Nitro (server runtime)
       ↓
Vercel (api/index.js → dist/server/server.js)
```

---

## Variables de Entorno Requeridas

> ⚠️ Solo se listan nombres, NUNCA valores.

| Variable | Consumida por | Entorno |
|---|---|---|
| `VITE_SUPABASE_URL` | Cliente Supabase (browser) | Client |
| `VITE_SUPABASE_ANON_KEY` | Cliente Supabase (browser) | Client |
| `SUPABASE_URL` | Cliente Supabase (server) | Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Cliente Supabase (server, privilegiado) | Server |
| `GEMINI_API_KEY` / `GEMINI_API_KEYS` | Google GenAI | Server |
