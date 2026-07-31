## Sistema de Cotizaciones Inteligentes — Plan MVP

Reconstrucción dinámica de tu plantilla (DOS27) como app web instalable, con Supabase propio.

### Decisiones confirmadas
- Backend: **tu propio proyecto Supabase** (Auth + Postgres + Storage).
- PDF: columnas **Descripción · Cant. · Valor unitario · Total**.
- IVA fijo 19%, sin bloque de notas libre.
- Marca neutra: cada usuario sube su logo y datos.
- PWA instalable con soporte offline y sincronización.

### Lo que necesitaré de ti (primer paso de la implementación)
1. `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` (Settings → API de tu proyecto).
2. `SUPABASE_SERVICE_ROLE_KEY` (solo servidor).
3. Ejecutar tú mismo, en el SQL Editor de tu proyecto, el archivo de migración que dejaré versionado en `supabase/migrations/`. Te daré instrucciones paso a paso.

### Modelo de datos (RLS estricta por `auth.uid()`)
```text
profiles(id → auth.users, full_name)
businesses(id, user_id, nombre, rut, giro, direccion, telefono, email,
           logo_path, banco_*, condiciones, pie_pagina, iva_percent=19,
           next_quote_number)
clients(id, user_id, nombre, rut, contacto, email, telefono, direccion, notas)
quotes(id, user_id, business_id, client_id, numero, fecha, validez_dias,
       estado[borrador|enviada|aceptada|rechazada], atencion,
       subtotal, iva, total, snapshot_negocio jsonb, snapshot_cliente jsonb,
       updated_at)
quote_items(id, quote_id, orden, descripcion, cantidad, precio_unitario, total)
```
- `GRANT` explícitos + políticas RLS `auth.uid() = user_id` (ítems validados vía la cotización padre).
- Numeración correlativa por negocio con función `security definer` y bloqueo de fila.
- Totales calculados en cliente y revalidados en servidor. La IA nunca toca números.
- Bucket privado `logos` en Storage con políticas por carpeta `user_id/`.

### Módulos de la app
- `/auth` — email + contraseña (Supabase Auth) y recuperación de contraseña.
- `/` — dashboard: últimas cotizaciones, totales del mes, acceso rápido a "Nueva cotización".
- `/cotizaciones` — listado con búsqueda y filtros; editar, duplicar, eliminar, descargar PDF.
- `/cotizaciones/nueva` y `/cotizaciones/$id` — editor con selector de cliente, tabla de ítems, cálculo instantáneo de neto/IVA/total y vista previa del PDF.
- `/clientes` — CRUD completo con búsqueda.
- `/negocio` — datos del negocio, logo, datos bancarios, condiciones y pie de página.
- Rutas de datos bajo el guard `_authenticated`.

### PWA nativa-like
- **Manifest** completo: nombre, nombre corto, `display: standalone`, orientación, colores de tema y fondo, `scope` y `start_url`.
- **Iconos** 192/512 (incluye maskable) + `apple-touch-icon` para iPhone; favicon derivado del mismo ícono.
- **Splash screen**: color de tema/fondo para Android/Windows y pantalla de arranque propia de la app mientras hidrata la sesión; meta tags de app web para iOS.
- **Service worker** generado con `vite-plugin-pwa` (`generateSW`, `autoUpdate`), registrado solo en producción y nunca dentro del preview de Lovable: navegaciones `NetworkFirst`, assets con hash `CacheFirst`, más interruptor `?sw=off`.
- **Instalación**: botón "Instalar app" con `beforeinstallprompt` en Android/Windows/macOS e instrucciones guiadas para iPhone ("Compartir → Añadir a pantalla de inicio").
- **UI tipo app**: navegación inferior en móvil, áreas seguras (notch), sin rebote de scroll ni zoom accidental, transiciones rápidas.

### Offline y sincronización
- Persistencia local con **IndexedDB** (cache de negocio, clientes, cotizaciones e ítems) + persistencia de la caché de TanStack Query, para que la app abra y se navegue sin conexión.
- **Cola de salida (outbox)**: cada creación/edición/borrado sin red se guarda con `id` local (UUID) y marca de tiempo, y se reintenta automáticamente al volver la conexión o al reabrir la app.
- **Conflictos básicos**: resolución por `updated_at` (last-write-wins) con detección de edición remota más reciente; en ese caso se avisa al usuario y se conserva la versión local como copia en lugar de perder datos.
- Numeración correlativa asignada por el servidor al sincronizar (offline se muestra "borrador sin número") para evitar duplicados.
- Indicador visible de estado: en línea / sin conexión / N cambios pendientes.

### Asistente de redacción (IA)
- Botón "Mejorar redacción" por ítem (requiere conexión; se deshabilita offline con aviso).
- Server function con la clave nunca en el frontend; instrucción estricta: solo ortografía, gramática y tono profesional; prohibido inventar trabajos, materiales, medidas, garantías o cifras.
- Sugerencia con botones **Aceptar** / **Descartar**; nunca reemplaza automáticamente.

### PDF
- Generación vectorial con `@react-pdf/renderer` (texto seleccionable, A4, sin imágenes de fondo), disponible también offline.
- Reproduce la plantilla: cabecera redondeada con logo, bloque Cliente/Atención/Fecha, título "Cotización N.º", tabla de ítems con paginación automática, bloque Valor Neto / IVA / TOTAL, franja "DATOS DE TRANSFERENCIA" y pie con web y correo.

### Preparado para Capacitor
- Toda la lógica de datos aislada en una capa de repositorios y una capa de sincronización, sin dependencias del navegador dispersas por la UI, para que un futuro empaquetado con Capacitor no requiera tocar la lógica central.

### Calidad y seguridad
- Validación con Zod en cliente y servidor; sin datos simulados ni botones inertes.
- Código modular (`src/features/{quotes,clients,business,ai,pdf,sync}`), tipos generados de Supabase, listo para continuar en GitHub sin depender de Lovable.

### Detalles técnicos
Stack: TanStack Start + React 19 + Tailwind v4 + TanStack Query + Dexie (IndexedDB) + vite-plugin-pwa. Acceso a datos vía cliente Supabase del navegador con RLS; operaciones sensibles (numeración, IA) vía `createServerFn`. Sin Edge Functions.
