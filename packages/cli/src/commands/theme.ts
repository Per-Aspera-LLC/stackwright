import { Command } from 'commander';
import chalk from 'chalk';
import { getBuiltInThemes, ThemeSummary } from '../utils/theme-selector';
import { outputResult } from '../utils/json-output';

// ---------------------------------------------------------------------------
// Pure function
// ---------------------------------------------------------------------------

export interface ThemeListResult {
  themes: ThemeSummary[];
}

export function listThemes(): ThemeListResult {
  return { themes: getBuiltInThemes() };
}

// ---------------------------------------------------------------------------
// Commander registration
// ---------------------------------------------------------------------------

export function registerTheme(program: Command): void {
  const theme = program.command('theme').description('Manage themes');

  theme
    .command('list')
    .description('List available built-in themes')
    .option('--json', 'Output machine-readable JSON')
    .action((opts: { json?: boolean }) => {
      const json = Boolean(opts.json);
      const result = listThemes();

      outputResult(result, { json }, () => {
        console.log(chalk.bold('\nAvailable themes\n'));
        for (const t of result.themes) {
          console.log(`  ${chalk.cyan(t.id.padEnd(16))} ${t.name} — ${t.description}`);
        }
      });
    });
}
