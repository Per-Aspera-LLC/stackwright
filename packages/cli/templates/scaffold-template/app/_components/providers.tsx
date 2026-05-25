'use client';
import { registerAppRouterComponents } from '@stackwright/nextjs/app-router';
import { registerDefaultIcons } from '@stackwright/icons';
import { registerShadcnComponents } from '@stackwright/ui-shadcn';
import '@stackwright/ui-shadcn/styles.css';
import { registerCollectionProvider } from '@stackwright/core';
import { FileCollectionProvider } from '@stackwright/collections';

// Register Next.js adapter components (Image, Link, Router, Route), icons, and UI.
// Uses the App Router-safe entry point which excludes next/head (Pages Router API).
// This file is a Client Component so registrations happen in the browser's module scope,
// where the Stackwright component registry (module-level singleton) is accessible
// to DynamicPage during hydration.
registerAppRouterComponents();
registerDefaultIcons();
registerShadcnComponents();
registerCollectionProvider(new FileCollectionProvider());

export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
