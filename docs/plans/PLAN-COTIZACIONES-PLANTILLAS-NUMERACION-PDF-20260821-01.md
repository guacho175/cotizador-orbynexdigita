# PLAN-COTIZACIONES-PLANTILLAS-NUMERACION-PDF-20260821-01

## Estado y alcance

- Fecha: 2026-08-21.
- Estado: completado, migrado, publicado y verificado en producción.
- Alcance analizado: plantillas PDF, fidelidad histórica, numeración, autoguardado, outbox/sincronización, orden y agrupación de cotizaciones, paginación PDF y cobertura de pruebas.
- La sección de diagnóstico conserva la evidencia del estado inicial. La ejecución aprobada se documenta en "Resultado de implementación".
- Supabase remoto al momento de este corte documental: sin lecturas ni escrituras; el preflight y despliegue se registrarán antes del cierre.

## Resumen ejecutivo

### Respuesta sobre personalización de plantilla

Sí, es posible personalizar por negocio o incluso por cliente mediante código sin romper el resto del sistema, pero primero hay que introducir un límite modular que hoy no existe.

En el estado actual hay una única plantilla global, `QuoteDocument`, consumida por vista previa, descarga y compartir. El logo y el color son datos del negocio, pero la estructura, geometría, tipografía y bloques están hardcodeados. Por tanto:

- Si se modifica directamente la estructura de `src/components/pdf/quote-document.tsx`, todas las cotizaciones regeneradas usarán el cambio.
- Los PDF ya descargados no cambian.
- Un condicional por UUID de negocio podría aislar un caso, pero no es una arquitectura mantenible.
- La solución recomendada es un registro cerrado de plantillas versionadas, resuelto mediante una clave persistida por negocio y con override opcional por cliente.
- La cotización emitida debe congelar la plantilla y los datos usados para poder regenerarse fielmente en el futuro.

### Respuesta sobre numeración

La causa de los saltos está confirmada. Cada autoguardado puede volver a enviar la misma cotización con `numero = null`; el servidor borra el número ya asignado, incrementa nuevamente el contador y asigna otro. Una cola de 22 autoguardados puede consumir 22 números al sincronizar, especialmente después de trabajar offline.

Además:

- El requisito pide comenzar en 200, pero las migraciones configuran 201.
- Una migración posterior renumeró históricos desde 1.
- El contador puede ser sobrescrito desde el formulario del negocio con una copia local antigua.
- No hay restricción única por negocio y número.
- La RPC no bloquea la cotización, por lo que dos llamadas concurrentes pueden consumir dos números para una sola cotización.

### Respuesta sobre orden y agrupación

El orden actual no representa el correlativo:

- `/panel` ordena por `updated_at DESC`; cada autoguardado mueve una cotización antigua al principio.
- `/cotizaciones` ordena solo por fecha; cotizaciones del mismo día quedan en un orden no contractual.
- Ninguna vista agrupa por cliente.

La organización recomendada es:

- `/panel` (dashboard): resumen más acordeones agrupados por `client_id`, con cotizaciones numeradas en orden descendente dentro de cada cliente.
- `/cotizaciones`: listado plano operativo, primero pendientes de numeración y luego correlativo descendente, con opción futura de invertir el orden.

### Respuesta sobre PDF de muchas páginas

Dos o tres páginas no son por sí mismas un error. El problema es que hoy se intenta mantener cada producto y todo el cierre como bloques indivisibles, y se reduce la tipografía mediante una heurística de caracteres que no conoce la altura real. Esto puede generar grandes huecos, bloques que saltan completos, productos demasiado altos para una página y precios aislados o anclados en posiciones poco claras.

No se recomienda resolverlo achicando indiscriminadamente la letra. Se debe permitir un corte semántico de los productos extensos, definir una regla de continuación, reservar correctamente encabezado y pie, y separar observaciones, totales y pago en unidades con reglas propias.

## Evidencia principal

| Severidad | Hallazgo                                                                              | Evidencia local                                                                                       | Consecuencia                                                                     |
| --------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| P0        | El estado React conserva `numero: null` después de guardar                            | `src/components/quotes/quote-editor.tsx:79-97`                                                        | Los guardados posteriores vuelven a persistir un número nulo                     |
| P0        | `saveQuote` reconstruye la fila desde el estado obsoleto y encola el payload completo | `src/lib/repo.ts:119-175`                                                                             | El número asignado por servidor no se preserva                                   |
| P0        | Cada payload nulo hace upsert y luego llama a `assign_quote_number`                   | `src/lib/sync.ts:121-154`                                                                             | Cada autoguardado puede consumir un correlativo                                  |
| P0        | La outbox es append-only por operación                                                | `src/lib/db.ts:42-48`; `src/lib/sync.ts:16-18`                                                        | Los autoguardados offline se reproducen uno por uno                              |
| P0        | El perfil envía `next_quote_number` junto con los datos editables                     | `src/lib/repo.ts:27-38`; `src/routes/_authenticated/negocio.tsx:135-153`                              | Puede restaurar un contador remoto antiguo                                       |
| P0        | No existe unicidad de número por negocio/usuario                                      | `supabase/migrations/20260731021141_14b3ad24-d7f3-44b6-bbaf-1969dca4ad63.sql:64-87`                   | Duplicados posibles bajo errores o concurrencia                                  |
| P1        | La primera migración de ajuste empieza en 201, no 200                                 | `supabase/migrations/20260731130000_start_quote_number_at_201.sql:1-3`                                | Incumple el número inicial solicitado                                            |
| P1        | La migración de estandarización renumeró históricos 1, 2, 3...                        | `supabase/migrations/20260805221634_standardize_quotes_and_archive.sql:16-40`                         | Históricos y nuevas cotizaciones quedan en series contradictorias                |
| P1        | `/panel` ordena por última edición                                                    | `src/routes/_authenticated/panel.tsx:26-33`                                                           | El autoguardado altera el orden visible                                          |
| P1        | `/cotizaciones` ordena solo por fecha                                                 | `src/routes/_authenticated/cotizaciones/index.tsx:35-43`                                              | No hay orden estable por correlativo                                             |
| P1        | Existe una sola plantilla PDF                                                         | `src/components/pdf/quote-document.tsx:320-328`; `src/lib/pdf.tsx:5-45`                               | Un cambio estructural afecta a todos los PDF regenerados                         |
| P1        | Los snapshots se guardan, pero el PDF usa negocio y cliente vivos                     | `src/components/quotes/quote-editor.tsx:86-118`                                                       | Una cotización antigua regenerada puede cambiar de identidad o plantilla         |
| P1        | Productos y cierre completo usan bloques indivisibles                                 | `src/components/pdf/quote-document.tsx:386-485`                                                       | Saltos grandes, overflow y cortes poco controlados                               |
| P1        | El modo compacto depende de caracteres/líneas globales                                | `src/components/pdf/quote-document.tsx:333-335`                                                       | No representa la altura real del documento                                       |
| P1        | Tipos generados y migraciones no coinciden                                            | `src/integrations/supabase/types.ts:205-262`; migración `20260805221634`                              | Quedan referencias a `folio_cliente` y falta el contrato actual de `is_archived` |
| P2        | Las consultas Dexie de panel/listado no filtran por usuario                           | `src/routes/_authenticated/panel.tsx:26-27`; `src/routes/_authenticated/cotizaciones/index.tsx:32-33` | El aislamiento depende de limpiar IndexedDB, no del selector                     |
| P2        | El panel incluye archivadas en métricas y actividad                                   | `src/routes/_authenticated/panel.tsx:29-39`                                                           | Resumen comercial incorrecto                                                     |
| P2        | No hay fixtures PDF multipágina representativos                                       | `generate_test_pdfs.tsx:41-73`; `test-pdf.tsx:25-27`                                                  | No existe evidencia automática de paginación robusta                             |

## Diagnóstico detallado de numeración y autoguardado

### Flujo causal confirmado

1. Una cotización nueva nace con UUID y `numero: null`.
2. Tras dos segundos sin cambios, el editor llama a `persist(true)`.
3. `saveQuote` guarda localmente una fila cuyo número proviene del estado React.
4. La operación completa se agrega a la outbox.
5. `pushItem` hace upsert del payload, incluido `numero: null`.
6. Después del upsert, `assign_quote_number` incrementa `businesses.next_quote_number` y asigna un número.
7. Dexie recibe el número, pero el estado React que devolvió `saveQuote` sigue nulo.
8. Al editar otra vez, el estado nulo sobrescribe el valor de Dexie y servidor.
9. Se repite el ciclo con el siguiente correlativo.

Esto explica saltos en minutos sin necesitar dos pestañas ni otro dispositivo. La concurrencia solo agrava el defecto.

### Invariantes objetivo

- El primer número disponible de un negocio nuevo es 200.
- Clientes A, B y A dentro del mismo negocio reciben 200, 201 y 202.
- El autoguardado de un borrador no consume números.
- La asignación es idempotente: repetir la misma solicitud devuelve el mismo número.
- Un número asignado no puede volver a `null`, cambiarse ni reutilizarse.
- Dos cotizaciones distintas concurrentes reciben números distintos.
- Un rollback no consume un número.
- Editar el perfil del negocio no puede modificar el contador.
- El cliente web no puede escribir directamente `numero` ni el contador.
- El servidor es la autoridad aunque fallen la outbox, el bloqueo local o la red.

### Momento recomendado para asignar número

Recomendación: los borradores permanecen sin número y la interfaz ofrece una transición explícita `Emitir y asignar número`. Descargar o compartir un PDF definitivo debe requerir esa transición; la vista previa puede llevar marca de borrador.

Ventajas:

- Los autoguardados no generan huecos.
- Borradores abandonados no consumen la serie.
- El número coincide con una cotización comercial emitida.
- La inmutabilidad queda asociada a una transición clara.

Alternativa aceptable: asignar en el primer Guardar manual. Es más simple, pero borradores abandonados o eliminados dejarán huecos legítimos. No se debe prometer a la vez numeración al crear borrador y cero huecos.

### Alcance del correlativo

Hoy `businesses(user_id)` es único, de modo que usuario y negocio son equivalentes en la práctica. La RPC asigna por `user_id`, no por `business_id`.

- Si continuará un negocio por cuenta, la corrección mínima puede mantener `(user_id, numero)` y documentar la equivalencia.
- Si una cuenta administrará varios negocios o varios usuarios pertenecerán a un negocio, se necesita `quotes.business_id`, membresías y un contador por `business_id`. Esto es una ampliación arquitectónica y debe decidirse antes de la migración definitiva.

### Reparación de números existentes

No renumerar automáticamente documentos que ya fueron descargados, enviados o aceptados. Sin historial de cambios no es posible demostrar que el número anterior de una fila fue 208 solo observando el valor actual.

Procedimiento futuro:

1. Hacer un preflight agregado de solo lectura.
2. Identificar duplicados, nulos, números menores de 200, máximo por negocio y contador actual.
3. Clasificar cada cotización como borrador nunca emitido o documento ya comunicado.
4. Preservar todo número comunicado externamente.
5. Dejar sin número solo borradores confirmados como no emitidos.
6. Ajustar el contador a `max(números preservados) + 1`, con mínimo 200.
7. Renumerar históricos solo con autorización expresa del dueño y evidencia de que nunca salieron del sistema.

## Arquitectura objetivo de plantillas PDF

### Resolución recomendada

Orden de precedencia:

1. Clave/version congelada en la cotización emitida.
2. Override opcional del cliente.
3. Plantilla por defecto del negocio.
4. `standard-v1` como fallback seguro.

Campos conceptuales:

- `businesses.pdf_template_key`, default `standard-v1`.
- `clients.pdf_template_key`, nullable, solo si se habilitan variantes por cliente.
- `quotes.pdf_template_key` y `quotes.pdf_template_version`, congelados al emitir.
- Snapshot validado de configuración/identidad suficiente para reproducir el documento.

Las claves deben resolverse contra una whitelist compilada. Nunca se debe ejecutar JSX, CSS, nombre de módulo o contenido arbitrario proveniente de la base de datos.

### Separación de módulos

Propuesta de destino:

```text
src/components/pdf/
  core/
    model.ts
    tokens.ts
    blocks/
  templates/
    standard-v1.tsx
    <negocio-o-cliente>-v1.tsx
  template-registry.ts
  quote-document.tsx        # dispatcher del registro
```

- `core/model.ts`: normaliza cotización, negocio, cliente, items y snapshots.
- `core/tokens.ts`: tamaños mínimos, espacios, colores y contratos comunes.
- `core/blocks/`: encabezado, identidad, item, totales, pago y pie reutilizables.
- `templates/standard-v1.tsx`: resultado visual actual, estabilizado antes de crear variantes.
- `template-registry.ts`: clave → componente y versión.
- `quote-document.tsx`: resuelve plantilla; no contiene condicionales por UUID.

### Fidelidad histórica

- Borrador: puede usar identidad y configuración vivas.
- Emitida/enviada/aceptada: congela plantilla, versión, identidad del negocio, cliente y referencia versionada al logo.
- Regeneración de una emitida: usa snapshots, no el perfil actual.
- Cambiar el default de un negocio solo afecta borradores/nuevas cotizaciones, salvo una acción explícita de reemitir.
- Los archivos ya descargados permanecen inmutables.

## Estrategia de paginación PDF

La documentación oficial de React-PDF v4 confirma que `wrap={false}` convierte un bloque en indivisible y que `minPresenceAhead`, `orphans` y `widows` son los controles previstos para evitar cortes pobres: <https://react-pdf.org/advanced>.

### Reglas objetivo

- Mantener tamaño legible; preferir una página adicional antes que reducir toda la tipografía.
- Posicionar explícitamente encabezado y pie repetidos y reservar espacio real en todas las páginas.
- Repetir un encabezado de detalle que no invada el contenido.
- Producto corto: mantener título, precio y descripción juntos.
- Producto largo: cabecera del producto y precio juntos; descripción cortable por párrafos/listas con indicador de continuación.
- Definir una única política de precio: mostrarlo en el primer fragmento y marcar continuación sin duplicar el valor, salvo decisión visual contraria.
- Usar `minPresenceAhead` para evitar que el título/precio quede al final sin contenido suficiente.
- Usar `orphans` y `widows` en descripciones largas.
- Permitir que observaciones extensas fluyan.
- Mantener subtotal/IVA/total juntos.
- Mantener pago como unidad propia; no obligarlo a compartir un bloque indivisible con observaciones y totales.
- Configurar separación de palabras para español o desactivarla explícitamente; no dejar la configuración inglesa por defecto.
- Reservar una marca `BORRADOR` cuando aún no exista número.

### Matriz de fixtures

- 1, 3, 10 y 30 productos.
- Descripciones de 50, 600 y 1200 caracteres.
- Un producto que exceda una página.
- Texto plano, párrafos y listas.
- Precio/cantidad con dígitos largos.
- Nombres, direcciones y correos extensos.
- Observación corta y extensa.
- Con y sin banco, logo y cliente.
- `standard-v1` y cada plantilla personalizada.
- Cotización borrador y emitida.

Validación por fixture:

- Generar PDF.
- Renderizar todas las páginas a PNG.
- Inspección visual de solapes, recortes, huecos anómalos y legibilidad.
- Extraer texto y validar número, productos, montos y datos bancarios.
- Verificar que ningún precio quede aislado de su producto.
- Verificar pie, encabezado y número de página en cada página.
- Medir tiempo y memoria en documentos grandes.

## Contrato de vistas y orden

### `/panel`: dashboard agrupado

- Filtrar siempre por `user_id` y excluir archivadas.
- Agrupar por `client_id`, nunca por nombre.
- Ordenar grupos con `Intl.Collator("es-CL", { numeric: true, sensitivity: "base" })` y desempatar por ID.
- Colocar `Sin cliente` al final.
- Si existe `client_id` pero falta el cliente local, usar `Cliente no disponible`; no fusionarlo con `Sin cliente`.
- Nombres duplicados siguen siendo grupos separados por UUID.
- Dentro de cada acordeón:
  - `Pendientes de numeración`, por `updated_at DESC`.
  - Numeradas por `numero DESC`.
  - Desempates: `fecha DESC`, `created_at DESC`, `id ASC`.
- Encabezado: nombre, RUT/identificador, cantidad y total activo.
- Usar un acordeón accesible con botón real, `aria-expanded`, `aria-controls`, foco visible y región asociada.

### `/cotizaciones`: listado global

- Mantener Activas/Archivadas.
- Filtrar por `user_id`.
- Mostrar pendientes de número en un bloque claramente rotulado.
- Orden principal: `numero DESC`.
- Desempates: `fecha DESC`, `created_at DESC`, `id ASC`.
- Crear un `Map<client_id, Client>` para evitar búsquedas `O(cotizaciones × clientes)`.
- Búsqueda por número con y sin ceros, nombre, estado y RUT si se decide incluirlo.
- Paginación inicial: 50 cotizaciones por página.
- Reiniciar página al cambiar búsqueda, archivo o criterio.

### Escala local-first

- Primera etapa: selectores puros/memoizados y paginación de render.
- Panel: 20-25 grupos por página; un cliente no se corta entre páginas.
- Cliente con muchas cotizaciones: 20 iniciales y `Ver más` dentro del acordeón.
- Si las métricas reales lo justifican, subir versión Dexie con índices compuestos:
  - `[user_id+is_archived+numero]`
  - `[user_id+client_id+numero]`
- Para varios miles de cotizaciones, evolucionar `pullAll` a pull incremental/cursor. Paginar solo la UI no reduce transferencia de Supabase.

## Plan de implementación por fases

### Fase 0 — decisiones y preflight

**COT-DEC-01 — Decisiones de producto**

- Confirmar asignación al emitir (recomendado) o al primer Guardar manual.
- Confirmar si habrá varios negocios/equipos por cuenta.
- Confirmar si la variante será por negocio, por cliente o ambas.
- Confirmar política de históricos ya enviados.
- Confirmar que `/panel` será el dashboard agrupado y `/cotizaciones` el listado plano.

**COT-DATA-01 — Preflight de producción, solo lectura**

- Ejecutar únicamente después de autorización.
- Servicio: Supabase Database.
- Presupuesto: hasta 4 consultas agregadas, sin `select *`, objetivo menor de 100 filas y menor de 1 MB.
- Obtener migraciones/esquema efectivo, contador por negocio, conteos de nulos/duplicados/mínimo/máximo y muestra mínima de anomalías.
- No descargar tablas completas, Storage ni logs prolongados.
- No hacer correcciones en esta fase.

### Fase 1 — detener el consumo de correlativos (P0)

**COT-SEQ-01 — Invariantes PostgreSQL**

- Crear una migración revisable y transaccional.
- Inicializar el siguiente disponible en 200 para negocios sin documentos emitidos.
- Añadir unicidad parcial por scope real del negocio y `numero` no nulo.
- Implementar una RPC idempotente con bloqueo de la cotización, relectura bajo lock, actualización atómica del contador y asignación del número.
- Mantener transacción corta y orden de locks consistente.
- Evitar una secuencia PostgreSQL si se exige que un rollback no consuma números; usar contador transaccional protegido.
- Proteger `numero` y el contador contra escritura directa del cliente.
- Hacer inmutable el número una vez asignado.
- Propagar errores; nunca silenciar un fallo de asignación.

**COT-SYNC-01 — Estado React, repositorio y outbox**

- Excluir campos controlados por servidor de upserts generales.
- Nunca reemplazar un número existente con `null` desde un payload antiguo.
- Fusionar la respuesta del servidor en Dexie y en el estado React.
- Compactar upserts pendientes por `entity + row_id`, preservando la base más antigua para conflictos y el payload más reciente.
- Hacer que delete reemplace upserts pendientes de la misma fila.
- Añadir coordinación entre pestañas; la idempotencia del servidor sigue siendo obligatoria.
- Mantener la entrada de outbox si falla la RPC.
- Separar `autoguardar borrador` de `emitir/asignar número`.

**COT-BIZ-01 — Proteger contador en perfil**

- Retirar `next_quote_number` del modelo editable y payload de negocio.
- No usar defaults de UI con valor 1.
- Mantener el contador en contrato interno/servidor.
- Verificar que editar logo, color o banco no cambie la serie.

### Fase 2 — corregir deriva y datos existentes

**COT-TYPE-01 — Alinear contratos**

- Confirmar migraciones aplicadas.
- Regenerar tipos Supabase.
- Eliminar `folio_cliente` residual.
- Incorporar `is_archived` y nuevos campos protegidos/plantilla.
- Alinear `src/lib/types.ts`, Dexie, repositorio y sync.

**COT-DATA-02 — Reparación controlada**

- Preparar script para ejecución humana con preflight, dry-run, backup, timeout, verificación y rollback/procedimiento de recuperación.
- No ejecutar automáticamente una renumeración masiva.
- Preservar números comunicados.
- Ajustar contador al máximo preservado + 1, mínimo 200.
- Activar unicidad solo después de resolver duplicados.

### Fase 3 — ordenar y agrupar interfaz

**COT-LIST-01 — Selectores y pruebas puras**

- Implementar `sortQuotes`, `filterQuotes` y `groupQuotesByClient` tipados.
- Cubrir nulos, duplicados anómalos, fechas iguales, cliente faltante y desempates.
- Hacer explícito el filtro por `user_id`.

**COT-LIST-02 — Listado global**

- Cambiar orden por fecha a correlativo determinista.
- Separar pendientes.
- Introducir `Map` de clientes, paginación y estados loading/empty/stale.
- Excluir archivadas de la vista activa.

**COT-DASH-01 — Acordeones por cliente**

- Sustituir o complementar Actividad reciente con Cotizaciones por cliente.
- Implementar accesibilidad de teclado y foco.
- Mantener grupos especiales Sin cliente y Cliente no disponible.
- Conservar métricas sin archivadas.

**COT-PULL-01 — Frescura de caché**

- Hacer que Sincronizar ahora y el retorno a primer plano puedan ejecutar pull después de flush.
- No depender del orden recibido de Supabase o IndexedDB.
- Evaluar pull incremental solo con métricas.

### Fase 4 — modularizar PDF sin cambio visual

**COT-PDF-CORE-01 — Línea base**

- Crear fixtures PDF deterministas antes del refactor.
- Corregir errores TypeScript actuales de estilos condicionales.
- Separar core, tokens, bloques, `standard-v1` y registry.
- Probar que `standard-v1` conserva la salida visual esperada.

**COT-PDF-REG-01 — Resolución versionada**

- Añadir claves de plantilla por negocio y, si se aprueba, cliente.
- Congelar clave y versión al emitir.
- Resolver solo contra whitelist.
- Usar snapshots en cotizaciones emitidas.

**COT-PDF-CUSTOM-01 — Primera plantilla aislada**

- Crear un componente versionado separado para el negocio/cliente objetivo.
- Reutilizar bloques comunes donde corresponda.
- Asignar la clave solo al objetivo; no usar condicional por UUID.
- Validar estándar y variante en la misma matriz de fixtures.

### Fase 5 — paginación robusta y QA visual

**COT-PDF-PAGE-01 — Layout multipágina**

- Rehacer reglas de encabezado, items largos, continuación, observaciones, totales y pago.
- Retirar la dependencia del modo compacto global como solución principal.
- Definir tamaños mínimos legibles.
- Incorporar `minPresenceAhead`, `orphans`, `widows` y política de separación en español.

**COT-PDF-QA-01 — Verificación**

- Generar, renderizar e inspeccionar todas las páginas de la matriz.
- Automatizar validaciones de texto y montos.
- Registrar fixtures/goldens visuales revisables.
- Probar vista previa, descarga y compartir.
- Probar regeneración histórica desde snapshots.

### Fase 6 — documentación, despliegue y observación

**COT-DOC-01 — Documentación relacionada**

- Actualizar `docs/ARCHITECTURE.md` con ciclo borrador/emisión, autoridad del servidor, registry de plantillas y snapshots.
- Crear un documento operativo de numeración, reparación y rollback.
- Crear guía de incorporación/versionado de plantillas.
- Actualizar README si cambia el flujo visible de Guardar/Emitir.
- Documentar límites de volumen y estrategia de sync.

**COT-REL-01 — Despliegue**

- Base de datos compatible primero.
- Verificar RPC y permisos en staging/local.
- Desplegar cliente después del esquema.
- Observar durante una ventana acotada: contador, fallos de RPC, outbox, duplicados y tiempos PDF.
- Tener rollback compatible que no vuelva a habilitar escritura de números nulos.

## Ownership y concurrencia

Para evitar solapamientos, ejecutar con ownership explícito:

| Workstream                                            | Owner exclusivo                  | Archivos/responsabilidad                                               | Dependencias                |
| ----------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------- | --------------------------- |
| `COT-SEQ-*`, `COT-DATA-*`                             | Agente PostgreSQL/Supabase       | migraciones, RPC, constraints, preflight y reparación                  | `COT-DEC-01`                |
| `COT-SYNC-*`, `COT-BIZ-*`                             | Agente sync/offline              | `src/lib/db.ts`, `repo.ts`, `sync.ts`, estado del editor y negocio     | contrato DB de `COT-SEQ-01` |
| `COT-LIST-*`, `COT-DASH-*`                            | Agente frontend de listados      | selectores, `/panel`, `/cotizaciones`, accesibilidad                   | `COT-TYPE-01`               |
| `COT-PDF-CORE-*`, `COT-PDF-REG-*`, `COT-PDF-CUSTOM-*` | Agente arquitectura PDF          | registry, core y templates                                             | decisiones de plantilla     |
| `COT-PDF-PAGE-*`                                      | Mismo owner PDF                  | layout multipágina                                                     | `COT-PDF-CORE-01`           |
| `COT-PDF-QA-*`                                        | Agente QA read-only inicialmente | fixtures, render, inspección y reporte; devuelve defectos al owner PDF | cada entrega PDF            |
| `COT-DOC-*`                                           | Owner documentación              | arquitectura, runbooks y guía de plantillas                            | contratos finales           |

Ningún agente debe revertir cambios ajenos. Si dos workstreams necesitan el mismo tipo compartido, el owner de contratos integra el cambio después de acordar la interfaz.

## Criterios de aceptación

### Numeración

- Primera cotización emitida de negocio nuevo: 200.
- Secuencia entre clientes: A=200, B=201, A=202.
- 50 autoguardados offline consumen cero números.
- 20 llamadas concurrentes para una cotización devuelven el mismo número y consumen uno.
- 20 cotizaciones distintas concurrentes reciben números únicos.
- Reintento tras respuesta perdida devuelve el número existente.
- Perfil de negocio no altera el contador.
- Payload con `numero: null` no borra un número emitido.
- No hay duplicados antes/después de activar unicidad.

### Listados

- Orden numérico determinista con nulos separados.
- El panel agrupa por UUID de cliente y ordena dentro de cada grupo.
- Dos clientes con el mismo nombre no se fusionan.
- Archivadas no aparecen ni suman en panel activo.
- Carga remota en orden aleatorio produce el mismo orden visual.
- Búsqueda, paginación y archivo no duplican ni omiten filas.
- Navegación por teclado y foco del acordeón verificadas.

### PDF y plantillas

- Cambiar/asignar una variante a un negocio o cliente no altera `standard-v1`.
- Una cotización emitida se regenera con la misma plantilla/identidad congelada.
- Ningún fixture presenta solape, recorte, precio huérfano o pie invadido.
- Un producto mayor que una página tiene continuación comprensible.
- Totales permanecen juntos y correctos.
- Todas las páginas conservan encabezado/pie y numeración.
- Texto, enlaces y montos son extraíbles y verificables.

## Validaciones realizadas durante la auditoría

- Revisión de instrucciones, rama, `git status`, `git diff --stat` y nombres del diff antes de trabajar.
- Árbol de trabajo limpio antes de crear este plan.
- Inspección estática de rutas, editor, repositorio, Dexie, outbox, sync, tipos, migraciones y React-PDF.
- Tres agentes especializados revisaron por separado numeración/autoguardado, dashboard/listados y plantillas/paginación; sus hallazgos fueron reconciliados en este documento.
- `npx tsc --noEmit`: falló. Hallazgos relevantes:
  - estilos condicionales de React-PDF producen valores `false/undefined` incompatibles;
  - `/panel` y `src/lib/pdf.tsx` aún referencian `folio_cliente` y llaman `quoteNumber` con dos argumentos;
  - existen errores adicionales en pruebas de clientes.
- `npm run lint`: falló con 5056 problemas; la mayoría corresponde a formato/CRLF y archivos generados o de prueba incluidos por la configuración. No se aplicó `--fix`.
- No se ejecutó build ni navegador.
- No se generó ni editó ningún PDF.
- No se reprodujo visualmente el caso real de muchas páginas porque no se suministró un PDF representativo y los fixtures existentes no cubren ese escenario.
- No se verificó el esquema efectivo de producción; las conclusiones de base de datos se basan en migraciones y tipos locales, que muestran deriva.

## Limitaciones y riesgos de ejecución

- La reparación exacta del supuesto 208 anterior no puede inferirse con certeza sin logs/auditoría o evidencia externa.
- Crear una restricción única fallará si producción ya contiene duplicados; requiere preflight y reparación previa.
- Cambiar el momento de numeración modifica el flujo visible y debe coordinarse con PDF definitivo, estados y archivado.
- La compatibilidad offline exige que la corrección se haga en servidor y cliente; arreglar solo React reduce síntomas pero no garantiza integridad.
- Una plantilla personalizada sin versionado volvería a introducir cambios históricos al regenerar.
- La paginación debe aprobarse visualmente con contenido real, no solo mediante compilación o extracción de texto.

## Orden recomendado de ejecución

1. Aprobar decisiones de `COT-DEC-01`.
2. Ejecutar preflight acotado `COT-DATA-01`.
3. Resolver P0: `COT-SEQ-01`, `COT-SYNC-01` y `COT-BIZ-01`.
4. Alinear tipos y reparar datos de forma controlada.
5. Corregir orden/listados y añadir acordeones.
6. Crear línea base PDF y modularizar `standard-v1`.
7. Añadir resolución por negocio/cliente y primera variante.
8. Corregir paginación y ejecutar QA visual completo.
9. Actualizar documentación relacionada, desplegar por capas y observar.

## Resultado de implementación

### Entregado

- Numeración separada del autoguardado. Los borradores permanecen sin folio y descargar/compartir ejecuta una emisión explícita.
- RPC idempotente con bloqueo de la cotización y del negocio, contador con piso 200, unicidad parcial e inmutabilidad de campos emitidos.
- Negocios existentes continúan desde el mayor valor seguro sin modificar números históricos.
- Payloads normales y formulario de negocio ya no pueden escribir `numero`, versión/fecha de emisión ni `next_quote_number`.
- Outbox coalescida por entidad y fila; un autoguardado no reproduce todos los estados intermedios.
- Registro cerrado de plantillas con `standard-v1`, precedencia cotización/cliente/negocio/fallback y snapshots de identidad para emitidas.
- PDF dividido en core, bloques y templates; productos largos usan continuaciones semánticas y el precio solo aparece en el primer fragmento.
- `/panel` agrupa por UUID de cliente mediante acordeones; `/cotizaciones` mantiene listado plano. Ambos separan pendientes, ordenan correlativos y filtran por usuario/archivo.
- Documentación operativa y arquitectura actualizadas.

### Validación local

- `npm test`: 9/9 pruebas aprobadas.
- `npm run typecheck`: aprobado.
- `npm run build`: aprobado; conserva advertencias no bloqueantes previas sobre archivos auxiliares dentro del árbol de rutas, un selector CSS y tamaño de chunks.
- ESLint focalizado en todos los archivos modificados: aprobado sin errores ni advertencias.
- `git diff --check`: aprobado.
- QA PDF: seis fixtures, 19 páginas generadas/renderizadas e inspeccionadas. Se corrigió un encabezado repetido que se superponía en continuaciones y se regeneró la matriz completa.
- `npm run lint` global: no aprobado por deuda previa fuera del alcance (2.488 problemas, principalmente Prettier/CRLF en archivos no modificados). No se ejecutó un formateo masivo que alterara trabajo ajeno.

### Estado de servicios externos

- Producción vigente de Vercel comprobada en estado `Ready` y el alias público respondió HTTP 200 antes de publicar cambios.
- Supabase local no estuvo disponible porque Docker/Postgres local no estaba activo.
- La CLI de Supabase rechazó `migration list` y el primer preflight con HTTP 403 porque estaba autenticada con otra identidad o rol. No recibió filas ni modificó datos.
- Con autorización del usuario se usó su sesión activa de Chrome para el proyecto `thowtbbzkccavbuhiakj`.
- Preflight remoto: 2 negocios, 15 cotizaciones numeradas, rango 201–382 y 0 duplicados.
- Migración `20260821174913` aplicada dentro de una transacción y registrada en `supabase_migrations.schema_migrations`.
- Verificación posterior: default 200, contadores existentes 204 y 383, 15 folios históricos aún en 201–382, 0 duplicados, 0 emitidas con metadata incompleta e índice único presente.
- Permisos verificados: `authenticated` puede ejecutar la RPC; `anon` no puede; el cliente autenticado no puede actualizar `quotes.numero` ni `businesses.next_quote_number`.
- Cuota/transferencia Supabase: se consultaron solo agregados y metadatos, con 6 filas totales devueltas; no se descargaron registros comerciales ni archivos. Servicios tocados: Management API (2 intentos 403) y PostgreSQL/SQL Editor (preflight, migración y verificaciones). Storage, Auth y Realtime no se modificaron.
- Git: commit funcional `066bcb3`, rama de trabajo publicada y avance rápido de `main` enviado a `origin/main`.
- Vercel: deployment de producción `dpl_G8E3QnnaMLscTfnuwmPPSAMk2J9a` en estado `Ready`, con alias `https://cotizador.orbynexdigital.cl` y `https://cotizador-orbynexdigita.vercel.app`.
- Smoke test: ambos alias respondieron HTTP 200; el dominio principal entregó 4.305 bytes. El wrapper de despliegue terminó con un falso negativo al no reconocer el formato nuevo de salida de Vercel, pero la inspección directa confirmó `Ready` y los alias activos.
