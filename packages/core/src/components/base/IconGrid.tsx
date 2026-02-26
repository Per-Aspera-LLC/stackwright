"use client";
import React from "react";
import { Box, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import { IconGridContent } from "@stackwright/types";
import { useSafeTheme } from "../../hooks/useSafeTheme";
import { resolveColor } from "../../utils/colorUtils";
import { getIconRegistry } from "../../utils/stackwrightComponentRegistry";

function renderIcon(src: string, sizePx: number, color: string) {
    const IconComponent = getIconRegistry()?.get(src);
    if (IconComponent) {
        return <IconComponent sx={{ fontSize: sizePx, color }} />;
    }
    // Fallback: show the icon name so authors know what to register
    return (
        <Typography variant="caption" sx={{ color, fontFamily: "monospace" }}>
            {src}
        </Typography>
    );
}

export function IconGrid({ heading, icons, background }: IconGridContent) {
    const theme = useSafeTheme();

    const headingColor = resolveColor(
        heading?.textColor ? heading.textColor : theme.colors.primary,
        theme.colors,
    );

    return (
        <Box
            sx={{
                py: 2,
                background: background || "transparent",
                m: 4,
            }}
        >
            {heading?.text && (
                <Typography
                    variant={heading.textSize}
                    sx={{ color: headingColor, mb: 3, textAlign: "center" }}
                >
                    {heading.text}
                </Typography>
            )}
            <Grid
                container
                spacing={3}
                sx={{ justifyContent: "center", alignItems: "flex-start" }}
            >
                {icons.map((icon, index) => {
                    const iconColor = icon.color
                        ? resolveColor(icon.color, theme.colors)
                        : theme.colors.primary;
                    const sizePx = typeof icon.height === "number" ? icon.height : 48;

                    return (
                        <Grid
                            key={index}
                            size={{ xs: 6, sm: 4, md: 3, lg: 2 }}
                            sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: sizePx,
                                    width: sizePx,
                                }}
                            >
                                {renderIcon(icon.src, sizePx, iconColor)}
                            </Box>
                            {icon.label && (
                                <Typography
                                    variant="body2"
                                    sx={{
                                        textAlign: "center",
                                        color: theme.colors.text,
                                        fontWeight: 500,
                                    }}
                                >
                                    {icon.label}
                                </Typography>
                            )}
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
}
