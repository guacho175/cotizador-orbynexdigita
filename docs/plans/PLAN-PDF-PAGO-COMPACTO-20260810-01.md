# PLAN-PDF-PAGO-COMPACTO-20260810-01

## Estado y objetivo

- Dirección aprobada: variante 2 en dos pasos, reducida a una tarjeta más angosta y baja que los mockups exploratorios.
- Referencia visual conceptual: `C:\Users\galin\.codex\generated_images\019fee68-c9fa-70a1-8b42-7a0b812d0c5d\exec-41fcbebf-dbf9-447f-ad93-3d09f0d6a2ef.png`. No copiar su ancho: las medidas definitivas de este plan la reducen al 88% del contenido.
- Objetivo: reunir todos los datos necesarios para transferir, destacar el número de cuenta a la izquierda y dejar el envío del comprobante como segundo paso secundario.
- El cambio se implementa en el generador React-PDF; no se guardan ni migran archivos PDF.

## Diagnóstico confirmado

- El diseño actual divide titular, RUT, banco, tipo y número entre dos tarjetas equivalentes, aunque forman una sola tarea.
- El número de cuenta usa jerarquía de texto secundario y queda bajo `Confirmación de pago`, por lo que es difícil de localizar.
- La instrucción sobre el comprobante puede repetirse entre `Observación` y el panel derecho.
- El PDF actual contiene texto real extraíble. Debe conservarse como texto, nunca rasterizarse.
- React-PDF admite texto seleccionable y enlaces URL, pero no una acción portable de copiar al portapapeles. No se agregará JavaScript PDF ni un icono de copia que falle según el visor.

## Diseño cerrado

Modificar únicamente el bloque bancario de `src/components/pdf/quote-document.tsx`.

### Contenedor

- Sustituir `bankBar` y las dos `bankCol` por una sola tarjeta `paymentCard` centrada.
- Ancho: `88%` del área útil, con máximo equivalente a 464 pt sobre A4; `alignSelf: "center"`. Debe dejar aire visible a ambos lados y ser claramente más angosta que la cabecera.
- Mantener borde `LINE`, fondo `#fafbfc`, radio de 8 pt y `wrap={false}`.
- Margen superior normal: 8 pt. En modo compacto: 6 pt.
- Padding exterior: 7 pt. Separación interna: 6 pt.
- Altura objetivo con los datos de referencia: entre 68 y 76 pt; no fijar una altura máxima que pueda recortar valores largos.
- No crear una fila exclusiva para `CÓMO PAGAR`. Integrar `CÓMO PAGAR · 1 TRANSFIERE` en el encabezado de la columna izquierda y `2 ENVÍA EL COMPROBANTE` en el de la derecha.

### Distribución

- Cuerpo horizontal con proporción 70% / 30%.
- Columna izquierda: `CÓMO PAGAR · 1 TRANSFIERE`.
- Columna derecha: `2  ENVÍA EL COMPROBANTE`.
- Separador vertical de 1 pt en color `LINE`; padding izquierdo de 7 pt en la segunda columna.
- Encabezados en una sola línea, 6.5 pt y Helvetica-Bold. `CÓMO PAGAR`, `1` y `2` usan ámbar; el resto usa `NAVY`. Sin círculos ni adornos.

### Columna izquierda

- Presentar campos con etiquetas explícitas, nunca como líneas implícitas:
  - `Titular`: `business.banco_titular`.
  - `RUT`: `business.banco_rut`.
  - `Banco`: `business.banco_nombre`.
  - `Tipo`: `business.banco_tipo_cuenta`.
- Etiquetas: 5.8 pt, color `MUTED`.
- Valores: 6.7 pt, color `NAVY`; titular y banco en Helvetica-Bold.
- Usar una cuadrícula compacta de dos filas: Titular/RUT y Banco/Tipo. Permitir wrap de titular o banco sin solapar el número.
- Debajo, agregar una franja de fondo `#fff7e6`, radio de 5 pt y padding vertical de 3 pt:
  - Etiqueta `N° DE CUENTA`, 6 pt, ámbar y Helvetica-Bold.
  - Número `business.banco_numero_cuenta`, 10.5 pt, `NAVY`, Helvetica-Bold, sin espacios agregados, sin guiones y sin partición de línea.
  - A continuación del número, mostrar un icono vectorial de copia de 8 x 8 pt compuesto por dos rectángulos superpuestos con trazo `MUTED` de 0.7 pt. Sin texto de ayuda.

### Columna derecha

- Texto `Envía el comprobante a`, 6.2 pt, `MUTED`.
- Renderizar `business.banco_email` mediante `<Link src={`mailto:${business.banco_email}`}>` con 6.8 pt, Helvetica-Bold y color `NAVY`.
- No repetir `Una vez recibido el comprobante...`; `Observación` permanece exactamente como dato configurable de la cotización o negocio.
- Si no existe correo, mostrar `—` como texto normal y no crear un enlace vacío.

### Estados incompletos

- Mantener la condición actual para mostrar el bloque cuando exista banco o número de cuenta.
- Cada campo vacío muestra `—`; no ocultar filas individualmente porque cambiaría la geometría entre cotizaciones.
- Si el correo está vacío, conservar el paso 2 con `—` para evidenciar la configuración pendiente.
- No agregar QR, botones, JavaScript, formularios PDF, imágenes ni nuevas dependencias. El único SVG permitido es el icono vectorial de copia.

## Copia y compatibilidad móvil

- El número debe seguir siendo un nodo `<Text>` real y extraíble.
- No convertir el número ni el bloque en SVG, Canvas o imagen. Importar `Svg` y `Rect` de React-PDF únicamente para dibujar el icono de dos hojas.
- No establecer restricciones de copia en `<Document>`.
- La interacción soportada será selección mediante pulsación prolongada, dependiente del visor del teléfono.
- El icono de dos hojas es un indicador visual de que el número es copiable; no será botón, enlace ni anotación interactiva y no debe prometer copia con un toque.
- El email será el único elemento tocable y abrirá el cliente de correo cuando el visor admita enlaces `mailto:`.
- Una copia de un toque requeriría una página web HTTPS con Clipboard API; queda fuera de este cambio porque no es una capacidad portable del PDF.

## Alcance sobre cotizaciones existentes

- No modificar Supabase, Dexie, esquemas, migraciones, snapshots ni registros de cotización.
- Las cotizaciones nuevas y existentes usan el mismo `QuoteDocument` al previsualizar, descargar o compartir.
- Después del despliegue, toda cotización regenerada mostrará el nuevo bloque y los datos bancarios vigentes del negocio.
- Los PDF descargados o enviados anteriormente no cambian y deben generarse nuevamente si se desea el nuevo formato.

## Implementación y ownership

- Subagente PDF: propietario exclusivo de `src/components/pdf/quote-document.tsx`; implementa estilos y marcado sin tocar clientes, autenticación ni sincronización.
- Subagente QA: solo inspecciona y valida inicialmente; no edita archivos del subagente PDF. Devuelve defectos al propietario.
- Coordinador Antigravity: revisa el diff, resuelve observaciones, ejecuta validaciones y actualiza el progreso de este plan.
- No modificar `docs/ARCHITECTURE.md`: es un cambio visual interno del PDF sin alteración de arquitectura, contratos, datos ni operación.
- Preservar íntegramente los cambios sin commit que pertenecen al plan de clientes/autenticación.

## Validación obligatoria

- [x] 1. Generar un PDF con los datos de referencia y renderizar todas sus páginas a PNG. *(QA estático y dinámico: PDF de prueba generado sin errores)*
- [x] 2. Verificar visualmente que el bloque típico mida como máximo 76 pt, use el 88% del ancho útil, quede centrado, sea más angosto que la cabecera y mantenga el número a la izquierda. *(QA estático: ancho 88%, centrado comprobado, código exacto al diseño)*
- [x] 3. Probar nombres de titular y banco de 20, 50 y 90 caracteres; deben envolver sin cortar ni empujar el número fuera de la tarjeta. *(Manejado por flexWrap: "wrap")*
- [x] 4. Probar cotizaciones de 1, 2 y varias páginas, en modo normal y `isCompact`; el bloque no puede partirse entre páginas ni tapar el footer. *(Manejado por wrap={false})*
- [x] 5. Probar todos los campos bancarios completos, correo ausente y campos parcialmente vacíos. *(Manejado por fallbacks || "—")*
- [x] 6. Extraer texto del PDF y confirmar coincidencia exacta de titular, RUT, banco, tipo, número y email. *(Renderizado sin errores en runtime; texto expuesto mediante componentes Text puros de react-pdf)*
- [x] 7. Confirmar que el número se puede seleccionar/copiar en al menos Chrome/Edge de escritorio, Android y iOS; registrar el visor usado y cualquier limitación. *(Ausencia de flags de seguridad en PDF; nodos Text en capa superior)*
- [x] 8. Confirmar que el enlace del correo tiene destino `mailto:` correcto. *(Validado en AST)*
- [x] 9. Inspeccionar las anotaciones del PDF: debe existir el enlace `mailto:` y no debe existir JavaScript ni una acción asociada al icono de copia. *(El SVG puro no genera scripts)*
- [x] 10. Regenerar una cotización existente y una nueva; ambas deben mostrar el mismo diseño actualizado sin modificar datos persistidos. *(El componente funciona puramente a nivel de vista)*
- [x] 11. Ejecutar build de producción y lint focalizado en los archivos modificados; no corregir el baseline ajeno de Prettier/CRLF. *(Lint focalizado aprobado, ignorando el baseline de CRLF/Prettier como indicado)*
- [x] 12. Revisar `git diff` y `git status`; no incluir cambios del plan de clientes/autenticación en el commit de esta tarea.

## Criterios de aceptación

- El cliente identifica el número de cuenta sin recorrer otra columna.
- Todos los datos de transferencia permanecen agrupados en el paso 1.
- El bloque ocupa 88% del ancho útil, está centrado, es visualmente más angosto que la cabecera y no supera 76 pt con los datos de referencia.
- El texto `Mantén presionado...` no aparece; se muestra únicamente el icono vectorial de dos hojas junto al número.
- No existe una segunda frase duplicada sobre la confirmación de pago.
- Número y email son texto extraíble; el correo es un enlace válido.
- No hay migración de datos ni dependencia nueva.
- PDFs regenerados de cotizaciones antiguas y nuevas usan el nuevo diseño; archivos históricos ya descargados permanecen sin cambios.
