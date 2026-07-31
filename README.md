# Quote Craft

Sistema de Cotizaciones Inteligentes (MVP)

Quiero que construyas una aplicación web profesional, completamente funcional y preparada para producción utilizando Lovable.

Voy a proporcionar una plantilla de cotización (PDF o imagen). Esa plantilla representa el diseño que deseo obtener.

Tu objetivo es reconstruirla de forma dinámica, no utilizarla como imagen de fondo.

Objetivo

Desarrollar una plataforma que permita crear, administrar, almacenar, sincronizar y descargar cotizaciones profesionales.

El sistema debe reducir al mínimo el tiempo necesario para elaborar una cotización, manteniendo un aspecto profesional y permitiendo reutilizar información previamente registrada.

La aplicación debe ser intuitiva para usuarios sin conocimientos técnicos.

Arquitectura

Toda la persistencia de datos debe realizarse exclusivamente sobre mi propio proyecto de Supabase.

No utilices bases de datos temporales, mock data ni servicios propietarios.

Toda la autenticación debe utilizar Supabase Auth.

Todo el almacenamiento debe utilizar Supabase Storage.

Toda la información debe pertenecer exclusivamente al usuario autenticado mediante Row Level Security.

El código debe permanecer sincronizable con GitHub y no depender de permanecer dentro de Lovable para continuar el desarrollo.

Producto

El sistema debe permitir administrar:

negocio

clientes

cotizaciones

productos o servicios

configuraciones generales

Cada usuario podrá administrar únicamente su propia información.

Configuración del negocio

El sistema debe permitir registrar y editar la información del negocio que aparecerá automáticamente en todas las cotizaciones.

Como mínimo:

nombre

logo

RUT

giro

dirección

teléfono

correo

datos bancarios

porcentaje de IVA

condiciones comerciales

pie de página

Clientes

Debe existir un módulo completo para administrar clientes reutilizables.

Cotizaciones

El sistema debe permitir crear cotizaciones compuestas por múltiples productos o servicios.

Cada cotización deberá mantener historial y poder modificarse posteriormente.

Debe ser posible:

crear

editar

duplicar

eliminar

buscar

filtrar

descargar nuevamente

Las cotizaciones deben mantener numeración correlativa por negocio.

Productos y servicios

Cada ítem debe permitir ingresar:

descripción

cantidad

precio unitario

Los cálculos deben realizarse automáticamente.

La inteligencia artificial nunca debe intervenir en cálculos monetarios.

Inteligencia Artificial

Cada producto debe incluir un asistente de redacción.

La IA únicamente podrá:

mejorar la redacción

corregir ortografía

hacer más profesional la descripción

Nunca podrá:

inventar trabajos

inventar materiales

inventar medidas

inventar garantías

modificar precios

calcular impuestos

calcular totales

La sugerencia siempre deberá ser aceptada manualmente por el usuario.

Nunca reemplazar automáticamente el contenido.

La clave del proveedor de IA nunca debe exponerse en el frontend.

Toda comunicación con la IA debe realizarse mediante backend seguro.

PDF

Voy a entregar una plantilla.

Debe reconstruirse dinámicamente.

No utilizar imágenes como documento.

Debe soportar:

múltiples páginas

múltiples productos

descripciones largas

impresión profesional

descarga inmediata

El resultado visual debe ser muy similar a la plantilla entregada.

Interfaz

Quiero una interfaz moderna, limpia, rápida y profesional.

Debe funcionar correctamente en:

escritorio

tablet

teléfono

Debe priorizar rapidez de uso.

La experiencia debe permitir crear una cotización en pocos minutos.

Progressive Web App

La aplicación debe construirse desde el inicio como una Progressive Web App.

Debe poder instalarse desde el navegador en Android, iPhone, Windows y macOS.

Debe comportarse como una aplicación instalada.

Debe quedar preparada para empaquetarse posteriormente con Capacitor si en el futuro deseo publicarla en Google Play o App Store.

Seguridad

La aplicación debe seguir buenas prácticas de ingeniería.

Implementar correctamente:

autenticación

autorización

Row Level Security

validaciones

protección de secretos

manejo de errores

No sacrificar seguridad para simplificar la implementación.

Calidad del código

Quiero una aplicación mantenible.

No deseo únicamente un prototipo visual.

Todo lo que aparezca en la interfaz debe funcionar realmente.

No utilizar botones ficticios.

No utilizar datos simulados.

No utilizar implementaciones temporales.

El código debe ser modular, limpio, escalable y fácil de continuar desarrollando fuera de Lovable.

Entregable esperado

Espero recibir una aplicación funcional que permita:

autenticarse

configurar el negocio

administrar clientes

crear cotizaciones

agregar múltiples productos o servicios

utilizar IA para mejorar descripciones

calcular automáticamente subtotales, IVA y total

almacenar toda la información en Supabase

sincronizar la información entre dispositivos

generar y descargar PDF profesionales

consultar y editar cotizaciones anteriores

funcionar correctamente como PWA instalada

Si durante el desarrollo encuentras decisiones menores de implementación, resuélvelas aplicando buenas prácticas de arquitectura y experiencia de usuario.

Prioriza siempre la calidad del producto final, la mantenibilidad del código y la independencia del proyecto respecto de Lovable. El resultado debe quedar listo para continuar evolucionándolo desde GitHub y Supabase sin depender de la plataforma.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://cotizador-orbynexdigita.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5477d6d1-e70a-4de7-9c61-883c7ea4b5f7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
