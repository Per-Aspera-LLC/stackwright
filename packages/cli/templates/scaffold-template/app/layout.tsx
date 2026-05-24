import type { Metadata } from 'next';
import { StackwrightLayout } from '@stackwright/nextjs';
import { Providers } from './_components/providers';

export const metadata: Metadata = {
  title: '{{siteTitle}}',
  description: 'Built with Stackwright',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <StackwrightLayout>
      <Providers>{children}</Providers>
    </StackwrightLayout>
  );
}
