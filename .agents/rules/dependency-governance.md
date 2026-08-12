# Gobernanza de Dependencias

## Regla 1: No instalar dependencias sin justificación

Antes de agregar cualquier dependencia nueva al proyecto:

1. **Verificar si ya existe una alternativa instalada** que cubra la funcionalidad.
2. **Verificar si la funcionalidad puede resolverse con APIs nativas** del navegador o Node.js.
3. **Documentar la justificación** en el commit o PR con:
   - Qué funcionalidad aporta.
   - Por qué no se puede resolver con lo existente.
   - Qué archivos la consumirán.
4. **Actualizar `docs/dependencies/DEPENDENCY_MAP.md`** agregando la nueva dependencia con su evidencia de uso.

## Regla 2: No instalar kits UI completos

Al usar shadcn/ui u otros generadores de componentes:

- Instalar **solo los componentes que se van a usar inmediatamente**.
- No instalar el catálogo completo "por si acaso".
- Si un componente deja de usarse, marcarlo para revisión.

## Regla 3: Auditoría antes de agregar

Antes de agregar una dependencia que ya existe en el proyecto:

1. Consultar `docs/dependencies/DEPENDENCY_MAP.md` para verificar si está documentada.
2. Si la dependencia está listada como "sin uso" o "wrapper sin consumidores", evaluar si realmente se necesita reinstalar o si el wrapper existente es suficiente.

## Regla 4: Validar uso real periódicamente

Cada vez que se haga una refactorización mayor o se elimine una funcionalidad:

1. Verificar si las dependencias asociadas siguen siendo necesarias.
2. Actualizar `docs/dependencies/DEPENDENCY_MAP.md`.

## Regla 5: Dependencias con impacto en bundle

Dependencias grandes (>100KB sin gzip) requieren justificación adicional:

- `recharts` (~480KB)
- `@react-pdf/renderer` (~300KB) — actualmente justificada
- Cualquier nueva dependencia de tamaño similar

Considerar alternativas más livianas o lazy loading.

## Regla 6: No duplicar funcionalidad

El proyecto ya tiene estas capacidades cubiertas:

| Funcionalidad | Cubierta por |
|---|---|
| Formateo de fechas | APIs nativas (`Intl`, `Date`) en `src/lib/format.ts` |
| Validación | `zod` |
| Formularios | `react-hook-form` + `@hookform/resolvers` |
| Estado global auth | `src/lib/auth-state.ts` (vanilla) |
| Persistencia local | `dexie` (IndexedDB) |
| Notificaciones | `sonner` |
| Iconos | `lucide-react` |
| Estilos | Tailwind CSS v4 |
| Merge de clases | `clsx` + `tailwind-merge` via `cn()` |

No instalar alternativas (ej: no instalar `moment.js` si ya se usan APIs nativas, no instalar `react-toastify` si ya existe `sonner`).

## Regla 7: Archivos de referencia

- **Mapa de dependencias:** `docs/dependencies/DEPENDENCY_MAP.md`
- **Última auditoría:** `docs/dependencies/AUDIT_2026-08-12.md`
- **Arquitectura:** `docs/ARCHITECTURE.md`
- **Gobernanza:** Este archivo
