import type { AppProps } from "next/app";
import { registerSiteIcons } from "../stackwright-generated/icons";
import { registerNextJSComponents } from "@stackwright/nextjs";
import { registerShadcnComponents } from "@stackwright/ui-shadcn";
import "@stackwright/ui-shadcn/styles.css";

// Register Next.js adapter components (Image, Link, Router, Route), icons, and UI
registerNextJSComponents();
registerSiteIcons();
registerShadcnComponents();

export default function App({ Component, pageProps }: AppProps) {
    return <Component {...pageProps} />;
}
