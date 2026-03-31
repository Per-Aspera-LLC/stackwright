# @stackwright/maplibre

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
