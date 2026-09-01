import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as yaml from 'js-yaml';
import {
  PAGE_AUTHORING_SKILL_NAME,
  buildOssPageAuthoringSections,
  buildOssPageAuthoringSkill,
  renderSkillMd,
} from '../../src/agent-docs/skill';
import { generateSkills } from '../../src/commands/generate-skills';

describe('renderSkillMd', () => {
  it('renders code-puppy skill frontmatter + body', () => {
    const out = renderSkillMd(
      {
        name: 'test-skill',
        description: 'A test skill.',
        version: '1.0.0',
        author: 'tester',
        tags: ['a', 'b'],
      },
      ['# Title', 'Body text.']
    );
    expect(out).toBe(
      [
        '---',
        'name: test-skill',
        'description: A test skill.',
        'version: 1.0.0',
        'author: tester',
        'tags:',
        '  - a',
        '  - b',
        '---',
        '',
        '# Title',
        '',
        'Body text.',
        '',
      ].join('\n')
    );
  });
});

describe('buildOssPageAuthoringSkill', () => {
  it('emits parseable YAML frontmatter matching the installed skill format', () => {
    const skill = buildOssPageAuthoringSkill();
    const fmMatch = skill.match(/^---\n([\s\S]*?)\n---\n/);
    expect(fmMatch).not.toBeNull();
    const fm = yaml.load(fmMatch![1]) as Record<string, unknown>;
    expect(fm.name).toBe(PAGE_AUTHORING_SKILL_NAME);
    expect(typeof fm.description).toBe('string');
    expect(typeof fm.version).toBe('string');
    expect(typeof fm.author).toBe('string');
    expect(Array.isArray(fm.tags)).toBe(true);
  });

  it('is deterministic (no timestamps, stable ordering)', () => {
    expect(buildOssPageAuthoringSkill()).toBe(buildOssPageAuthoringSkill());
  });

  it('documents every content type and contains valid YAML examples', () => {
    const skill = buildOssPageAuthoringSkill();
    for (const key of ['carousel', 'main', 'alert', 'grid', 'map', 'collection_list']) {
      expect(skill).toContain(`### \`${key}\``);
    }
    const examples = [...skill.matchAll(/```yaml\n([\s\S]*?)```/g)];
    expect(examples.length).toBeGreaterThan(0);
    for (const [, body] of examples) {
      expect(() => yaml.load(body)).not.toThrow();
    }
  });

  it('matches the emitted structure snapshot', () => {
    expect(buildOssPageAuthoringSkill()).toMatchSnapshot();
  });

  it('sections compose: OSS sections are a prefix of the full skill body', () => {
    const sections = buildOssPageAuthoringSections();
    const skill = buildOssPageAuthoringSkill();
    for (const section of sections) {
      expect(skill).toContain(section);
    }
  });
});

describe('generateSkills', () => {
  it('writes the skill, then reports up-to-date, then detects drift in --check mode', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-skills-'));
    try {
      const first = generateSkills(root);
      expect(first.errors).toEqual([]);
      expect(first.filesUpdated).toHaveLength(1);
      const skillPath = first.filesUpdated[0];
      expect(skillPath.endsWith(path.join(PAGE_AUTHORING_SKILL_NAME, 'SKILL.md'))).toBe(true);

      const second = generateSkills(root, { check: true });
      expect(second.errors).toEqual([]);
      expect(second.filesSkipped).toEqual([skillPath]);

      fs.appendFileSync(skillPath, 'drift!\n');
      const third = generateSkills(root, { check: true });
      expect(third.errors).toHaveLength(1);
      expect(third.errors[0]).toContain('out of sync');
      // check mode must not rewrite the file
      expect(fs.readFileSync(skillPath, 'utf-8')).toContain('drift!');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
