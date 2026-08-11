# Plan: PLAN-CLIENTES-NAV-20260810-01

## Objetivos
- Mejorar el listado de clientes usando una tabla semántica y responsiva.
- Implementar búsqueda y paginación puramente locales con Dexie (IndexedDB), manteniendo filtros por `user_id`.
- Ordenación robusta (Intl.Collator "es-CL").
- Manejar un estado de autenticación compartido y sólido en el enrutamiento para evitar llamadas innecesarias a Supabase.
- Eliminar dependencias de React Query si ya no se utilizan.

## Decisiones Técnicas
- Escala objetivo inicial: hasta 1.000 clientes por cuenta.
- Paginación fija: 50 filas.
- Orden alfabético: español de Chile, insensible a mayúsculas y acentos, con orden numérico natural.
- Arquitectura offline-first con Dexie y Supabase.
- Sin migraciones de Supabase (no tocar tablas ni RLS).
- Fases posteriores: sincronización por `updated_at`, tombstones, paginación remota, optimización O(n²).

## Responsables
- Coordinador Principal (Antigravity): Inspecciona, implementa, integra, prueba y reporta.
- Subagente A: Implementación de la tabla de clientes, búsqueda, paginación y acciones.
- Subagente B: Estado de autenticación compartido en el router y limpieza de dependencias.
- Subagente C: Verificación y control de calidad sobre los diffs generados.

## Progreso
- [x] Inicialización del plan y orquestación de subagentes.
- [ ] Subagente A finalizado.
- [ ] Subagente B finalizado.
- [ ] Revisión por Subagente C.
- [ ] Integración y pruebas.
- [ ] Actualización de documentación de arquitectura.
- [ ] Entrega final.

## Validaciones Pendientes
1. Orden (angelica, Ángela, Farmacia, víctor, Victor 2, Victor 10).
2. Búsqueda por nombre, RUT, contacto, correo y teléfono (insensible a acentos).
3. Datos (comportamiento con diferentes cantidades, no mostrar datos de otros, paginación).
4. Autenticación (login, logout, recarga, sin llamadas repetidas en la navegación).
5. Rendimiento (navegación < 200ms, búsqueda < 100ms, bundle base).
6. Calidad (build, lint, no regresiones).
