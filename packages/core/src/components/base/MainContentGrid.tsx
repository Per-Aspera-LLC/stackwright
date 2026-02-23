import React from "react";
import { Box, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import { MainContent, GraphicPosition } from "@stackwright/types";
import { TextGrid } from "./TextGrid";
import { ThemedButton } from "./ThemedButton";
import { useSafeTheme } from "../../hooks/useSafeTheme";
import { Media } from "../media/Media";
import { resolveColor } from "../../utils/colorUtils";

export function MainContentGrid(content: MainContent) {
    const theme = useSafeTheme();

    // Calculate column sizes based on textToGraphic ratio (default 58% text, 42% graphic)
    const textRatio = content.textToGraphic ?? 58;
    const textColumns = Math.round((textRatio / 100) * 12);
    const graphicColumns = 12 - textColumns;

    // Calculate mobile graphic size (constrained to 6-10 columns for better mobile UX)
    const graphicColumnsXs = Math.max(6, Math.min(10, graphicColumns));

    const headerColor = resolveColor(
        content.heading.textColor
            ? content.heading.textColor
            : theme.colors.primary,
        theme.colors,
    );

    const imageGrid = content.media && (
        <Grid
            container
            spacing={2}
            alignItems="center"
            size={{
                xs: graphicColumnsXs,
                md: graphicColumns,
            }}
            padding={1}
        >
            <Box sx={{ width: "100%", height: "100%" }}>
                <Media
                    {...content.media}
                    label={`${content.heading?.text} graphic`}
                />
            </Box>
        </Grid>
    );
    const textGrid = (
        <Grid
            container
            spacing={2}
            alignItems="center"
            size={{
                xs: 12,
                md: textColumns,
            }}
            padding={1}
        >
            <Box
                sx={{
                    width: "100%",
                    height: "auto",
                }}
            >
                {content.heading?.text && (
                    <Typography
                        variant={content.heading.textSize}
                        sx={{
                            color: headerColor,
                        }}
                    >
                        {content.heading.text}
                    </Typography>
                )}
                {content.textBlocks && (
                    <TextGrid content={content.textBlocks} />
                )}

                {content.buttons && (
                    <Grid
                        container
                        spacing={2}
                        sx={{
                            mt: 2,
                            justifyContent: {
                                xs: "center",
                                sm: "center",
                            },
                        }}
                    >
                        {content.buttons.map((button, index) => (
                            <Grid key={index}>
                                <ThemedButton button={button} />
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Box>
        </Grid>
    );
    return (
        <Box
            sx={{
                py: 2,
                background: content?.background || "transparent",
                m: 4,
            }}
        >
            <Grid
                container
                spacing={2}
                sx={{
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: {
                        xs: "column",
                        md: "row",
                    },
                }}
            >
                {content.media ? (
                    content.graphic_position === GraphicPosition.LEFT ? (
                        <>
                            {imageGrid}
                            {textGrid}
                        </>
                    ) : (
                        <>
                            {textGrid}
                            {imageGrid}
                        </>
                    )
                ) : (
                    textGrid
                )}
            </Grid>
        </Box>
    );
}
