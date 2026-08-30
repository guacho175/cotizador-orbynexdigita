# Plan de flujo de cotizaciones, recargo y sincronización

## Estado y alcance

- Identificador: `COT-FLOW-20260830-01`.
- Estado: implementado y validado localmente; pendiente de aplicar la migración antes de desplegar el frontend.
- Objetivo: simplificar el ciclo comercial sin cambiar los valores históricos de `quotes.estado`, permitir un recargo configurable por negocio y opcional al emitir, adaptar compartir a dispositivos compatibles y reducir falsos conflictos de sincronización.
- Restricciones: preservar numeración, PDF, trabajo offline, cotizaciones históricas, RLS y el cambio ajeno existente en `.gitignore`.

## Contrato funcional aprobado

| Valor persistido | Etiqueta visible         | Autoridad                                         |
| ---------------- | ------------------------ | ------------------------------------------------- |
| `borrador`       | Borrador                 | Automático mientras la cotización no esté emitida |
| `enviada`        | Realizada                | Automático al emitir y preparar el PDF definitivo |
| `aceptada`       | Aceptada por el cliente  | Cambio comercial posterior a la emisión           |
| `rechazada`      | Pospuesta por el cliente | Cambio comercial posterior a la emisión           |

- Guardar y autoguardar nunca emiten ni cambian manualmente el estado de un borrador.
- Emitir exige cliente, fecha, validez válida, al menos una línea completa y total positivo.
- La emisión sincroniza, asigna folio de manera idempotente y establece `enviada` en la misma operación transaccional.
- Los estados posteriores solo se pueden cambiar en cotizaciones emitidas.
- El negocio define una etiqueta y porcentaje decimal de recargo. Cada emisión confirma si aplica el recargo configurado o usa 0%.
- En escritorio se ofrecen guardar, vista previa y descargar. Compartir se ofrece solo en dispositivos compatibles y usa un archivo previamente preparado para conservar el gesto de usuario.

## Diseño técnico

1. Centralizar etiquetas, transiciones y validación de emisión en módulos de dominio puros y probables.
2. Mantener los cuatro valores persistidos para evitar reescritura histórica; cambiar etiquetas y reglas en frontend y Postgres.
3. Añadir `businesses.tax_label` como dato configurable y mantener `iva_percent` como porcentaje decimal compatible con datos existentes.
4. Actualizar `assign_quote_number` para validar integridad comercial y establecer `estado = 'enviada'` de forma atómica.
5. Añadir una restricción/trigger de ciclo de vida que impida estados comerciales sin `issued_at` y el retorno de una cotización emitida a borrador.
6. Crear un único método de repositorio para cambios de estado que reutilicen outbox y sincronización.
7. Separar preparación del PDF de descarga/compartir; reutilizar el mismo blob y evitar generación redundante.
8. Reconciliar autoguardados en vuelo actualizando su revisión base después de cada push y no sobrescribir una edición local más nueva con una respuesta remota anterior.
9. Mostrar lenguaje de sincronización orientado a acciones y conservar registros de conflicto como atendidos en lugar de eliminarlos.

## Implementación por fases

### Fase 1 — dominio y persistencia

- Añadir utilidades puras de ciclo de vida, preparación para emisión y presentación del recargo.
- Extender tipos locales, tipos Supabase y valores por defecto.
- Crear migración imperativa para `tax_label`, validaciones y RPC de emisión.
- Incorporar pruebas unitarias de reglas y cálculos.

### Fase 2 — editor y PDF

- Eliminar el selector manual de estado del editor.
- Permitir guardar borradores incompletos y validar únicamente al emitir.
- Añadir confirmación accesible con/sin recargo antes del PDF definitivo.
- Usar etiqueta y porcentaje configurados en editor y PDF.
- Preparar una sola vez el archivo para descarga o compartir.

### Fase 3 — panel, listado y sincronización

- Incorporar un selector reutilizable de estado comercial en panel y listado para cotizaciones emitidas.
- Mantener borradores como etiqueta no editable.
- Ocultar compartir en escritorio o cuando no exista soporte apropiado.
- Corregir falsos conflictos de ediciones propias en vuelo y mejorar el indicador.

### Fase 4 — documentación y verificación

- Actualizar arquitectura y guía operativa con el nuevo ciclo y contrato tributario comercial.
- Ejecutar pruebas, typecheck, lint y build.
- Revisar accesibilidad, duplicación, hooks, dependencias y comportamiento responsive.
- Revisar diff, excluir cambios ajenos y crear commit local.

## Criterios de aceptación

- Un borrador incompleto se guarda sin folio y sin selector manual.
- No se puede emitir sin cliente, línea válida, fecha, validez y total positivo.
- Emitir asigna un único folio y deja el estado visible como Realizada.
- Realizada puede cambiar a Aceptada por el cliente o Pospuesta por el cliente desde panel/listado.
- La base rechaza estados comerciales sin emisión incluso con un cliente manipulado.
- El negocio acepta porcentajes decimales y una etiqueta configurable; una cotización puede emitirse con ese recargo o sin él.
- El PDF usa la etiqueta correcta y no muestra `IVA` cuando el negocio configuró otra denominación.
- Compartir no aparece en escritorio y, en móvil compatible, se ejecuta desde un segundo gesto sobre un archivo preparado.
- Autoguardados propios consecutivos no producen alertas falsas ni pisan una edición local más reciente.
- No se incorporan dependencias nuevas ni se modifica `.gitignore`.

## Validaciones previstas

- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Revisión focalizada de migración, privilegios, RPC y diff final.
- Verificación visual local en móvil, tablet y escritorio si el entorno autenticado está disponible.

## Riesgos y límites

- La migración quedará preparada y validada localmente, pero no se aplicará a producción sin una operación posterior autorizada y verificación de identidad.
- Los registros históricos con `enviada`, `aceptada` o `rechazada` conservarán su valor y adoptarán las nuevas etiquetas visibles.
- La aplicación trata el porcentaje configurado como recargo comercial aditivo; no sustituye el cálculo ni la emisión tributaria oficial del SII.

## Resultado de implementación

- Se conservaron los valores de estado existentes y se mapearon a las etiquetas comerciales aprobadas.
- El editor presenta el estado calculado, permite guardar borradores incompletos y exige datos completos solo para emitir.
- La emisión confirma el uso del recargo configurado o 0%, asigna folio y establece `enviada`/Realizada de manera atómica en la migración.
- El listado permite actualizar el estado comercial únicamente de cotizaciones emitidas; los borradores no ofrecen selector.
- Se agregó etiqueta de recargo configurable y soporte decimal en Negocio; el PDF usa la etiqueta del negocio.
- Compartir se restringe a dispositivos táctiles con soporte real de archivos y exige un segundo gesto sobre el PDF ya preparado.
- La sincronización conserva una edición local producida durante un push y actualiza su base de revisión; los registros de conflicto ahora se marcan como revisados en vez de borrarse.
- Documentación actualizada: `docs/ARCHITECTURE.md` y `docs/COTIZACIONES-NUMERACION-Y-PLANTILLAS.md`.

## Validaciones realizadas

- `npm test`: 14 pruebas aprobadas.
- `npm run typecheck`: aprobado.
- Lint focalizado de los archivos modificados: aprobado.
- `npm run build`: aprobado. Conserva avisos preexistentes de archivos de prueba tratados como rutas, una regla CSS inválida y tamaño de bundle PDF.
- No fue posible ejecutar una inspección visual autenticada: el servidor de desarrollo local respondió HTTP 500 en la raíz, aunque el build SSR/cliente completó. La comprobación del runtime de navegador también reportó artefactos del plugin de Codex ausentes; no se modificaron ni sesiones ni configuración global.
- No se aplicó la migración ni se ejecutaron comandos contra Supabase remoto. El CLI local no pudo cargar el perfil heredado `default` para crear la migración, por lo que se creó el archivo con la marca temporal local y deberá aplicarse en un paso autorizado posterior.
