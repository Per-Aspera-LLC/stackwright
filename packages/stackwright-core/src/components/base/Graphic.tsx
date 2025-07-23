import Grid from '@mui/material/Grid2';
import { GraphicContent } from '../../types/content';
import { getStackwrightImage } from '../../utils/stackwrightComponentRegistry';

export function Graphic(content: GraphicContent) {
  const StackwrightImage = getStackwrightImage();

  var style = {}
  switch (content.variant){
    case undefined:
    case 'contained':
      style = {
        width: '100%',
        height: '100%',
        objectFit: 'contain'
      }
      break;
    case 'overflow':
      style = {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      }
      break;
    
  }

  return (

      <Grid container
      sx={{
      justifyContent: 'center',
      position: 'relative',
      aspectRatio: content.aspect_ratio || '1/1',
      height: 'auto',
      maxWidth: content?.max_size,
      mx: 'auto'
      }}
      >
        <StackwrightImage
            src={content.image}
            alt={content.label}
            fill={true}
            sizes="(max-width: 768px) 100vw, 50vw"
            style={style}
            placeholder='blur'
            blurDataURL='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
            priority
            />
     </Grid>
  );
}