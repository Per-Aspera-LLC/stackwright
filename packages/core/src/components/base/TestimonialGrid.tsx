import React from 'react';
import { TestimonialGridContent } from '@stackwright/types';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { resolveColor } from '../../utils/colorUtils';
import { Media } from '../media/Media';

export function TestimonialGrid({ heading, columns = 3, items, background }: TestimonialGridContent) {
    const theme = useSafeTheme();

    const headingColor = resolveColor(
        heading?.textColor ? heading.textColor : theme.colors.primary,
        theme.colors,
    );

    return (
        <section
            style={{
                padding: '48px 32px',
                background: background || 'transparent',
            }}
        >
            {heading?.text && (
                <h3
                    style={{
                        color: headingColor,
                        marginBottom: '32px',
                        textAlign: 'center',
                    }}
                >
                    {heading.text}
                </h3>
            )}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '24px',
                    maxWidth: '1200px',
                    margin: '0 auto',
                }}
            >
                {items.map((item, index) => (
                    <div
                        key={index}
                        style={{
                            backgroundColor: theme.colors.surface,
                            borderRadius: '8px',
                            padding: '24px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <p
                            style={{
                                color: theme.colors.text,
                                fontStyle: 'italic',
                                lineHeight: 1.6,
                                margin: 0,
                                flex: 1,
                            }}
                        >
                            &ldquo;{item.quote}&rdquo;
                        </p>
                        <div
                            style={{
                                borderTop: `1px solid ${theme.colors.secondary || '#e5e7eb'}`,
                                marginTop: '16px',
                                paddingTop: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                            }}
                        >
                            {item.avatar && (
                                <div
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        overflow: 'hidden',
                                        flexShrink: 0,
                                    }}
                                >
                                    <Media
                                        {...item.avatar}
                                        alt={item.avatar.alt || item.name}
                                        label={item.name}
                                        height={40}
                                        width={40}
                                    />
                                </div>
                            )}
                            <div>
                                <div
                                    style={{
                                        fontWeight: 600,
                                        color: theme.colors.text,
                                    }}
                                >
                                    {item.name}
                                </div>
                                {(item.role || item.company) && (
                                    <div
                                        style={{
                                            fontSize: '0.875rem',
                                            color: theme.colors.text,
                                            opacity: 0.7,
                                        }}
                                    >
                                        {[item.role, item.company].filter(Boolean).join(', ')}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
