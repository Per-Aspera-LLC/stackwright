import type { AppProps } from "next/app";
import { registerDefaultIcons } from "@stackwright/icons";
import { registerNextJSComponents } from "@stackwright/nextjs";

// Register Next.js adapter components (Image, Link, Router, Route) and icons
registerNextJSComponents();
registerDefaultIcons();

export default function App({ Component, pageProps }: AppProps) {
    return <Component {...pageProps} />;
}
