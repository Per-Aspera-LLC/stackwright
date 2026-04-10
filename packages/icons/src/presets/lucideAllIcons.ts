// Full Lucide icon set registration.
// Imports the complete icon library (~1,500+ icons) via Lucide's barrel export.
// For a lighter alternative with ~40 curated icons, use lucideIcons.ts instead.

import { icons, Code2, Layout } from 'lucide-react';
import { registerStackwrightIcons } from '../registry/iconRegistry';

// Legacy MUI icon name aliases — ensures existing YAML content continues to work.
// Maps old MUI export names to their Lucide equivalents within the full set.
const legacyMuiAliases: Record<string, React.ComponentType<any>> = {
  Speed: icons.Zap,
  VerifiedUser: icons.ShieldCheck,
  CloudDone: icons.CloudCheck,
  Description: icons.FileText,
  Language: icons.Globe,
  Build: icons.Wrench,
  AutoAwesome: icons.Sparkles,
  Dashboard: icons.LayoutDashboard,
  Api: icons.Braces,
  Storage: icons.Database,
  Security: icons.Shield,
  People: icons.Users,
};

// Lucide renamed-icon aliases — the barrel export only contains canonical names,
// but older YAML content may reference the previous names.
const lucideRenamedAliases: Record<string, React.ComponentType<any>> = {
  CheckCircle: icons.CircleCheck,
  AlertTriangle: icons.TriangleAlert,
};

// Direct export icons — these exist in lucide-react but are NOT in the icons barrel export.
// Code2 is exported directly but missing from the icons object type.
const lucideDirectExports: Record<string, React.ComponentType<any>> = {
  Code2,
  Layout,
};

export const lucideAllIconsPreset: Record<string, React.ComponentType<any>> = {
  ...(icons as unknown as Record<string, React.ComponentType<any>>),
  ...lucideRenamedAliases,
  ...lucideDirectExports,
  ...legacyMuiAliases,
};

export function registerAllLucideIcons() {
  registerStackwrightIcons(lucideAllIconsPreset);
}
