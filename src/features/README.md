# Features

Cada carpeta representa un módulo funcional de GestIQ. Una feature puede contener páginas, componentes, modelo y adaptadores propios.

```text
feature/
  pages/       pantallas asociadas a rutas
  components/  UI privada del módulo
  model/       validaciones, transformaciones y tests
  api/         acceso a datos propio, solamente cuando exista
  index.ts     API pública
```

## Límites

- `index.ts` es la API pública del módulo y debe mantenerse pequeña.
- `app` y otras features deben importar desde esa API pública cuando consumen pantallas o capacidades externas.
- Los archivos de una misma feature usan imports relativos para sus dependencias internas.
- Los componentes usados por un único dominio permanecen dentro de su feature.
- Las primitivas reutilizables y sin conocimiento de negocio viven en `components`.
- Las reglas puras viven en `domain` y el acceso a datos vive en `services` mientras se prepara la integración con backend.
- No se crean carpetas `api`, `components` o `model` vacías: la estructura crece cuando el módulo lo necesita.

## Integración futura con backend

Las pantallas no deben acceder directamente a `localStorage` ni conocer URLs HTTP. La implementación actual se consume mediante repositorios; esos repositorios podrán reemplazarse por clientes de API conservando sus contratos públicos y el alcance de organización resuelto por `workspace`.
