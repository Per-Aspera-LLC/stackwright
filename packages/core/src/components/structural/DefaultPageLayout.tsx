import React from 'react';
import { PageContent } from '@stackwright/types';
import { renderContent } from '../../utils/contentRenderer';

// This is now a simple wrapper - consider deprecating in favor of PageLayout
export default function DefaultPageLayout(pageContent: PageContent) {
  return (
    <main>
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>{renderContent(pageContent)}</div>
      </div>
    </main>
  );
}
