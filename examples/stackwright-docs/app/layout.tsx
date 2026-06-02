import type { Metadata } from 'next';
import { StackwrightLayout } from '@stackwright/nextjs/server';
import { Providers } from './_components/providers';

export const metadata: Metadata = {
  title: 'Stackwright',
  description: 'YAML-driven React application framework',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <StackwrightLayout>
      <Providers>{children}</Providers>
    </StackwrightLayout>
  );
}
