import type { AppProps } from "next/app";
import { registerDefaultIcons } from "@stackwright/icons";
import { registerNextJSComponents } from "@stackwright/nextjs";
import { registerShadcnComponents } from "@stackwright/ui-shadcn";
import { registerMapLibreProvider } from "@stackwright/maplibre";
import "@stackwright/ui-shadcn/styles.css";
import "@stackwright/maplibre/dist/styles.css";

// Register Next.js adapter components (Image, Link, Router, Route), icons, and UI
registerNextJSComponents();
registerDefaultIcons();
registerShadcnComponents();
registerMapLibreProvider(); // Register MapLibre as map provider


export default function App({ Component, pageProps }: AppProps) {
    return <Component {...pageProps} />;
}
