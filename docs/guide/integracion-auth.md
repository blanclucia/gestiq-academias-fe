# Integración de autenticación

La rama `feature/auth-integration` conecta el frontend con la API Go. El login de
prueba y el indicador `gestiq-demo-authenticated` ya no habilitan el acceso.

## Ejecutar localmente

1. Levantar PostgreSQL y el backend en `http://127.0.0.1:8080`.
2. En el `.env` del backend configurar:

   ```dotenv
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   ```

   Reiniciar la API si se modifica esa variable.
3. En el frontend, opcionalmente copiar `.env.example` a `.env.local` y ajustar
   `VITE_ORGANIZATION_SLUG` o `API_PROXY_TARGET`. Los valores por defecto apuntan a
   Academy Demo y al backend local. Las variables `VITE_*` son públicas: no incluir
   contraseñas ni tokens.
4. Ejecutar `npm run dev -- --port 5173 --strictPort` y abrir
   `http://localhost:5173/login`.

Vite reenvía `/api/v1` al backend. En producción se requiere un proxy equivalente
bajo el mismo origen, o una URL `VITE_API_BASE_URL` pública por HTTPS con CORS configurado.

## Ingreso y primer acceso

El owner existente de Academy Demo usa DNI **90000001** y conserva su contraseña
actual (la misma que se usa en Postman). No hay contraseñas precargadas en el frontend.

Una cuenta nueva ingresa con DNI como contraseña inicial. La respuesta
`mustChangePassword=true` muestra exclusivamente el formulario de cambio. Se pide
confirmar la contraseña nueva; después del `204`, se vuelve al login para ingresar
con la clave elegida. Un token de primer acceso vencido obliga a repetir login.

El enlace `/login?organization=academy-demo` selecciona la academia. Las rutas privadas
redirigen al login de su organización; una sesión de otra academia no concede acceso.
No existe todavía un endpoint para listar o elegir entre todas las membresías del usuario.

## Sesión y permisos

Access, refresh y token de primer acceso permanecen **solo en memoria**. No se guardan
contraseñas ni tokens en localStorage, sessionStorage, URLs ni la caché de TanStack Query.
Al recargar o abrir otra pestaña se requiere ingresar nuevamente. La persistencia con
cookies HttpOnly no forma parte de esta entrega.

La renovación se coordina en una única promesa compartida. Un `401` reintenta la
petición una vez con el acceso renovado; errores de permisos no renuevan la sesión.
Si se pierde la respuesta de refresh, se descartan las credenciales: no se reenvía
un token que el servidor pudo haber consumido. Un resultado tardío de login o refresh
no puede restaurar una sesión cerrada.

Logout limpia inmediatamente el estado privado y solicita la revocación en el backend.
Si falla la conexión, el login informa que el cierre remoto no pudo confirmarse.
Recargar la página pierde las credenciales locales pero no revoca por sí mismo la
sesión remota, que conserva los vencimientos definidos por el backend.

`GET /session/context` aporta identidad, organización, roles, modos, permisos y sedes
accesibles. Se consulta al ingresar, al recuperar el foco y periódicamente mientras
la pantalla está activa. La UI solo representa permisos; la API sigue autorizando
cada operación. Elegir otro modo en la URL nunca agrega un rol.

## Código

| Ubicación | Responsabilidad |
| --- | --- |
| `src/services/http/client.ts` | Transporte JSON, errores, timeout y configuración de URL |
| `src/auth/api/authClient.ts` | Credenciales en memoria, login, cambio inicial, refresh y logout |
| `src/auth/api/contracts.ts` | Validación de respuestas de la API con Zod |
| `src/auth/AuthProvider.tsx` | Contexto React y consulta de sesión con TanStack Query |
| `src/auth/LoginPage.tsx` | Formularios con React Hook Form y validación Zod |
| `src/workspace/` | Rutas y modos según la sesión autenticada |

La lectura de la academia en el login usa
`GET /public/organizations/{organizationSlug}/context`. El perfil y el selector de
sedes muestran los datos de la sesión real.

**Alcance:** autenticación y contexto están conectados. Los módulos de configuración,
branding editable, CRUD de sedes, alumnos, oferta, pagos y dashboards todavía mantienen
sus repositorios o datos de demostración. Sus cambios locales no se envían a la API.
El selector superior representa las sedes accesibles reales; el CRUD de sedes se
integrará en el próximo corte. Los datos locales se separan por organización y ya
no se recuperan automáticamente desde claves globales antiguas.

## Verificación

```bash
npm run validate
npx playwright install chromium
npm run test:e2e
```

Las pruebas unitarias cubren validación, refresh concurrente, cancelación de sesiones
y pérdida de respuestas. Playwright prueba login, primer cambio, logout, aislamiento
de academia, roles, recarga y formularios móviles en claro/oscuro con respuestas controladas.

`e2e/auth-live.spec.ts` se habilita únicamente con `E2E_DISPOSABLE_API=1` y un
`API_PROXY_TARGET` que apunte a una instancia Go con **bases temporales**, seed de
Academy Demo y owner nuevo `90000001`. Requiere CORS para `http://127.0.0.1:4173`.
Esta prueba cambia la contraseña de esa cuenta temporal; no ejecutarla contra la
base habitual. Durante esta implementación también se ejecutó contra Go y PostgreSQL
reales mediante una fixture temporal, que eliminó ambas bases al terminar.
