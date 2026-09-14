# AGENTS.md

## Proyecto

Frontend de la plataforma para academias y escuelas. La aplicación debe priorizar claridad, velocidad y operatividad sobre decoración visual.

Este proyecto debe seguir la estrategia definida en `estrategia-frontend-plataforma-academias.md`, con foco en un dashboard tipo SaaS, multi-tenant y orientado a gestión académica.

## Stack principal

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- React Hook Form
- Zod
- Tailwind CSS
- shadcn/ui
- Lucide React
- Recharts
- TanStack Table
- FullCalendar
- Vitest + Testing Library
- Playwright

## Principios de desarrollo

- Priorizar UX simple y operativa.
- Mantener la interfaz clara y profesional.
- No agregar complejidad técnica innecesaria al MVP.
- Trabajar con componentes reutilizables.
- Pensar en layout tipo SaaS con sidebar, top bar y bloques de contenido.
- Mantener dashboards accionables y centrados en decisiones.
- Diseñar responsive desde el inicio.
- Hacer que la navegación se adapte al rol del usuario.
- Respetar la separación entre estado del servidor y estado local.
- Mantener el dark mode como comportamiento global y consistente en toda la app.
- Usar tokens de tema (`--bg`, `--panel`, `--text`, `--border`, etc.) en vez de colores fijos por pantalla.
- La marca global de la plataforma y la marca de cada academia deben separarse: `shadcnspace` o el nombre base de la app es un branding del producto; la identidad visual de cada academia se maneja como un tema configurable por tenant.
- Definir un sistema de tokens para branding (`--primary`, `--primary-strong`, `--primary-soft`, `--primary-contrast`, `--accent`) y aplicarlos desde un provider o configuración global, no desde estilos aislados por pantalla.
- Evitar hardcodear colores en componentes, charts, menús, badges, botones y cards cuando ya exista un token semántico equivalente.
- Cuando se cree una nueva vista, verificar que funcione tanto en light mode como en dark mode.
- Si la UI necesita variar según la academia activa, hacerlo mediante variables CSS globales y no con condiciones puntuales de estilo por componente.

## Principios de frontend GestIQ

- Mantener un diseño consistente entre todos los módulos: alumnos, cursos, inscripciones, pagos, staff, agenda y asistencia.
- Reutilizar patrones existentes antes de crear nuevas pantallas o componentes customizados.
- Priorizar flujos de negocio operativos por encima de vistas decorativas o aisladas por entidad.
- Mantener la base visual actual de tablas, buscadores, filtros, bulk actions, badges y modales de CRUD.
- Cada módulo debe resolver una operación real del negocio, no solo mostrar datos en una tabla.
- Trabajar con componentes base reutilizables para listados, formularios, menú de acciones, filtros y estados.
- No crear pantallas con un estilo totalmente distinto si ya existe un patrón equivalente.
- La evolución del frontend debe seguir este orden: administración base, operación, seguimiento, y luego vistas específicas por rol.
- Las vistas para profesor o alumno deben llegar luego de consolidar la base administrativa y operativa.
- Si una nueva pantalla no encaja con los patrones de la app, se debe revisar primero el problema de producto y la arquitectura del flujo antes de diseñar una solución aislada.

## Reglas de diseño y escalabilidad

- Mantener consistencia visual: mismos spacing, jerarquía, cards, botones, tablas y badges en todos los módulos.
- Reusar `CrudListPage`, `DataTable`, `RowActionMenu`, `ActionButtonGroup`, `EntityFormModal` y los componentes de UI base siempre que corresponda.
- Diseñar para administración de academias, no para un caso de uso puntual de un único cliente.
- Pensar en bulk actions, importación masiva, asignación grupal y flujo de trabajo como parte de la base del producto.
- La experiencia debe ser simple, clara y operativa para el usuario final, aunque la arquitectura interna sea sólida.

## Arquitectura y organización por módulos

GestIQ utiliza una arquitectura **feature-first**. Las pantallas y componentes de negocio deben organizarse por módulo funcional, no agruparse en una carpeta global `pages` ni mezclarse con las primitivas compartidas.

```text
src/
  app/
    App.tsx
  auth/
  workspace/
  features/
    students/
    academic-offers/
    commissions/
    enrollments/
    billing/
    finances/
    agenda/
    branches/
    academy-settings/
    staff/
    dashboard/
    profile/
  components/
    ui/
    layout/
    forms/
    crud/
  domain/
  hooks/
  services/
    academy/
    billing/
    shared/
  styles/
  types/
  main.tsx
```

### Estructura interna de una feature

Crear solamente las carpetas que el módulo realmente necesite:

```text
features/example/
  pages/       pantallas asociadas a rutas
  components/  componentes privados del módulo
  model/       validaciones, transformaciones, tipos locales y tests
  api/         repositorios o clientes propios del módulo, cuando existan
  index.ts     API pública del módulo
```

### Reglas de límites e imports

- `src/app` compone providers y routing, pero no contiene lógica de negocio.
- No volver a crear una carpeta global `src/pages`. Cada pantalla pertenece a una feature, a `auth` o a otra capa explícita.
- Cada feature expone únicamente su contrato público desde `index.ts`.
- `app` y otras features deben importar desde `@/features/<feature>`, sin acceder directamente a sus carpetas `pages`, `components`, `model` o `api`.
- Los archivos dentro de una misma feature deben usar imports relativos para sus dependencias internas.
- Evitar exportar componentes internos desde `index.ts` salvo que otra feature realmente necesite consumirlos.
- Evitar dependencias circulares entre features. Si dos módulos necesitan la misma primitiva sin conocimiento de negocio, moverla a `components`; si comparten una regla pura, evaluar `domain`.
- No crear carpetas vacías para cumplir una plantilla. Agregar `api`, `model` o `components` cuando exista contenido real.

### Qué pertenece a cada capa

- `features`: pantallas, flujos, formularios y componentes con conocimiento del negocio.
- `components`: primitivas reutilizables y sin conocimiento de una entidad específica, como `DataTable`, `EntityFormModal`, `CrudListPage` y controles base.
- `domain`: reglas de negocio puras, determinísticas y sin React, navegador, persistencia ni llamadas HTTP.
- `services`: persistencia y acceso a datos. Las pantallas no deben acceder directamente a `localStorage` ni conocer URLs HTTP.
- `workspace`: resolución de organización, modo, permisos de navegación y construcción de rutas multi-tenant.
- `auth`: sesión, roles y entrada al producto.

Un formulario como `StudentForm`, `CommissionForm` o `EnrollmentForm` pertenece a su feature aunque reutilice primitivas genéricas. No debe moverse a `components/crud` solo porque se use dentro de un modal CRUD.

### Preparación para el backend

- Mantener contratos de repositorio entre la UI y la persistencia.
- La migración de datos locales a HTTP debe poder realizarse sin reescribir páginas o componentes.
- El alcance de organización activa se resuelve en `workspace`; no debe hardcodearse el ID o slug de una academia dentro de una feature.
- Las rutas internas canónicas se escriben en inglés y se construyen mediante las utilidades de `workspace`. Los alias en español se reservan para compatibilidad con enlaces anteriores.
- Cuando una feature obtenga un cliente o repositorio propio, ubicarlo en `features/<feature>/api` y exponer solamente las operaciones que otros módulos necesiten.

### Componentes clave a priorizar

- AppShell
- Sidebar
- TopBar
- KpiCard
- ChartCard
- DataTableCard
- QuickActionButton
- AcademySwitcher
- BranchSelector
- StudentTable
- StudentForm
- ClassCard
- AttendanceList
- PaymentStatus

## Layout visual base

La aplicación debe utilizar una estructura como la siguiente:

```text
AppShell
├── Sidebar
├── TopBar
├── PageHeader
├── ContentGrid
│   ├── KpiRow
│   ├── MainChartPanel
│   ├── SecondaryChartPanel
│   └── DataPanelsRow
└── Actions / Utility panel
```

### Estilo visual

- Fondo neutro y limpio.
- Énfasis en métricas y contenido útil.
- Bordes sutiles.
- Pocas sombras.
- Jerarquía clara en textos y números.
- Cards bien separadas y consistentes.
- Diseño minimalista y moderno.

## Reglas de implementación

- No usar Redux inicialmente.
- Usar TanStack Query para datos remotos.
- Usar React context o estado local para UI states.
- Usar `react-hook-form` + `zod` en formularios.
- Usar `shadcn/ui` como base del sistema visual.
- Usar `Tailwind CSS` para diseño y spacing.
- Usar `lucide-react` para iconografía consistente.
- Mantener la lógica de permisos y tenant en el backend; el frontend solo consume y representa la información.
- No mezclar tenant logic en el cliente.
- Mantener la autenticación y la selección de academia como contexto global.

## Dashboard

El dashboard debe ser accionable, no decorativo. Debe responder preguntas como:

- ¿Qué está pasando hoy?
- ¿Qué está pendiente?
- ¿Hay riesgo o deuda?
- ¿Qué acciones requieren prioridad?

## Responsive

- Desktop y notebook: navegación sidebar permanente.
- Mobile: navegación tipo drawer y layout apilado.
- Priorizar experiencias para administración y profesores en móvil.

## Dark mode y design tokens

- El dark mode debe aplicarse a nivel global mediante la clase `dark` en `document.documentElement`.
- No hardcodear colores directos en componentes si ya existen variables CSS del tema.
- Usar tokens semánticos del diseño para fondo, paneles, texto, bordes, badges, estado activo y hover.
- Mantener contraste accesible en ambos modos.
- Si un componente necesita un color especial, preferir definirlo en el sistema de tokens y reutilizarlo.
- Toda nueva pantalla debe revisarse en light mode y dark mode antes de cerrarla.
- El tema de la app debe incluir dos capas: branding global del producto (`shadcnspace`) y branding específico de la academia activa (`primary`, `primarySoft`, `primaryContrast`, etc.).
- El color de la academia debe influir en elementos de acción, selección, estado activo, hover y gráficos, pero no debe romper la base visual de la plataforma ni el sistema dark mode.
- La configuración del brand debe vivir en un provider o contexto global, y cualquier componente nuevo debe consumir variables del root antes que definir valores propios.

## Testing

- Probar componentes críticos y formularios.
- Probar validaciones y lógica de UI.
- Usar Playwright para flujos de Login, academia, alumnos y edición.
- Probar aislamientos multi-tenant cuando corresponda.

## No hacer inicialmente

- Redux.
- Micro-frontends.
- Animaciones complejas.
- Personalización visual ilimitada.
- Complejidad arquitectónica sin necesidad real.
- Features extras sin validar antes la base productiva.

## Primer objetivo funcional

La primera iteración debe ser:

1. Layout principal
2. Login
3. Selector de academia
4. Dashboard básico
5. Listado de alumnos
6. Crear / editar alumno
7. Responsive mobile

## Comandos útiles

```bash
npm install
npm run dev
npm run build
npm run test
```

## Checklist para nuevas pantallas y módulos

Antes de cerrar una nueva feature o pantalla, verificar que cumpla con esta checklist:

- [ ] Reutiliza un patrón ya existente en lugar de crear un layout nuevo.
- [ ] Mantiene la misma estructura visual de la app: header, tabla/listado, actions, filtros, modales.
- [ ] Tiene buscador y filtros si la entidad es listada o consultada en abundancia.
- [ ] Tiene bulk actions cuando se aplica a más de un registro.
- [ ] Usa badges, estados y acciones consistentes con los demás módulos.
- [ ] Tiene formularios con validación, estados de error y éxito claros.
- [ ] Se adapta al dark mode y al sistema de tokens del proyecto.
- [ ] No hardcodea colores ni estilos puntuales cuando existe una variable o token equivalente.
- [ ] Está alineada con un flujo operativo real del negocio.
- [ ] Tiene una dependencia clara con entidades o procesos ya definidos.
- [ ] Se puede mantener y expandir sin romper patrones de UX para otros módulos.

## Observación final

La experiencia de usuario debe sentirse simple, aunque la arquitectura interna sea sólida. El usuario no debe pensar en tenant, permisos o base de datos; solo debe pensar en "Academia → Sede → Funcionalidad".
