import React from "react";
import { Box, Typography } from "@mui/material";
import { CodeBlockContent } from "@stackwright/types";
import { useSafeTheme } from "../../hooks/useSafeTheme";

export function CodeBlock({
    code,
    language,
    lineNumbers = false,
    background,
}: CodeBlockContent) {
    const theme = useSafeTheme();

    const lines = code.trimEnd().split("\n");

    return (
        <Box
            sx={{
                mx: 4,
                my: 0,
                py: 2,
                background: background || "transparent",
            }}
        >
            <Box
                sx={{
                    backgroundColor: "#f4f4f5",
                    borderRadius: 1,
                    overflow: "auto",
                    border: `1px solid ${theme.colors.textSecondary}22`,
                }}
            >
                {language && (
                    <Box
                        sx={{
                            px: 2,
                            py: 0.5,
                            borderBottom: `1px solid ${theme.colors.textSecondary}22`,
                        }}
                    >
                        <Typography
                            variant="caption"
                            sx={{
                                color: theme.colors.textSecondary,
                                fontFamily: "monospace",
                            }}
                        >
                            {language}
                        </Typography>
                    </Box>
                )}
                <Box
                    component="pre"
                    sx={{
                        m: 0,
                        p: 2,
                        overflow: "auto",
                        fontFamily: "monospace",
                        fontSize: "0.875rem",
                        lineHeight: 1.6,
                        color: theme.colors.text,
                    }}
                >
                    {lines.map((line, i) => (
                        <Box
                            key={i}
                            component="span"
                            sx={{ display: "flex", gap: 2 }}
                        >
                            {lineNumbers && (
                                <Box
                                    component="span"
                                    sx={{
                                        userSelect: "none",
                                        minWidth: "2ch",
                                        textAlign: "right",
                                        color: theme.colors.textSecondary,
                                        flexShrink: 0,
                                    }}
                                >
                                    {i + 1}
                                </Box>
                            )}
                            <Box component="span">{line}</Box>
                            {"\n"}
                        </Box>
                    ))}
                </Box>
            </Box>
        </Box>
    );
}
