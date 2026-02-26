import React from "react";
import { PageContent, SiteConfig } from "@stackwright/types";
import PageLayout from "./structural/PageLayout";
import { ThemeProvider, ThemeLoader } from "@stackwright/themes";
import {
    CssBaseline,
    Box,
    styled,
    ThemeProvider as MuiThemeProvider,
    createTheme,
} from "@mui/material";

// Defined at module scope so styled() is not called on every render.
const ShimmerOverlay = styled(Box)({
    position: "absolute",
    top: 0,
    left: "-100%",
    width: "100%",
    height: "100%",
    background:
        "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
    animation: "sf-shimmer 2s ease-in-out infinite",
    pointerEvents: "none",
    "@keyframes sf-shimmer": {
        "0%": { left: "-100%" },
        "100%": { left: "100%" },
    },
});

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class DynamicPageErrorBoundary extends React.Component<
    React.PropsWithChildren<{ pageName?: string }>,
    ErrorBoundaryState
> {
    state: ErrorBoundaryState = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error("[Stackwright] DynamicPage render error:", error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Box
                    sx={{
                        p: 4,
                        m: 2,
                        border: "1px solid",
                        borderColor: "error.main",
                        borderRadius: 1,
                        backgroundColor: "error.light",
                        color: "error.contrastText",
                    }}
                >
                    <Box component="strong" sx={{ display: "block", mb: 1 }}>
                        Page render error
                    </Box>
                    <Box
                        component="pre"
                        sx={{
                            fontFamily: "monospace",
                            fontSize: "0.8rem",
                            whiteSpace: "pre-wrap",
                            m: 0,
                        }}
                    >
                        {this.state.error?.message ?? "Unknown error"}
                    </Box>
                </Box>
            );
        }
        return this.props.children;
    }
}

interface DynamicPageProps {
    pageContent: PageContent;
    siteConfig?: SiteConfig;
}

export default function DynamicPage({
    pageContent,
    siteConfig,
}: DynamicPageProps) {
    // Load theme from siteConfig or default to 'corporate'
    const themeName = siteConfig?.themeName || "corporate";
    let theme;

    try {
        // Check if there's a custom theme provided
        if (siteConfig?.customTheme) {
            theme = ThemeLoader.loadCustomTheme(siteConfig.customTheme);
        } else {
            theme = ThemeLoader.loadThemeFromFile(themeName);
        }
    } catch (error) {
        console.warn(
            `Failed to load theme '${themeName}', falling back to corporate theme:`,
            error,
        );
        theme = ThemeLoader.loadThemeFromFile("corporate");
    }

    // Build background image styles
    const backgroundImageStyles = siteConfig?.customTheme?.backgroundImage
        ? {
              backgroundImage: `url(${siteConfig.customTheme.backgroundImage.url})`,
              backgroundRepeat:
                  siteConfig.customTheme.backgroundImage.repeat || "repeat",
              backgroundSize: siteConfig.customTheme.backgroundImage.scale
                  ? `${siteConfig.customTheme.backgroundImage.scale * 100}%`
                  : siteConfig.customTheme.backgroundImage.size || "auto",
              backgroundPosition:
                  siteConfig.customTheme.backgroundImage.position || "top left",
              backgroundAttachment:
                  siteConfig.customTheme.backgroundImage.attachment || "scroll",
          }
        : {};

    const showShimmer =
        siteConfig?.customTheme?.backgroundImage?.animation === "shimmer" ||
        siteConfig?.customTheme?.backgroundImage?.animation === "shimmer-float";

    // Generate animation styles for drift and float
    const getDriftFloatStyles = () => {
        const bgImg = siteConfig?.customTheme?.backgroundImage;
        if (!bgImg?.animation || bgImg.animation === "shimmer") return {};

        switch (bgImg.animation) {
            case "drift":
                return {
                    animation: "sf-drift 60s linear infinite",
                    "@keyframes sf-drift": {
                        "0%": { backgroundPositionY: "0px" },
                        "100%": { backgroundPositionY: "100px" },
                    },
                };
            case "float":
            case "shimmer-float":
                return {
                    animation: "sf-float 8s ease-in-out infinite",
                    "@keyframes sf-float": {
                        "0%, 100%": { backgroundPositionY: "0px" },
                        "50%": { backgroundPositionY: "20px" },
                    },
                };
            default:
                return {};
        }
    };

    const muiTheme = createTheme({
        palette: {
            primary: { main: theme.colors.primary },
            secondary: { main: theme.colors.secondary },
            background: {
                default: theme.colors.background,
                paper: theme.colors.surface,
            },
            text: {
                primary: theme.colors.text,
                secondary: theme.colors.textSecondary,
            },
        },
        typography: {
            fontFamily:
                theme.typography?.fontFamily?.primary || "Roboto, sans-serif",
        },
    });

    return (
        <MuiThemeProvider theme={muiTheme}>
            <ThemeProvider theme={theme}>
                <CssBaseline>
                    <Box
                        sx={{
                            minHeight: "100vh",
                            position: "relative",
                            overflow: "hidden",
                            ...backgroundImageStyles,
                            ...getDriftFloatStyles(),
                        }}
                    >
                        {showShimmer && <ShimmerOverlay />}
                        <DynamicPageErrorBoundary pageName={pageContent?.slug}>
                            <PageLayout
                                pageContent={pageContent}
                                siteConfig={siteConfig}
                            />
                        </DynamicPageErrorBoundary>
                    </Box>
                </CssBaseline>
            </ThemeProvider>
        </MuiThemeProvider>
    );
}
