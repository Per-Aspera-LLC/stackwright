import React from "react";
import TopAppBar from "./TopAppBar";
import { PageContent } from "@stackwright/types";
import { SiteConfig } from "@stackwright/types";
import BottomAppBar from "./BottomAppBar";
import { renderContent } from "../../utils/contentRenderer";
import { useSafeTheme } from "../../hooks/useSafeTheme";
import { defaultSiteConfig } from "../../config/siteDefaults";

interface PageLayoutProps {
    pageContent: PageContent;
    siteConfig?: SiteConfig;
}

export default function PageLayout({
    pageContent,
    siteConfig,
}: PageLayoutProps) {
    const theme = useSafeTheme();

    const config = siteConfig || defaultSiteConfig;

    const hasBackgroundImage = siteConfig?.customTheme?.backgroundImage?.url;
    const backgroundColor = hasBackgroundImage
        ? "transparent"
        : theme.colors.background;

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
                backgroundColor: backgroundColor,
                color: theme.colors.text,
            }}
        >
            <TopAppBar
                title={config.appBar.titleText}
                logo={config.appBar.logo}
                menuItems={config.navigation}
                textcolor={config.appBar.textColor}
                backgroundcolor={config.appBar.backgroundColor}
            />

            <main
                style={{
                    flexGrow: 1,
                    backgroundColor: backgroundColor,
                }}
            >
                {renderContent(pageContent)}
            </main>

            <BottomAppBar footer={config.footer} />
        </div>
    );
}
