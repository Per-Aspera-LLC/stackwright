import React from 'react';
import { PageContent } from '@stackwright/types';
import { renderContent } from '../../utils/contentRenderer';
import { useSafeTheme } from '../../hooks/useSafeTheme';

// This is now a simple wrapper - consider deprecating in favor of PageLayout
export default function DefaultPageLayout(pageContent: PageContent) {
  const theme = useSafeTheme();

  return (
    <main>
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
        <div>{renderContent(pageContent)}</div>
      </div>
    </main>
  );
}
