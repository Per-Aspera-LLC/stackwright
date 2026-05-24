'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
export { useRouter } from 'next/navigation';
import { StackwrightRouterProps, StackwrightRouteProps } from '@stackwright/core';

/**
 * Next.js App Router integration for Stackwright routing.
 * Uses `next/navigation` (App Router).
 *
 * @deprecated Pages Router (`next/router`) support has been removed.
 * This component now requires App Router. If you are on Pages Router,
 * pin `@stackwright/nextjs` to a version prior to 0.6.0.
 */
export const NextStackwrightRouter: React.FC<StackwrightRouterProps> = ({ children }) => {
  // Next.js handles routing automatically, so we just render children
  return <>{children}</>;
};

export const NextStackwrightRoute: React.FC<StackwrightRouteProps> = ({
  path,
  component: Component,
  exact = false,
  ...props
}) => {
  const currentPath = usePathname();

  // Simple route matching logic
  const matches = exact ? currentPath === path : currentPath.startsWith(path);

  if (!matches) {
    return null;
  }

  return <Component {...props} />;
};
