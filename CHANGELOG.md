# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Initial app shell with persistent desktop/mobile sidebar behavior.
- Global dashboard layout with top bar, academy branding, and responsive navigation.
- Route structure for dashboard, students, teachers, courses, commissions, enrollments, and payments.
- Placeholder module pages and initial analytics dashboard UI.
- Brand-aware theme foundation using app-level and academy-level providers.

### Changed
- Kept the sidebar state stable across route changes by mounting the shell once at the app level.
- Adjusted navigation behavior so desktop mode does not collapse/expand unexpectedly on click.
- Persisted sidebar collapse preference in localStorage for a better UX across sessions.
- Refined dashboard copy and KPI layout to align with an academic institution product language.

### Fixed
- Resolved sidebar remount issue caused by rendering the shell inside page components.
- Fixed mobile menu behavior and overlay close interaction.
- Corrected route-driven navigation so sidebar items behave as app navigation instead of generic links.
- Stabilized responsive shell transitions between desktop and mobile layouts.

## [feature/initial-app-shell] - 2026-08-21

### Added
- Initial feature branch for the app shell foundation.
- Base application structure for the GestIQ frontend.

### Notes
- This branch captures the current UI shell, responsive navigation, theme foundation, and route scaffolding before moving into the CRUD modules.
