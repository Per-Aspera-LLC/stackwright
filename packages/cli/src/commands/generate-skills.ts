import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { outputResult } from '../utils/json-output';
import { PAGE_AUTHORING_SKILL_NAME, buildOssPageAuthoringSkill } from '../agent-docs/skill';

export interface GenerateSkillsResult {
  /** Files written (or that WOULD change, in check mode). */
  filesUpdated: string[];
  /** Files already up to date. */
  filesSkipped: string[];
  errors: string[];
  /** True when run with --check (no files written). */
  checkMode: boolean;
}

export interface GenerateSkillsOptions {
  /** Compare only; report drift without writing. Mirrors the AGENTS.md CI sync pattern. */
  check?: boolean;
  /** Output directory for skill folders. Default: <root>/skills */
  outDir?: string;
}

export function generateSkills(
  root: string = process.cwd(),
  options: GenerateSkillsOptions = {}
): GenerateSkillsResult {
  const outDir = options.outDir ?? path.join(root, 'skills');
  const skillPath = path.join(outDir, PAGE_AUTHORING_SKILL_NAME, 'SKILL.md');

  const result: GenerateSkillsResult = {
    filesUpdated: [],
    filesSkipped: [],
    errors: [],
    checkMode: Boolean(options.check),
  };

  let content: string;
  try {
    content = buildOssPageAuthoringSkill();
  } catch (err) {
    result.errors.push(`Skill generation failed: ${String(err)}`);
    return result;
  }

  const existing = fs.existsSync(skillPath) ? fs.readFileSync(skillPath, 'utf-8') : null;

  if (existing === content) {
    result.filesSkipped.push(skillPath);
    return result;
  }

  if (options.check) {
    result.errors.push(
      `Skill is out of sync: ${skillPath}. Run 'pnpm stackwright -- generate-skills' and commit the result.`
    );
    result.filesUpdated.push(skillPath);
    return result;
  }

  fs.mkdirSync(path.dirname(skillPath), { recursive: true });
  fs.writeFileSync(skillPath, content, 'utf-8');
  result.filesUpdated.push(skillPath);
  return result;
}

export function registerGenerateSkills(program: Command): void {
  program
    .command('generate-skills')
    .description('Generate the stackwright-page-authoring code-puppy skill from live Zod schemas')
    .option('--root <path>', 'Root directory of the monorepo (defaults to cwd)')
    .option('--out-dir <path>', 'Output directory for skill folders (defaults to <root>/skills)')
    .option('--check', 'Fail (exit 1) if the committed skill is out of sync; write nothing')
    .option('--json', 'Output machine-readable JSON')
    .action((opts: { root?: string; outDir?: string; check?: boolean; json?: boolean }) => {
      const root = opts.root ?? process.cwd();
      const result = generateSkills(root, { check: opts.check, outDir: opts.outDir });

      outputResult(result, { json: Boolean(opts.json) }, () => {
        if (result.errors.length > 0) {
          for (const err of result.errors) {
            process.stderr.write(`Error: ${err}\n`);
          }
          process.exit(1);
        }

        if (result.filesUpdated.length === 0 && result.filesSkipped.length > 0) {
          console.log('Skill files are already up to date.');
        } else {
          for (const f of result.filesUpdated) {
            console.log(`Updated: ${f}`);
          }
          for (const f of result.filesSkipped) {
            console.log(`Up to date: ${f}`);
          }
        }
      });

      // In JSON mode outputResult prints the result; still honor exit codes.
      if (opts.json && result.errors.length > 0) {
        process.exit(1);
      }
    });
}
