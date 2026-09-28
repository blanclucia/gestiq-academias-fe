# GestIQ Frontend

Frontend de Gestión para academias, construido con React + TypeScript + Vite.

## Objetivo

Aplicación administrativa para gestionar:
- estudiantes
- profesores
- cursos
- comisiones
- inscripciones
- pagos
- configuración y branding institucional

## Arquitectura

- layout shell persistente
- sidebar con navegación modular
- topbar con selector de academy y perfil
- rutas orientadas a módulos
- sistema de branding centralizado para la marca de la aplicación y la academia

## Scripts

```bash
npm install
npm run dev
npm run build
npm run test
npm run validate
npm run lint
```

## Estado

Login con DNI, cambio inicial de contraseña y contexto de sesión conectados al backend Go.
La sesión permanece en memoria; recargar requiere volver a ingresar.
Los demás módulos todavía usan datos locales de demostración.

Ver [configuración y pruebas de la integración](docs/guide/integracion-auth.md).
