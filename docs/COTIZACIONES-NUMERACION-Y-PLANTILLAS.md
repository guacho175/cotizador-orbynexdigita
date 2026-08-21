# Cotizaciones: numeración y plantillas PDF

## Reglas vigentes

1. Un negocio nuevo inicia su serie en 200.
2. La serie es global para el negocio e independiente del cliente.
3. Los negocios existentes nunca se resetean ni se renumeran; continúan desde el siguiente número seguro.
4. Un borrador no tiene número. Autoguardar, previsualizar y editar no consumen folios.
5. Descargar o compartir el PDF definitivo emite la cotización y asigna el número de forma transaccional e idempotente.
6. Un número emitido y la plantilla congelada no se pueden modificar.

Las migraciones históricas que alguna vez usaron 1 o 201 no se editan porque pueden haber sido aplicadas en otros entornos. La migración `20260821174913_enforce_quote_issuance_and_pdf_templates.sql` es la regla posterior y autoritativa: fija el valor inicial en 200, repara solamente el puntero del contador y preserva todos los folios existentes.

## Personalización modular

La plantilla base es `standard-v1`. La resolución sigue esta precedencia:

1. clave congelada en la cotización emitida;
2. override del cliente;
3. plantilla del negocio;
4. fallback `standard-v1`.

Para crear una personalización:

1. crear un componente versionado en `src/components/pdf/templates/` usando los modelos, tokens y bloques de `src/components/pdf/core/`;
2. añadir una entrada estática al registro cerrado `src/components/pdf/template-registry.tsx`;
3. asignar la clave al negocio o al cliente mediante un flujo administrativo validado;
4. agregar fixtures de 1, 3, 10 y 30 productos, textos extensos y un producto mayor que una página;
5. generar, renderizar e inspeccionar cada página antes de publicar.

No se deben insertar condiciones por UUID en la plantilla estándar, cargar componentes dinámicamente desde la base de datos ni reutilizar una clave para una versión estructural incompatible. Una nueva versión debe tener una clave o versión nueva para preservar cotizaciones emitidas.

## Contrato de emisión

`assign_quote_number(quote_id)` es la única operación del navegador autorizada para avanzar el contador. La función:

- valida `auth.uid()`;
- bloquea la cotización para que reintentos concurrentes devuelvan el mismo número;
- bloquea el negocio para serializar cotizaciones distintas;
- calcula `GREATEST(next_quote_number, MAX(numero) + 1, 200)`;
- congela plantilla, versión y fecha de emisión;
- devuelve el número asignado.

El cliente elimina de los upserts normales los campos administrados por el servidor. Los permisos de columna y el trigger de inmutabilidad constituyen una segunda defensa si aparece un cliente antiguo o defectuoso.

## Preflight de despliegue

Antes de aplicar la migración:

- confirmar que no existen duplicados de `(user_id, numero)` donde `numero IS NOT NULL`;
- registrar el mínimo, máximo y cantidad de números, sin descargar filas comerciales;
- comprobar las migraciones pendientes;
- ejecutar typecheck, pruebas, build y lint focalizado;
- generar y revisar los fixtures PDF.

Después de aplicar el esquema, desplegar el frontend compatible y verificar:

- la aplicación responde públicamente;
- la migración figura aplicada;
- `assign_quote_number` tiene ejecución solo para `authenticated`;
- el contador no disminuyó y no aparecieron duplicados;
- las cotizaciones históricas mantienen sus números.

## Recuperación

No revertir mediante una migración que vuelva a permitir escribir `numero` o el contador desde el navegador. Si el frontend debe revertirse, mantener el esquema endurecido y publicar una versión compatible que trate las cotizaciones como borradores hasta descargar/compartir. Ante duplicados previos, detener la creación del índice, documentar los IDs afectados de forma privada y acordar una reparación manual; no renumerar automáticamente.
