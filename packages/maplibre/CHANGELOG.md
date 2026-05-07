# @stackwright/maplibre

## 2.0.3-alpha.0

### Patch Changes

- Updated dependencies [5cfa88e]
  - @stackwright/core@0.8.3-alpha.0

## 2.0.2

### Patch Changes

- @stackwright/core@0.8.2

## 2.0.1

### Patch Changes

- 265bf87: chore: consolidate dependabot dependency updates
  - `lucide-react`: `^0.525.0` → `^1.8.0` (icons, ui-shadcn) — includes icon rename fixes for v1 API (`CheckCircle` → `CircleCheck`, `Code2`/`Layout` backward-compat aliases)
  - `@swc/core`: `^1.15.18` → `^1.15.26` (core, nextjs)
  - `jsdom`: `^28.1.0` → `^29.0.2` (maplibre)
  - `react-dom`: `19.2.4` → `19.2.5` (pnpm.overrides)
  - `prettier`: `^3.8.1` → `^3.8.3` (devDependencies)

- Updated dependencies [265bf87]
- Updated dependencies [265bf87]
- Updated dependencies [265bf87]
  - @stackwright/core@0.8.1

## 2.0.1-alpha.2

### Patch Changes

- Updated dependencies [fb3393e]
  - @stackwright/core@0.8.1-alpha.2

## 2.0.1-alpha.1

### Patch Changes

- c036f5b: chore: consolidate dependabot dependency updates
  - `lucide-react`: `^0.525.0` → `^1.8.0` (icons, ui-shadcn) — includes icon rename fixes for v1 API (`CheckCircle` → `CircleCheck`, `Code2`/`Layout` backward-compat aliases)
  - `@swc/core`: `^1.15.18` → `^1.15.26` (core, nextjs)
  - `jsdom`: `^28.1.0` → `^29.0.2` (maplibre)
  - `react-dom`: `19.2.4` → `19.2.5` (pnpm.overrides)
  - `prettier`: `^3.8.1` → `^3.8.3` (devDependencies)

- Updated dependencies [c036f5b]
- Updated dependencies [5ad5035]
  - @stackwright/core@0.8.1-alpha.1

## 2.0.1-alpha.0

### Patch Changes

- c036f5b: chore: consolidate dependabot dependency updates
  - `lucide-react`: `^0.525.0` → `^1.8.0` (icons, ui-shadcn) — includes icon rename fixes for v1 API (`CheckCircle` → `CircleCheck`, `Code2`/`Layout` backward-compat aliases)
  - `@swc/core`: `^1.15.18` → `^1.15.26` (core, nextjs)
  - `jsdom`: `^28.1.0` → `^29.0.2` (maplibre)
  - `react-dom`: `19.2.4` → `19.2.5` (pnpm.overrides)
  - `prettier`: `^3.8.1` → `^3.8.3` (devDependencies)

- Updated dependencies [c036f5b]
- Updated dependencies [5ad5035]
  - @stackwright/core@0.8.1-alpha.0

## 2.0.0

### Minor Changes

- 8f34fd6: Add map adapter system with MapLibre GL free tier - Phases 1 & 2 of geospatial visualization support

  **Phase 1: Map Adapter Interface and Registry**
  - Create MapAdapter interface following Image/Link/Router adapter pattern
  - Add map registry with setMapAdapter/getMapAdapter functions
  - Export map adapter types and utilities from @stackwright/core

  **Phase 2: MapLibre GL Implementation**
  - Create @stackwright/maplibre package with MapLibreAdapter
  - Support map initialization with center, zoom, pitch, bearing controls
  - Handle marker placement with simple format and GeoJSON FeatureCollections
  - Add camera animation for smooth transitions
  - Use MapLibre GL JS v4.7.1 for OSM-based vector tile rendering

  **Content Type Support**
  - Add MapContent schema with Zod validation
  - Support declarative map configuration through YAML content files
  - Generate JSON schema for MCP tool introspection

  **Examples**
  - Add comprehensive /maps showcase page to hellostackwright example
  - Demonstrate simple maps, markers, custom styles, animations, 3D terrain, and GeoJSON layers

  This establishes the foundation for pluggable map providers (MapLibre, Cesium, etc.) without coupling the core framework to any specific implementation. Phase 3 (Cesium ion integration) awaits OpenAPI work in pro repo.

### Patch Changes

- 46df0c5: chore: consolidate dependabot dependency updates
  - `lucide-react`: `^0.525.0` → `^1.8.0` (icons, ui-shadcn) — includes icon rename fixes for v1 API (`CheckCircle` → `CircleCheck`, `Code2`/`Layout` backward-compat aliases)
  - `@swc/core`: `^1.15.18` → `^1.15.26` (core, nextjs)
  - `jsdom`: `^28.1.0` → `^29.0.2` (maplibre)
  - `react-dom`: `19.2.4` → `19.2.5` (pnpm.overrides)
  - `prettier`: `^3.8.1` → `^3.8.3` (devDependencies)

- 85a9699: Fix TypeScript build error and verify package is properly registered in lockfile
- Updated dependencies [8f34fd6]
- Updated dependencies [46df0c5]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [115c658]
- Updated dependencies [199ca1c]
- Updated dependencies [46df0c5]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
  - @stackwright/core@0.8.0

## 1.0.1-alpha.2

### Patch Changes

- 85a9699: Fix TypeScript build error and verify package is properly registered in lockfile

## 1.0.1-alpha.1

### Patch Changes

- Updated dependencies [115c658]
  - @stackwright/core@0.7.1-alpha.1

## 1.0.1-alpha.0

### Patch Changes

- Updated dependencies [8f34fd6]
  - @stackwright/core@0.7.1-alpha.0

## 1.0.0

### Minor Changes

- b14b0d2: Add map adapter system with MapLibre GL free tier - Phases 1 & 2 of geospatial visualization support

  **Phase 1: Map Adapter Interface and Registry**
  - Create MapAdapter interface following Image/Link/Router adapter pattern
  - Add map registry with setMapAdapter/getMapAdapter functions
  - Export map adapter types and utilities from @stackwright/core

  **Phase 2: MapLibre GL Implementation**
  - Create @stackwright/maplibre package with MapLibreAdapter
  - Support map initialization with center, zoom, pitch, bearing controls
  - Handle marker placement with simple format and GeoJSON FeatureCollections
  - Add camera animation for smooth transitions
  - Use MapLibre GL JS v4.7.1 for OSM-based vector tile rendering

  **Content Type Support**
  - Add MapContent schema with Zod validation
  - Support declarative map configuration through YAML content files
  - Generate JSON schema for MCP tool introspection

  **Examples**
  - Add comprehensive /maps showcase page to hellostackwright example
  - Demonstrate simple maps, markers, custom styles, animations, 3D terrain, and GeoJSON layers

  This establishes the foundation for pluggable map providers (MapLibre, Cesium, etc.) without coupling the core framework to any specific implementation. Phase 3 (Cesium ion integration) awaits OpenAPI work in pro repo.

### Patch Changes

- Updated dependencies [f5d7ec2]
- Updated dependencies [6cda0f0]
- Updated dependencies [53623f6]
- Updated dependencies [b14b0d2]
- Updated dependencies [a662f0c]
- Updated dependencies [6cda0f0]
- Updated dependencies [b14b0d2]
- Updated dependencies [a5b331f]
  - @stackwright/core@0.7.0

## 1.0.0-alpha.3

### Patch Changes

- Updated dependencies [167b5bb]
  - @stackwright/core@0.7.0-alpha.7

## 1.0.0-alpha.2

### Patch Changes

- Updated dependencies [02638c9]
- Updated dependencies [a662f0c]
  - @stackwright/core@0.7.0-alpha.6

## 1.0.0-alpha.1

### Patch Changes

- Updated dependencies [6cda0f0]
- Updated dependencies [6cda0f0]
  - @stackwright/core@0.7.0-alpha.5

## 1.0.0-alpha.0

### Minor Changes

- 3663c96: Add map adapter system with MapLibre GL free tier - Phases 1 & 2 of geospatial visualization support

  **Phase 1: Map Adapter Interface and Registry**
  - Create MapAdapter interface following Image/Link/Router adapter pattern
  - Add map registry with setMapAdapter/getMapAdapter functions
  - Export map adapter types and utilities from @stackwright/core

  **Phase 2: MapLibre GL Implementation**
  - Create @stackwright/maplibre package with MapLibreAdapter
  - Support map initialization with center, zoom, pitch, bearing controls
  - Handle marker placement with simple format and GeoJSON FeatureCollections
  - Add camera animation for smooth transitions
  - Use MapLibre GL JS v4.7.1 for OSM-based vector tile rendering

  **Content Type Support**
  - Add MapContent schema with Zod validation
  - Support declarative map configuration through YAML content files
  - Generate JSON schema for MCP tool introspection

  **Examples**
  - Add comprehensive /maps showcase page to hellostackwright example
  - Demonstrate simple maps, markers, custom styles, animations, 3D terrain, and GeoJSON layers

  This establishes the foundation for pluggable map providers (MapLibre, Cesium, etc.) without coupling the core framework to any specific implementation. Phase 3 (Cesium ion integration) awaits OpenAPI work in pro repo.

### Patch Changes

- Updated dependencies [3663c96]
  - @stackwright/core@0.7.0-alpha.4
