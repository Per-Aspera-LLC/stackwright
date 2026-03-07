import React from 'react';
import { useRouter } from 'next/router';
import { StackwrightRouterProps, StackwrightRouteProps } from '@stackwright/core';

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
  const router = useRouter();
  const currentPath = router.pathname;

  // Simple route matching logic
  const matches = exact ? currentPath === path : currentPath.startsWith(path);

  if (!matches) {
    return null;
  }

  return <Component {...props} />;
};
