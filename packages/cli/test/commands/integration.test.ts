import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import {
  listIntegrations,
  getIntegration,
  addIntegration,
  type IntegrationEntry,
} from '../../src/commands/integration';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sw-int-test-'));
}

/** Minimal valid stackwright.yml — passes siteConfigSchema */
const BARE_SITE_YAML = `title: "Test Site"
navigation:
  - label: "Home"
    href: "/"
appBar:
  titleText: "Test Site"
`;

/** Valid stackwright.yml with two pre-seeded integrations */
const SITE_WITH_INTEGRATIONS_YAML = `title: "Test Site"
navigation:
  - label: "Home"
    href: "/"
appBar:
  titleText: "Test Site"
integrations:
  - type: openapi
    name: logistics
    spec: ./specs/logistics.yaml
  - type: rest
    name: inventory
    endpoint: https://api.example.com/inventory
`;

function writeSiteYaml(dir: string, content: string): string {
  const p = path.join(dir, 'stackwright.yml');
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

// ---------------------------------------------------------------------------
// listIntegrations
// ---------------------------------------------------------------------------

describe('listIntegrations', () => {
  let tmpDir: string;
  let siteConfigPath: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    siteConfigPath = path.join(tmpDir, 'stackwright.yml');
  });

  it('returns empty array when stackwright.yml has no integrations key', () => {
    writeSiteYaml(tmpDir, BARE_SITE_YAML);
    const result = listIntegrations(siteConfigPath);
    expect(result.integrations).toEqual([]);
  });

  it('returns all entries when integrations array exists', () => {
    writeSiteYaml(tmpDir, SITE_WITH_INTEGRATIONS_YAML);
    const result = listIntegrations(siteConfigPath);
    expect(result.integrations).toHaveLength(2);
    expect(result.integrations[0].name).toBe('logistics');
    expect(result.integrations[1].name).toBe('inventory');
  });

  it('returns entries with the correct type and extra fields', () => {
    writeSiteYaml(tmpDir, SITE_WITH_INTEGRATIONS_YAML);
    const { integrations } = listIntegrations(siteConfigPath);
    const logistics = integrations.find((i) => i.name === 'logistics');
    expect(logistics?.type).toBe('openapi');
    expect(logistics?.spec).toBe('./specs/logistics.yaml');
    const inventory = integrations.find((i) => i.name === 'inventory');
    expect(inventory?.type).toBe('rest');
    expect(inventory?.endpoint).toBe('https://api.example.com/inventory');
  });

  it('returns the resolved path', () => {
    writeSiteYaml(tmpDir, BARE_SITE_YAML);
    const result = listIntegrations(siteConfigPath);
    expect(result.path).toBe(siteConfigPath);
  });

  it('throws with code NOT_A_PROJECT when stackwright.yml does not exist', () => {
    try {
      listIntegrations(siteConfigPath);
      expect.unreachable('should have thrown');
    } catch (err) {
      expect((err as NodeJS.ErrnoException).code).toBe('NOT_A_PROJECT');
    }
  });
});

// ---------------------------------------------------------------------------
// getIntegration
// ---------------------------------------------------------------------------

describe('getIntegration', () => {
  let tmpDir: string;
  let siteConfigPath: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    siteConfigPath = path.join(tmpDir, 'stackwright.yml');
    writeSiteYaml(tmpDir, SITE_WITH_INTEGRATIONS_YAML);
  });

  it('returns the matching integration when name exists', () => {
    const result = getIntegration(siteConfigPath, 'logistics');
    expect(result.integration).not.toBeNull();
    expect(result.integration?.name).toBe('logistics');
    expect(result.integration?.type).toBe('openapi');
  });

  it('returns null integration when name is not found', () => {
    const result = getIntegration(siteConfigPath, 'nonexistent');
    expect(result.integration).toBeNull();
  });

  it('returns the resolved path even when integration is not found', () => {
    const result = getIntegration(siteConfigPath, 'nonexistent');
    expect(result.path).toBe(siteConfigPath);
  });

  it('is case-sensitive — "Logistics" does not match "logistics"', () => {
    const result = getIntegration(siteConfigPath, 'Logistics');
    expect(result.integration).toBeNull();
  });

  it('returns the correct integration when multiple exist', () => {
    const result = getIntegration(siteConfigPath, 'inventory');
    expect(result.integration?.name).toBe('inventory');
    expect(result.integration?.type).toBe('rest');
  });
});

// ---------------------------------------------------------------------------
// addIntegration
// ---------------------------------------------------------------------------

describe('addIntegration', () => {
  let tmpDir: string;
  let siteConfigPath: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    siteConfigPath = path.join(tmpDir, 'stackwright.yml');
  });

  it('creates the integrations array when none existed (created: true, updated: false)', () => {
    writeSiteYaml(tmpDir, BARE_SITE_YAML);
    const entry: IntegrationEntry = { type: 'openapi', name: 'logistics' };
    const result = addIntegration(siteConfigPath, entry);
    expect(result.created).toBe(true);
    expect(result.updated).toBe(false);
  });

  it('persists the new integration so re-reading returns it', () => {
    writeSiteYaml(tmpDir, BARE_SITE_YAML);
    const entry: IntegrationEntry = { type: 'openapi', name: 'logistics' };
    addIntegration(siteConfigPath, entry);
    const { integrations } = listIntegrations(siteConfigPath);
    expect(integrations).toHaveLength(1);
    expect(integrations[0].name).toBe('logistics');
  });

  it('appends a new entry when integrations already exist (created: true, updated: false)', () => {
    writeSiteYaml(tmpDir, SITE_WITH_INTEGRATIONS_YAML);
    const entry: IntegrationEntry = { type: 'graphql', name: 'payments' };
    const result = addIntegration(siteConfigPath, entry);
    expect(result.created).toBe(true);
    expect(result.updated).toBe(false);
    const { integrations } = listIntegrations(siteConfigPath);
    expect(integrations).toHaveLength(3);
  });

  it('updates an existing entry by name (created: false, updated: true)', () => {
    writeSiteYaml(tmpDir, SITE_WITH_INTEGRATIONS_YAML);
    const updated: IntegrationEntry = {
      type: 'openapi',
      name: 'logistics',
      spec: './specs/v2/logistics.yaml',
    };
    const result = addIntegration(siteConfigPath, updated);
    expect(result.created).toBe(false);
    expect(result.updated).toBe(true);
  });

  it('persists the updated entry so re-reading reflects the change', () => {
    writeSiteYaml(tmpDir, SITE_WITH_INTEGRATIONS_YAML);
    const updated: IntegrationEntry = {
      type: 'openapi',
      name: 'logistics',
      spec: './specs/v2/logistics.yaml',
    };
    addIntegration(siteConfigPath, updated);
    const found = getIntegration(siteConfigPath, 'logistics');
    expect(found.integration?.spec).toBe('./specs/v2/logistics.yaml');
  });

  it('preserves other integrations when updating one', () => {
    writeSiteYaml(tmpDir, SITE_WITH_INTEGRATIONS_YAML);
    const updated: IntegrationEntry = {
      type: 'openapi',
      name: 'logistics',
      spec: './specs/v2/logistics.yaml',
    };
    addIntegration(siteConfigPath, updated);
    const { integrations } = listIntegrations(siteConfigPath);
    expect(integrations).toHaveLength(2);
    const inventory = integrations.find((i) => i.name === 'inventory');
    expect(inventory).toBeDefined();
    expect(inventory?.endpoint).toBe('https://api.example.com/inventory');
  });

  it('returns the resolved path', () => {
    writeSiteYaml(tmpDir, BARE_SITE_YAML);
    const result = addIntegration(siteConfigPath, { type: 'rest', name: 'payments' });
    expect(result.path).toBe(siteConfigPath);
  });

  it('preserves spec field when provided', () => {
    writeSiteYaml(tmpDir, BARE_SITE_YAML);
    addIntegration(siteConfigPath, {
      type: 'openapi',
      name: 'logistics',
      spec: './specs/logistics.yaml',
    });
    const { integration } = getIntegration(siteConfigPath, 'logistics');
    expect(integration?.spec).toBe('./specs/logistics.yaml');
  });

  it('preserves endpoint field when provided', () => {
    writeSiteYaml(tmpDir, BARE_SITE_YAML);
    addIntegration(siteConfigPath, {
      type: 'rest',
      name: 'inventory',
      endpoint: 'https://api.example.com/inventory',
    });
    const { integration } = getIntegration(siteConfigPath, 'inventory');
    expect(integration?.endpoint).toBe('https://api.example.com/inventory');
  });

  it('works with type: openapi', () => {
    writeSiteYaml(tmpDir, BARE_SITE_YAML);
    addIntegration(siteConfigPath, { type: 'openapi', name: 'logistics' });
    const { integration } = getIntegration(siteConfigPath, 'logistics');
    expect(integration?.type).toBe('openapi');
  });

  it('works with type: graphql', () => {
    writeSiteYaml(tmpDir, BARE_SITE_YAML);
    addIntegration(siteConfigPath, { type: 'graphql', name: 'payments' });
    const { integration } = getIntegration(siteConfigPath, 'payments');
    expect(integration?.type).toBe('graphql');
  });

  it('works with type: rest', () => {
    writeSiteYaml(tmpDir, BARE_SITE_YAML);
    addIntegration(siteConfigPath, { type: 'rest', name: 'inventory' });
    const { integration } = getIntegration(siteConfigPath, 'inventory');
    expect(integration?.type).toBe('rest');
  });

  it('throws with code NOT_A_PROJECT when stackwright.yml does not exist', () => {
    try {
      addIntegration(siteConfigPath, { type: 'openapi', name: 'logistics' });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect((err as NodeJS.ErrnoException).code).toBe('NOT_A_PROJECT');
    }
  });
});
