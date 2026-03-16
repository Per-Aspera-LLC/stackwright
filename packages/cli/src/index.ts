// Public API for plugin authors and programmatic use (e.g. future MCP server)

export type { PluginRegistrar } from './types';

// Output helpers — plugin authors can use these for consistent UX
export { outputResult, outputError } from './utils/json-output';

// Pure command functions — callable as a library without spawning a subprocess
export { scaffold } from './commands/scaffold';
export { listPages, addPage, validatePages, readPage, writePage } from './commands/page';
export { validateSite, readSiteConfig, writeSiteConfig } from './commands/site';
export { getTypes } from './commands/types';
export { runPrebuildCommand } from './commands/prebuild';
export { listThemes } from './commands/theme';
export { getInfo } from './commands/info';
export { generateAgentDocs } from './commands/generate-agent-docs';
export { stageChanges, openPr } from './commands/git-ops';
export { getBoard, parseBoard } from './commands/board';
export { listCollections, addCollection, resolveContentDir } from './commands/collection';
export { detectProject, resolvePagesDir } from './utils/project-detector';

// Result types
export type { ScaffoldResult, ScaffoldOptions } from './commands/scaffold';
export type {
  PageSummary,
  PageListResult,
  PageValidateResult,
  AddPageResult,
  ReadPageResult,
  WritePageResult,
} from './commands/page';
export type {
  SiteValidateResult,
  SiteValidationError,
  ReadSiteConfigResult,
  WriteSiteConfigResult,
} from './commands/site';
export type { TypesResult, ContentTypeEntry, FieldEntry } from './commands/types';
export type { PrebuildResult } from './commands/prebuild';
export type { ThemeListResult } from './commands/theme';
export type { InfoResult, PackageVersions } from './commands/info';
export type { GenerateAgentDocsResult } from './commands/generate-agent-docs';
export type {
  StageChangesResult,
  StageChangesOptions,
  OpenPrResult,
  OpenPrOptions,
} from './commands/git-ops';
export type { BoardResult, BoardIssue, GhIssueRaw } from './commands/board';
export type {
  CollectionSummary,
  CollectionListResult,
  AddCollectionResult,
} from './commands/collection';
export type { ProjectPaths } from './utils/project-detector';
