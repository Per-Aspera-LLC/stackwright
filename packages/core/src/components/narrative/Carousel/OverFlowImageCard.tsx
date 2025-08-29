import { Card, Stack, Box, Typography } from '@mui/material'
import { CarouselItem } from '@stackwright/types'
import { useSafeTheme } from '../../../hooks/useSafeTheme'
import { Media } from '../../media/Media'

interface OverflowImageCardProps {
  item: CarouselItem,
  minWidth: string,
  sx?: object
}

export const OverflowImageCard = ({ item, minWidth, sx }: OverflowImageCardProps) => {
  const theme = useSafeTheme();

  const backgroundColor = item.background || theme.colors.accent;

  return (
    <Card
      elevation={0}
      sx={{
        p: 0,
        position: 'relative',
        minWidth: minWidth,
        overflow: 'visible',
        top: '-45px',
        bgcolor: backgroundColor,
        objectFit: 'cover',
        height: 'calc(100%+60px)',
        ...sx,
      }}
    >
      <Stack justifyContent="center" width={'100%'} height={'100%'} top={0} left={0}
      >
        <Box width={'100%'} height={'100%'} sx={{backgroundColor: backgroundColor}}>
          <Media
            src={item.media.src}
            label={item.title}
            style={item.media.style ? item.media.style : 'contained'}
         />
          
        <Typography 
            variant='h4' 
            sx={{ m: 1, color: theme.colors.text, textAlign: 'center'}}
            >
            {item.title}
        </Typography>
  
        <Typography 
          variant='body1'
          sx={{ m: 2, color: theme.colors.text }}
        >
          {item.text}
        </Typography>
        
      </Box>
      </Stack>

    </Card>
  )
}