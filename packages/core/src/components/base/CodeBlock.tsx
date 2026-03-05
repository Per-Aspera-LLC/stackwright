import React from "react";
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
        <div
            style={{
                margin: '0 32px',
                padding: '16px 0',
                background: background || "transparent",
            }}
        >
            <div
                style={{
                    backgroundColor: "#f4f4f5",
                    borderRadius: '4px',
                    overflow: "auto",
                    border: `1px solid ${theme.colors.textSecondary}22`,
                }}
            >
                {language && (
                    <div
                        style={{
                            padding: '4px 16px',
                            borderBottom: `1px solid ${theme.colors.textSecondary}22`,
                        }}
                    >
                        <span
                            style={{
                                fontSize: '0.75rem',
                                color: theme.colors.textSecondary,
                                fontFamily: "monospace",
                            }}
                        >
                            {language}
                        </span>
                    </div>
                )}
                <pre
                    style={{
                        margin: 0,
                        padding: '16px',
                        overflow: "auto",
                        fontFamily: "monospace",
                        fontSize: "0.875rem",
                        lineHeight: 1.6,
                        color: theme.colors.text,
                    }}
                >
                    {lines.map((line, i) => (
                        <span
                            key={i}
                            style={{ display: "flex", gap: '16px' }}
                        >
                            {lineNumbers && (
                                <span
                                    style={{
                                        userSelect: "none",
                                        minWidth: "2ch",
                                        textAlign: "right",
                                        color: theme.colors.textSecondary,
                                        flexShrink: 0,
                                    }}
                                >
                                    {i + 1}
                                </span>
                            )}
                            <span>{line}</span>
                            {"\n"}
                        </span>
                    ))}
                </pre>
            </div>
        </div>
    );
}
