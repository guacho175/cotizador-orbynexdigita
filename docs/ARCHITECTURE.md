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
El PDF se genera dinámicamente en tiempo real en el cliente/servidor mediante `@react-pdf/renderer`. Este es un enfoque puramente funcional: los datos (items, montos, negocio) se inyectan en componentes declarativos de React-PDF que calculan el layout y la paginación de manera robusta.

### 4. Inteligencia Artificial (AI)
La integración con AI existe puramente como un *asistente de redacción* para mejorar descripciones. 
- Los cálculos matemáticos (subtotal, IVA, total) **nunca** pasan por la IA para evitar alucinaciones.
- La `GEMINI_API_KEY` se mantiene estrictamente en el entorno backend de Vercel y es invocada mediante server functions.
