import React from 'react';
import { TimelineContent } from '@stackwright/types';
import { useSafeTheme } from '../../hooks/useSafeTheme';

export function Timeline(content: TimelineContent) {
  const theme = useSafeTheme();

  return (
    <div style={{
      maxWidth: '896px',
      margin: '32px auto',
      padding: '48px 0',
      background: content?.background || 'transparent',
    }}>
      {content.heading && (
        <h3
          style={{
            marginBottom: '32px',
            textAlign: 'center',
            color: content.heading.textColor || theme.colors.text,
          }}
        >
          {content.heading.text}
        </h3>
      )}

      <div style={{ position: 'relative' }}>
        {/* Vertical line */}
        <div style={{
          position: 'absolute',
          left: '32px',
          top: 0,
          bottom: 0,
          width: '2px',
          backgroundColor: theme.colors.secondary || '#d1d5db',
        }} />

        {content.items.map((item, index) => (
          <div key={index} style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            marginBottom: '32px',
          }}>
            {/* Timeline dot */}
            <div style={{
              position: 'absolute',
              left: '24px',
              width: '16px',
              height: '16px',
              backgroundColor: theme.colors.primary || '#d97706',
              borderRadius: '50%',
              border: `4px solid ${theme.colors.surface}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            }} />

            {/* Content */}
            <div style={{ marginLeft: '64px' }}>
              <div style={{
                backgroundColor: theme.colors.surface,
                padding: '24px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              }}>
                <h4
                  style={{
                    color: theme.colors.primary || '#d97706',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    marginTop: 0,
                  }}
                >
                  {item.year}
                </h4>
                <p
                  style={{ color: theme.colors.text || '#374151', margin: 0 }}
                >
                  {item.event}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Timeline;