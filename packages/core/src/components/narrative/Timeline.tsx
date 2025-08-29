import React from 'react';
import { Box, Typography } from '@mui/material';
import { TimelineContent } from '@stackwright/types';
import { useSafeTheme } from '../../hooks/useSafeTheme';

export function Timeline(content: TimelineContent) {
  const theme = useSafeTheme();

  return (
    <Box sx={{ 
      maxWidth: '4xl', 
      mx: 'auto', 
      py: 6,
      background: content?.background || 'transparent',
      m: 4
    }}>
      {content.heading && (
        <Typography 
          variant={content.heading.textSize} 
          sx={{ 
            mb: 4, 
            textAlign: 'center',
            color: content.heading.textColor || theme.colors.text
          }}
        >
          {content.heading.text}
        </Typography>
      )}
      
      <Box sx={{ position: 'relative' }}>
        {/* Vertical line */}
        <Box sx={{
          position: 'absolute',
          left: '32px',
          top: 0,
          bottom: 0,
          width: '2px',
          bgcolor: theme.colors.secondary || '#d1d5db'
        }} />
        
        {content.items.map((item, index) => (
          <Box key={index} sx={{ 
            position: 'relative', 
            display: 'flex', 
            alignItems: 'center', 
            mb: 4 
          }}>
            {/* Timeline dot */}
            <Box sx={{
              position: 'absolute',
              left: '24px',
              width: '16px',
              height: '16px',
              bgcolor: theme.colors.primary || '#d97706',
              borderRadius: '50%',
              border: '4px solid',
              borderColor: 'background.paper',
              boxShadow: 1
            }} />
            
            {/* Content */}
            <Box sx={{ ml: 8 }}>
              <Box sx={{
                bgcolor: 'background.paper',
                p: 3,
                borderRadius: 2,
                boxShadow: 1
              }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: theme.colors.primary || '#d97706',
                    fontWeight: 'bold',
                    mb: 1
                  }}
                >
                  {item.year}
                </Typography>
                <Typography 
                  variant="body1"
                  sx={{ color: theme.colors.text || '#374151' }}
                >
                  {item.event}
                </Typography>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default Timeline;