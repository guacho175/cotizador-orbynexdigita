# Arquitectura de Software

## Stack Tecnológico

El proyecto está construido sobre el ecosistema moderno de React y Supabase:

- **Frontend & Fullstack Framework**: [TanStack Start](https://tanstack.com/start/latest) (React 19).
- **Estilos**: Tailwind CSS 4 y componentes de Radix UI.
- **Base de Datos & Auth**: PostgreSQL vía Supabase.
- **Almacenamiento**: Supabase Storage (para logos de negocios, imágenes, etc.).
- **Generación de PDFs**: `@react-pdf/renderer` para construir el documento dinámico.
- **Inteligencia Artificial**: `@google/genai` ejecutado de manera segura en el servidor.
- **Despliegue**: Vercel.

## Patrones de Diseño y Límites (Boundaries)

### 1. Cliente vs Servidor (SSR & Server Functions)

Dado el uso de TanStack Start, el código se divide en dos entornos:

- **Cliente (Navegador)**: Rutas, componentes React y estado de UI. No maneja variables de entorno secretas ni acceso directo irrestricto a la DB.
- **Servidor (Node/Vercel)**: Lógica de validación, integración con IA (Gemini) y acceso privilegiado a Supabase usando `SUPABASE_SERVICE_ROLE_KEY` en funciones seguras. Todo el código que termine en `.server.ts` se garantiza que corre en el backend.

### 2. Capa de Datos y Row Level Security (RLS)

La base de datos en Supabase nunca asume que las consultas vienen de fuentes confiables de manera predeterminada a menos que se use la `service_role` key. Todo el acceso desde los clientes autenticados está regido por **RLS**, el cual asegura que un usuario solo pueda leer, editar o borrar registros (clientes, cotizaciones, items) donde su `user_id` coincide.

### 3. Generación de PDF

El PDF se genera dinámicamente en tiempo real en el cliente/servidor mediante `@react-pdf/renderer`. `QuoteDocument` es un dispatcher estable y el registro cerrado de `src/components/pdf/template-registry.tsx` selecciona una plantilla conocida. La precedencia es cotización emitida, cliente, negocio y finalmente `standard-v1`.

- Cada nueva variante debe tener una clave y una versión explícitas; no se admiten condicionales por UUID ni código almacenado en la base de datos.
- La emisión congela la clave, versión, negocio y cliente usados. La regeneración de una cotización emitida toma esos snapshots, no los perfiles vivos.
- Las cotizaciones de muchas páginas usan bloques semánticos. El precio aparece solo en el primer fragmento del producto, las continuaciones se rotulan y totales/pago se mantienen como unidades.
- El encabezado comercial completo aparece en la primera página; las continuaciones reservan un margen superior y todas las páginas conservan pie y numeración.

### 4. Inteligencia Artificial (AI)

La integración con AI existe puramente como un _asistente de redacción_ para mejorar descripciones.

- Los cálculos matemáticos (subtotal, IVA, total) **nunca** pasan por la IA para evitar alucinaciones.
- La `GEMINI_API_KEY` se mantiene estrictamente en el entorno backend de Vercel y es invocada mediante server functions.

### 5. Autenticación y Comportamiento Offline

- **Estado Compartido**: La aplicación utiliza un estado de autenticación centralizado (`src/lib/auth-state.ts`) que se sincroniza mediante `onAuthStateChange`. Esto previene llamadas redundantes a `/auth/v1/user` durante la navegación interna.
- **RLS y Seguridad**: El Role Level Security (RLS) en Supabase es la barrera final de acceso. El cliente gestiona la sesión para UI, pero la seguridad de los datos depende enteramente del backend y RLS.
- **Offline-First**: La navegación y persistencia local no expulsan al usuario por errores de red temporales, ya que la sesión depende del token local y la caché de IndexedDB.

### 6. Ciclo de cotización y numeración

- Una cotización se crea y autoguarda como borrador con `numero = null`. Guardar o editar nunca consume un correlativo.
- Descargar o compartir el PDF definitivo sincroniza primero el borrador y ejecuta `assign_quote_number` una sola vez. La operación es idempotente.
- Los negocios nuevos comienzan en 200. Los negocios existentes continúan desde el mayor valor entre su contador actual, `MAX(numero) + 1` y 200; nunca se renumeran históricos.
- La secuencia pertenece al negocio/usuario, no al cliente. Por ejemplo: cliente A = 200, cliente B = 201 y cliente A = 202.
- PostgreSQL bloquea la cotización y el negocio durante la emisión, impone unicidad parcial por `(user_id, numero)` e impide cambiar un número ya emitido.
- El navegador no puede escribir `numero`, `issued_at`, la versión congelada ni `next_quote_number`. Estos campos pertenecen al servidor.
- La outbox coalesce autoguardados de la misma fila antes de sincronizar para no reproducir estados intermedios innecesarios.

### 7. Sincronización y listados locales

- **Datos y Aislamiento**: Las colecciones locales en IndexedDB (Dexie) están estrictamente particionadas y filtradas por `user_id`. Nunca se mezclan datos entre diferentes usuarios en un mismo navegador.
- **Búsqueda y Paginación Local**: La tabla de clientes opera de manera local para maximizar el rendimiento. Permite búsqueda rápida insensible a mayúsculas y acentos (usando normalización NFD) y paginación en el cliente (bloques de 50 registros).
- **Ordenación Robusta**: Se emplea `Intl.Collator("es-CL")` para garantizar un orden alfabético correcto y estable, desempatando por ID.
- **Sincronización (Estado Actual)**: Actualmente se realiza una sincronización completa, ideal para carteras de hasta 1.000 clientes. Las fases futuras (por ej., paginación remota, tombstones para eliminaciones, y actualizaciones incrementales con `updated_at`) están planeadas para escalar más allá de este volumen.
- **Cotizaciones**: `/panel` agrupa las activas por `client_id` en acordeones y ordena cada grupo por número descendente, separando pendientes. `/cotizaciones` conserva un listado plano operativo, con pendientes primero y numeradas en orden descendente. Ambos selectores filtran por `user_id`; las archivadas no contaminan las métricas activas.

## Guías operativas relacionadas

- `docs/COTIZACIONES-NUMERACION-Y-PLANTILLAS.md`: emisión, personalización modular, despliegue y diagnóstico.
- `docs/plans/PLAN-COTIZACIONES-PLANTILLAS-NUMERACION-PDF-20260821-01.md`: diagnóstico, decisiones y trazabilidad completa.
