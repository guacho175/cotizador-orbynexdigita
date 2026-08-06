# Cotizador Orbynex Digital

Un sistema moderno, funcional y veloz para la generación de cotizaciones profesionales. 

El proyecto permite administrar negocios, clientes, y crear cotizaciones dinámicas que se exportan como PDFs profesionales. Está construido enfocado en el rendimiento y la experiencia de usuario (UX), utilizando un stack tecnológico moderno.

## Características Principales

- **Gestión de Negocio**: Configura tu logotipo, RUT, datos bancarios, impuestos y términos comerciales predeterminados.
- **Base de Clientes**: Mantén un registro reutilizable de clientes.
- **Cotizador Dinámico**: Agrega múltiples productos o servicios con cálculos automáticos (nunca delegados a IA).
- **Asistente IA Integrado**: Mejora redacción y ortografía de tus descripciones de productos usando un asistente opcional (requiere Gemini API).
- **Generación PDF Real-time**: Construye documentos PDF profesionales con paginación automática listos para descargar o imprimir.
- **Aislamiento Seguro**: Cada usuario accede y visualiza estrictamente su propia información gracias a Row Level Security (RLS).
- **PWA Ready**: Listo para instalarse como Aplicación Web Progresiva.

## Arquitectura

Para un detalle completo, lee nuestro documento de [Arquitectura](docs/ARCHITECTURE.md).

- **Frontend / Framework**: [TanStack Start](https://tanstack.com/start) (React 19) + Vite.
- **Estilos**: TailwindCSS 4 y Radix UI.
- **Backend / Database**: Supabase (PostgreSQL).
- **Autenticación**: Supabase Auth.
- **Almacenamiento**: Supabase Storage (Buckets).

## Requisitos Previos

- Node.js (v20+ recomendado)
- Cuenta en Supabase (o Supabase CLI local para desarrollo)
- Opcional: Clave API de Gemini para la funcionalidad de mejora de redacción.

## Instalación y Ejecución Local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/guacho175/cotizador-orbynexdigita.git
   cd cotizador-orbynexdigita
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura tus variables de entorno. Copia `.env.example` a `.env.local` y llena los datos con tus credenciales de Supabase:
   ```bash
   cp .env.example .env.local
   ```
   > Nota: No es necesario llenar las variables del backend (`SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`) si solo vas a usar funcionalidades públicas, pero son recomendadas para la experiencia completa.

4. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   ```

5. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Despliegue (Vercel)

Este proyecto está optimizado para desplegarse fácilmente en Vercel.

1. Conecta tu repositorio a un proyecto nuevo en Vercel.
2. Asegúrate de configurar las siguientes **Environment Variables** en el panel de Vercel:
   - `VITE_SUPABASE_PROJECT_ID`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY` (Opcional, para el asistente IA)
3. El comando de compilación por defecto (`npm run build`) será detectado automáticamente.

## Seguridad y Contribución

- **Seguridad**: Si encuentras vulnerabilidades, no abras un issue. Por favor revisa nuestra [Política de Seguridad](SECURITY.md).
- **Contribución**: ¡Los Pull Requests son bienvenidos! Revisa nuestra [Guía de Contribución](CONTRIBUTING.md).

## Licencia

Este proyecto está licenciado bajo los términos de la **Apache License 2.0**. Consulta el archivo [LICENSE](LICENSE) para más detalles.
