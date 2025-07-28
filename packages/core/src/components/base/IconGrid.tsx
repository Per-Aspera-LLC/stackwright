'use client';

import { Typography, Box } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { IconGridContent } from '@stackwright/types';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { getStackwrightImage } from '../../utils/stackwrightComponentRegistry';
interface IconGridProps {
    content: IconGridContent
}

export function IconGrid({ content }: IconGridProps) {
    const theme = useSafeTheme();
    const StackwrightImage = getStackwrightImage();
    // Calculate grid item width based on number of icons and max per row
    const totalIcons = content.icons.length
    const maxIconsPerRow = content.iconsPerRow
    const gridItemWidth = 12 / Math.min(totalIcons, maxIconsPerRow)

    return (
        <Box>
            {content.heading && (
                <Typography 
                    variant={content.heading.size} 
                    sx={{ 
                        textAlign: 'center',
                        mb: 4,
                        color: theme.colors.text
                    }}
                >
                    {content.heading.text}
                </Typography>
            )}
            <Grid 
                container 
                spacing={3} 
                sx={{ 
                    justifyContent: 'center',
                    '& .MuiGrid-root': {
                        display: 'flex',
                        justifyContent: 'center'
                    }
                }}
            >
                {content.icons.map((icon, index) => (
                    <Grid size={{ xs: gridItemWidth }} key={index}>
                        <Box 
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                padding: 2
                            }}
                        >
                            <Box 
                                sx={{
                                    position: 'relative',
                                    width: '100%',
                                    maxWidth: {
                                        size: '48px',
                                        sm: '64px',
                                        md: '96px',
                                    },
                                    aspectRatio: '1/1',
                                    mb: 1
                                }}
                            >
                                <StackwrightImage 
                                    src={`${icon.iconId}`}
                                    fill
                                    sizes="(max-width: 600px) 48px, (max-width: 900px) 64px, 96px"
                                    style={{ objectFit: 'contain' }}
                                    alt={icon.text.text}
                                />
                            </Box>
                            <Typography 
                                variant={icon.text.size}
                                sx={{ color: theme.colors.text }}
                            >
                                {icon.text.text}
                            </Typography>
                        </Box>
                    </Grid>
                ))}
            </Grid>
        </Box>
    )
}