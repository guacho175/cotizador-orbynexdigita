# Política de Seguridad

Nos tomamos muy en serio la seguridad del Cotizador Orbynex Digital.

## Versiones Soportadas

Actualmente, solo la versión principal (`main`) recibe actualizaciones de seguridad.

| Versión | Soportada          |
| ------- | ------------------ |
| v1.x.x  | :white_check_mark: |
| < v1.0  | :x:                |

## Reporte de Vulnerabilidades

**POR FAVOR, NO ABRAS UN ISSUE PÚBLICO SI ENCUENTRAS UNA VULNERABILIDAD DE SEGURIDAD.**

Si descubres un problema de seguridad en este proyecto:
1. No lo compartas públicamente en GitHub Issues ni en Pull Requests.
2. Envía un correo electrónico detallado a [galindez175@gmail.com] con los pasos para reproducir el problema.
3. Te responderemos en un plazo máximo de 72 horas con un acuse de recibo y los próximos pasos.

### Modelo de Seguridad

Este proyecto utiliza **Row Level Security (RLS)** en Supabase. Si encuentras alguna tabla pública sin políticas, o un fallo en el backend (TanStack Start server functions) que permita by-pass de RLS, por favor repórtalo inmediatamente.
