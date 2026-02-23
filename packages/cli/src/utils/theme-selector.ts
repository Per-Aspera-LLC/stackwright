import { select } from '@inquirer/prompts';
import { ThemeLoader } from '@stackwright/themes';

const BUILT_IN_THEME_IDS = ['corporate', 'soft'] as const;

function ensureThemesLoaded(): void {
  for (const id of BUILT_IN_THEME_IDS) {
    try {
      ThemeLoader.loadThemeFromFile(id);
    } catch {
      // Theme already loaded or unavailable — skip
    }
  }
}

export interface ThemeSummary {
  id: string;
  name: string;
  description: string;
}

export function getBuiltInThemes(): ThemeSummary[] {
  ensureThemesLoaded();
  return ThemeLoader.getAllThemes().map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description ?? '',
  }));
}

export async function promptThemeSelection(): Promise<string> {
  const themes = getBuiltInThemes();
  const themeId = await select({
    message: 'Select a theme:',
    choices: themes.map((t) => ({
      name: `${t.name} — ${t.description}`,
      value: t.id,
    })),
  });
  return themeId;
}
