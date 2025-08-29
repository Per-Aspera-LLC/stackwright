import type { AppProps } from 'next/app';
import { registerDefaultIcons } from '@stackwright/icons';

// Register icons once for the entire application
registerDefaultIcons();

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}