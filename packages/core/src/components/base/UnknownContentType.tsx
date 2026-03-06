import React from 'react';

interface UnknownContentTypeProps {
    contentType: string;
}

export function UnknownContentType({ contentType }: UnknownContentTypeProps) {
    return (
        <div
            style={{
                padding: '16px',
                margin: '8px 0',
                border: '1px solid #ed6c02',
                borderRadius: '4px',
                backgroundColor: '#fff3e0',
                color: '#e65100',
            }}
        >
            <strong style={{ display: 'block', marginBottom: '4px' }}>
                Unknown content type: &quot;{contentType}&quot;
            </strong>
            <span style={{ fontSize: '0.85rem' }}>
                This content type is not registered. Check for typos in your YAML
                content file or register a custom component.
            </span>
        </div>
    );
}
