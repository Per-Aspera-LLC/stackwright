// Lucide icon preset — replaces the former muiIcons preset.
// Import specific icons to keep the bundle tree-shakeable.
// Keys match the legacy MUI export names so existing YAML content continues to work.

import {
  Zap, // Speed
  ShieldCheck, // VerifiedUser
  CloudCheck, // CloudDone
  FileText, // Description
  Palette, // Palette
  Code, // Code
  Star, // Star
  CheckCircle, // CheckCircle
  Rocket, // Rocket
  Lock, // Lock
  Globe, // Language
  Wrench, // Build
  Sparkles, // AutoAwesome
  LayoutDashboard, // Dashboard
  Braces, // Api
  Database, // Storage
  Cloud, // Cloud
  Shield, // Security
  Users, // People
  TrendingUp, // TrendingUp
  Info, // Info (alert)
  AlertTriangle, // AlertTriangle (alert)
  CircleAlert, // CircleAlert (alert)
  Sun, // Sun (color mode)
  Moon, // Moon (color mode)
  BookOpen, // BookOpen (blog / docs)
  Calendar, // Calendar (dates)
  Tag, // Tag (tags / labels)
  ArrowRight, // ArrowRight (navigation)
  ChevronRight, // ChevronRight (navigation)
  ExternalLink, // ExternalLink (external links)
  GitBranch, // GitBranch (version control)
  Package, // Package (packages / dependencies)
  Puzzle, // Puzzle (plugins / extensions)
  Layers, // Layers (stacks / layers)
  DoorOpen, // DoorOpen (no lock-in)
  Bot, // Bot (AI)
  Paintbrush, // Paintbrush (theming)
  FlaskConical, // FlaskConical (testing)
  FileCheck, // FileCheck (validation)
  Gem, // Gem (quality)
  Code2, // Code2 (code)
  Layout, // Layout (layout)
} from 'lucide-react';

import { registerStackwrightIcons } from '../registry/iconRegistry';

export const lucideIconPreset: Record<string, React.ComponentType<any>> = {
  // Legacy MUI aliases
  Speed: Zap,
  VerifiedUser: ShieldCheck,
  CloudDone: CloudCheck,
  Description: FileText,
  Language: Globe,
  Build: Wrench,
  AutoAwesome: Sparkles,
  Dashboard: LayoutDashboard,
  Api: Braces,
  Storage: Database,
  Security: Shield,
  People: Users,

  // Direct lucide exports
  Zap,
  ShieldCheck,
  FileText,
  Palette,
  Code,
  Star,
  CheckCircle,
  Rocket,
  Lock,
  Globe,
  Wrench,
  Sparkles,
  LayoutDashboard,
  Braces,
  Database,
  Cloud,
  Shield,
  Users,
  TrendingUp,
  Info,
  AlertTriangle,
  CircleAlert,
  Sun,
  Moon,
  BookOpen,
  Calendar,
  Tag,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  GitBranch,
  Package,
  Puzzle,
  Layers,
  DoorOpen,
  Bot,
  Paintbrush,
  FlaskConical,
  FileCheck,
  Gem,
  Code2,
  Layout,
};

export function registerLucideIcons() {
  registerStackwrightIcons(lucideIconPreset);
}
