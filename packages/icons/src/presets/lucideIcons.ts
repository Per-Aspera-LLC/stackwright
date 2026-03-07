// Lucide icon preset — replaces the former muiIcons preset.
// Import specific icons to keep the bundle tree-shakeable.
// Keys match the legacy MUI export names so existing YAML content continues to work.

import {
  Zap,           // Speed
  ShieldCheck,   // VerifiedUser
  CloudCheck,    // CloudDone
  FileText,      // Description
  Palette,       // Palette
  Code,          // Code
  Star,          // Star
  CheckCircle,   // CheckCircle
  Rocket,        // Rocket
  Lock,          // Lock
  Globe,         // Language
  Wrench,        // Build
  Sparkles,      // AutoAwesome
  LayoutDashboard, // Dashboard
  Braces,        // Api
  Database,      // Storage
  Cloud,         // Cloud
  Shield,        // Security
  Users,         // People
  TrendingUp,    // TrendingUp
  Info,          // Info (alert)
  AlertTriangle, // AlertTriangle (alert)
  CircleAlert,   // CircleAlert (alert)
} from 'lucide-react';

import { registerStackwrightIcons } from '../registry/iconRegistry';

export const lucideIconPreset: Record<string, React.ComponentType<any>> = {
  Speed: Zap,
  VerifiedUser: ShieldCheck,
  CloudDone: CloudCheck,
  Description: FileText,
  Palette,
  Code,
  Star,
  CheckCircle,
  Rocket,
  Lock,
  Language: Globe,
  Build: Wrench,
  AutoAwesome: Sparkles,
  Dashboard: LayoutDashboard,
  Api: Braces,
  Storage: Database,
  Cloud,
  Security: Shield,
  People: Users,
  TrendingUp,
  Info,
  AlertTriangle,
  CircleAlert,
};

export function registerLucideIcons() {
  registerStackwrightIcons(lucideIconPreset);
}
