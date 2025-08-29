"use client";

import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { TabbedContent, ContentItem } from '@stackwright/types';
import { renderContent } from '../../utils/contentRenderer';
import { useSafeTheme } from '../../hooks/useSafeTheme';

export function TabbedContentGrid( content: TabbedContent) {
  const theme = useSafeTheme();
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  return (
    <Box sx={{ 
      flexGrow: 1, 
      width: '100%',
      padding: 4
    }}>
      <Grid container 
        alignItems="center" 
        size={{
          xs: 12,
          md: 7
        }}
        sx={{ 
          width: '100%', 
          textAlign: 'center', 
          justifyContent: 'center',
          marginTop: 2,
          marginBottom: 2
        }}
      >
        <Grid size={{xs: 12}} container sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Typography 
            variant={content?.heading?.textSize || 'body1'} 
            gutterBottom
            sx={{ 
              width: '100%', 
              textAlign: 'center',
              color: theme.colors.text
            }}
          >
            {content.heading.text}
          </Typography>
        </Grid>

        <Grid container size={{xs: 12}} sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Tabs 
            value={value}
            onChange={handleChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              width: '100%',
              '& .MuiTabs-flexContainer': {
                justifyContent: 'center',
              },
              '& .MuiTabs-scroller': {
                display: 'flex',
                justifyContent: 'center',
              }
            }}
          >
            {content.tabs.map((tab: ContentItem, index) => {
              const contentData = Object.entries(tab)[0]?.[1];
              
              return (
                <Tab 
                  key={index}
                  label={`${tab.label}`}
                  id={`tab-${index}`}
                  aria-controls={`tabpanel-${index}`}
                />
              );
            })}
          </Tabs>
          {content.tabs.map((tab: ContentItem, index) => (
            <div
              key={index}
              role="tabpanel"
              hidden={value !== index}
              id={`tabpanel-${index}`}
              aria-labelledby={`tab-${index}`}
              style={{ width: '100%' }}
            >
              {value === index && (
                <Box sx={{ 
                  p: 3,
                  transition: 'all 0.3s ease-in-out'
                }}>
                  {renderContent(tab)}
                </Box>
              )}
            </div>
          ))}
        </Grid>
      </Grid>
    </Box>
  );
}
