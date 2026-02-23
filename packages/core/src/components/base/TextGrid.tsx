import React from "react";
import { Box, Divider, Typography } from "@mui/material";
import { TextBlock } from "@stackwright/types";
import { v4 as uuidv4 } from "uuid";
import { useSafeTheme } from "../../hooks/useSafeTheme";

const BULLET_CHARACTER = "-";
const LIST_CHARACTER = "#";

interface TextGridProps {
    content: TextBlock[];
    config?: {
        list_icon?: string;
    };
}

export function TextGrid({ content, config }: TextGridProps) {
    const theme = useSafeTheme();
    const listIcon = config?.list_icon || "•"; // Default fallback

    const startsWithBullet = (text: string) => {
        return text.trimStart().startsWith(BULLET_CHARACTER);
    };

    const startsWithListNumber = (text: string) => {
        return text.trimStart().startsWith(LIST_CHARACTER);
    };

    const renderText = (textBlock: TextBlock) => {
        if (
            startsWithBullet(textBlock.text) ||
            startsWithListNumber(textBlock.text)
        ) {
            return textBlock.text
                .replace(BULLET_CHARACTER, "")
                .replace(LIST_CHARACTER, "")
                .trim();
        }
        switch (textBlock.text) {
            case "%DIVIDER%":
                return (
                    <Divider
                        sx={{
                            color:
                                textBlock.textColor ||
                                theme.colors.textSecondary,
                        }}
                    />
                );
            case "%SPACER%":
                return <Box height={16} />;
            default:
                return (
                    <Typography
                        variant={textBlock.textSize}
                        sx={{
                            fontSize: {
                                xs: "0.8em",
                                sm: "1em",
                                md: "1.2em",
                            },
                            color: textBlock.textColor || theme.colors.text,
                        }}
                    >
                        {textBlock.text}
                    </Typography>
                );
        }
    };

    let listNumber = 1;

    return (
        <>
            {content.map((textItem) => (
                <Box key={uuidv4()}>
                    {textItem.text
                        .split("\n")
                        .filter((line) => line.trim() !== "")
                        .map((line) => {
                            const lineBlock: TextBlock = {
                                ...textItem,
                                text: line,
                            };
                            return (
                                <Box
                                    key={uuidv4()}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 2,
                                        marginBottom: 1,
                                    }}
                                >
                                    {startsWithBullet(line) && listIcon && (
                                        <Typography
                                            variant={textItem.textSize}
                                            sx={{
                                                fontSize: {
                                                    xs: "0.8em",
                                                    sm: "1em",
                                                    md: "1.2em",
                                                },
                                                color: theme.colors.primary,
                                            }}
                                        >
                                            {listIcon}
                                        </Typography>
                                    )}

                                    {startsWithListNumber(line) && (
                                        <Typography
                                            variant={textItem.textSize}
                                            sx={{
                                                fontSize: {
                                                    xs: "0.8em",
                                                    sm: "1em",
                                                    md: "1.2em",
                                                },
                                                color: theme.colors.primary,
                                            }}
                                        >
                                            {listNumber++}.
                                        </Typography>
                                    )}

                                    {renderText(lineBlock)}
                                </Box>
                            );
                        })}
                </Box>
            ))}
        </>
    );
}
