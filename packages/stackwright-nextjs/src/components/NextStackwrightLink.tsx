import React from 'react';
import Link from 'next/link';
import { StackwrightLinkProps } from '@stackwright/core';

export const NextStackwrightLink: React.FC<StackwrightLinkProps> = ({
  href,
  children,
  target,
  rel,
  prefetch = true,
  replace = false,
  scroll = true,
  shallow = false,
  className,
  style,
  onClick,
  ...props
}) => {
  // Handle external links
  const isExternal = href.startsWith('http') || href.startsWith('//');
  
  if (isExternal) {
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
  }

  return (
    <Link
      href={href}
      prefetch={prefetch}
      replace={replace}
      scroll={scroll}
      shallow={shallow}
      className={className}
      style={style}
      onClick={onClick}
      {...props}
    >
      {children}
    </Link>
  );
};
