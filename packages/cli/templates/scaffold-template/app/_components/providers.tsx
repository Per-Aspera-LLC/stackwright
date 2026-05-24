'use client';
import { registerNextJSComponents } from '@stackwright/nextjs';
import { registerDefaultIcons } from '@stackwright/icons';
import { registerShadcnComponents } from '@stackwright/ui-shadcn';
import '@stackwright/ui-shadcn/styles.css';

// Register Next.js adapter components (Image, Link, Router, Route), icons, and UI.
// This file is a Client Component so registrations happen in the browser's module scope,
// where the Stackwright component registry (module-level singleton) is accessible
// to DynamicPage during hydration.
registerNextJSComponents();
registerDefaultIcons();
registerShadcnComponents();

export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
