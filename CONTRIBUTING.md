# Guía de Contribución

¡Gracias por tu interés en contribuir a Cotizador Orbynex Digital!

## Proceso de Desarrollo

1. **Fork** el repositorio.
2. Crea una **nueva rama** desde `main` (ejemplo: `feat/nueva-funcion` o `fix/correccion-error`).
3. Realiza tus cambios.
4. Asegúrate de ejecutar `npm run build` y `npm run lint` para validar tu código.
5. Haz commit de tus cambios utilizando **Conventional Commits** (ejemplo: `feat: add new PDF export option`).
6. Sube tus cambios y abre un **Pull Request** (PR).

## Estándares de Código

- Usamos **TypeScript** para todo el código. Por favor, evita usar `any` siempre que sea posible.
- Usamos **ESLint** y **Prettier**. Ejecuta `npm run format` antes de hacer commit.
- **Backend / Supabase**: Las interacciones con Supabase ocurren en el servidor (`.server.ts`). Asegúrate de no exponer lógica de negocio sensible en el cliente.
- **Secretos**: ¡Nunca hagas commit de `.env` o `.env.local`! Usa `.env.example` para añadir nuevas variables de entorno requeridas.

## Configuración Local

Lee el `README.md` para las instrucciones detalladas de configuración local con Supabase y Vite.
