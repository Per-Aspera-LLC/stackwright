import React from 'react';
import { ContactFormStubContent } from '@stackwright/types';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { resolveColor } from '../../utils/colorUtils';

export function ContactFormStub({
    heading,
    description,
    email,
    email_subject,
    phone,
    address,
    button_text,
    background,
}: ContactFormStubContent) {
    const theme = useSafeTheme();

    const headingColor = resolveColor(
        heading?.textColor ? heading.textColor : theme.colors.primary,
        theme.colors,
    );

    const mailto = email_subject
        ? `mailto:${email}?subject=${encodeURIComponent(email_subject)}`
        : `mailto:${email}`;

    return (
        <section
            style={{
                padding: '48px 32px',
                background: background || 'transparent',
            }}
        >
            <div
                style={{
                    maxWidth: '600px',
                    margin: '0 auto',
                    textAlign: 'center',
                }}
            >
                {heading?.text && (
                    <h3
                        style={{
                            color: headingColor,
                            marginBottom: '16px',
                        }}
                    >
                        {heading.text}
                    </h3>
                )}
                {description && (
                    <p
                        style={{
                            color: theme.colors.text,
                            opacity: 0.8,
                            lineHeight: 1.6,
                            marginBottom: '24px',
                        }}
                    >
                        {description}
                    </p>
                )}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        marginBottom: '24px',
                        textAlign: 'left',
                        backgroundColor: theme.colors.surface,
                        borderRadius: '8px',
                        padding: '24px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: theme.colors.text }}>Email:</span>
                        <a
                            href={mailto}
                            style={{ color: theme.colors.primary, textDecoration: 'none', wordBreak: 'break-all' }}
                        >
                            {email}
                        </a>
                    </div>
                    {phone && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                            <span style={{ fontWeight: 600, color: theme.colors.text }}>Phone:</span>
                            <a
                                href={`tel:${phone}`}
                                style={{ color: theme.colors.primary, textDecoration: 'none', wordBreak: 'break-all' }}
                            >
                                {phone}
                            </a>
                        </div>
                    )}
                    {address && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                            <span style={{ fontWeight: 600, color: theme.colors.text }}>Address:</span>
                            <span style={{ color: theme.colors.text, wordBreak: 'break-word' }}>{address}</span>
                        </div>
                    )}
                </div>
                <a
                    href={mailto}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px 32px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontWeight: 600,
                        cursor: 'pointer',
                        backgroundColor: theme.colors.primary,
                        color: theme.colors.surface,
                        border: 'none',
                        fontSize: '1rem',
                        transition: 'background-color 0.2s',
                    }}
                >
                    {button_text || 'Contact Us'}
                </a>
            </div>
        </section>
    );
}
