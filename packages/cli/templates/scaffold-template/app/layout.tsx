import type { Metadata } from 'next';
import { StackwrightLayout } from '@stackwright/nextjs/server';
import { registerCollectionProvider } from '@stackwright/core';
import { FileCollectionProvider } from '@stackwright/collections';
import { Providers } from './_components/providers';

export const metadata: Metadata = {
  title: '{{siteTitle}}',
  description: 'Built with Stackwright',
};

registerCollectionProvider(new FileCollectionProvider());

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <StackwrightLayout>
      <Providers>{children}</Providers>
    </StackwrightLayout>
  );
}
