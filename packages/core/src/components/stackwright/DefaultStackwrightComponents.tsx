import React from 'react';
import { StackwrightImageProps, StackwrightLinkProps, StackwrightRouterProps, StackwrightRouteProps } from '../../interfaces/stackwright-components';

// Default HTML-based Image implementation
export const DefaultStackwrightImage: React.FC<StackwrightImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  style,
  onLoad,
  onError,
  ...props
}) => {
  const imgStyle: React.CSSProperties = {
    ...style,
    ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height && { height: typeof height === 'number' ? `${height}px` : height }),
  };

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={imgStyle}
      onLoad={onLoad}
      onError={onError}
      {...props}
    />
  );
};

// Default HTML-based Link implementation
export const DefaultStackwrightLink: React.FC<StackwrightLinkProps> = ({
  href,
  children,
  target,
  rel,
  className,
  style,
  onClick,
  ...props
}) => {
  return (
    <a
      href={href}
      target={target}
      rel={rel}
      className={className}
      style={style}
      onClick={onClick}
      {...props}
    >
      {children}
    </a>
  );
};

// Simple Router implementation (for basic routing)
export const DefaultStackwrightRouter: React.FC<StackwrightRouterProps> = ({ children }) => {
  return <>{children}</>;
};

// Simple Route implementation
export const DefaultStackwrightRoute: React.FC<StackwrightRouteProps> = ({
  path,
  component: Component,
  exact = false,
  ...props
}) => {
  // Basic client-side routing logic
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const matches = exact ? currentPath === path : currentPath.startsWith(path);
  
  if (!matches) {
    return null;
  }

  return <Component {...props} />;
};

// Export default implementations as a set
export const defaultStackwrightComponents = {
  Image: DefaultStackwrightImage,
  Link: DefaultStackwrightLink,
  Router: DefaultStackwrightRouter,
  Route: DefaultStackwrightRoute,
};
