import { Grid } from "@mui/material";
import { MediaStyleVariant } from '@stackwright/types';

interface MediaContainerProps {
  children: React.ReactNode;
  height?: string | number;
  width?: string | number;
  aspectRatio?: string | number;
  maxSize?: string | number;
  style?: MediaStyleVariant;
}

export function MediaContainer({ 
  children, 
  height, 
  width, 
  aspectRatio,
  maxSize,
  style = 'contained'
}: MediaContainerProps) {
  // Smart height/width defaults based on what's provided
  const getSmartHeight = (): string | number => {
    if (height !== undefined) return height;
    if (aspectRatio) return 'auto'; // Let aspectRatio handle it
    return '200px'; // Reasonable default for images with fill
  };

  const getSmartWidth = (): string | number => {
    if (width !== undefined) return width;
    if (aspectRatio) return '100%'; // Full width when using aspect ratio
    return '200px'; // Square default
  };

  return (
    <Grid 
      container 
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        height: getSmartHeight(),
        width: getSmartWidth(),
        aspectRatio,
        maxWidth: maxSize,
        maxHeight: maxSize,
        mx: 'auto',
        overflow: style === 'contained' ? 'hidden' : 'visible',
        '& img': {
          objectFit: style === 'contained' ? 'contain' : 'cover'
        }
      }}
    >
      {children}
    </Grid>
  );
}
