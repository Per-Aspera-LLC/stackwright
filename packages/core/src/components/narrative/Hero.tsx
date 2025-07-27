import React from 'react';
import { useTheme } from '@stackwright/themes';
import Box from '@mui/material/Box';
import { DefaultStackwrightImage } from 'components/stackwright/DefaultStackwrightComponents';
import { Graphic } from 'components/base';
import { Typography } from '@mui/material';

interface HeroProps {
  title: string;
  subtitle?: string;
  buttons?: Array<{
    text: string;
    link: string;
    variant?: 'primary' | 'secondary';
  }>;
  backgroundImage?: string;
}

const Hero: React.FC<HeroProps> = ({ 
  title, 
  subtitle, 
  buttons = [],
  backgroundImage 
}) => {
  const { theme } = useTheme();

  return (
    <Box>
        if(backgroundImage){
            <Graphic
                image={backgroundImage || ""}
                label={title}
                variant='contained'
            />
        }
        <Typography>
            {title}
        </Typography>
    </Box>
  )
};

export default Hero;