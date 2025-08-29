import { AppBar, Toolbar, Typography, Box, imageListClasses } from '@mui/material';
import { AppBarContent } from '@stackwright/types';
import { ThemedButton } from '../base/ThemedButton';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { getBetterTextColor, resolveColor } from '../../utils/colorUtils';
import { Media } from '../media/Media'

export default function TopAppBar({ title, logo, menuItems, textcolor, backgroundcolor }: AppBarContent) {
  const theme = useSafeTheme();
  
  const headerBgColor = backgroundcolor ? resolveColor(backgroundcolor, theme.colors) : theme.colors.primary;
  const headerTextColor = textcolor ? resolveColor(textcolor, theme.colors) : getBetterTextColor(theme.colors.text, theme.colors.textSecondary, headerBgColor)
    

  return (
    <AppBar position="sticky" sx={{ 
      backgroundColor: headerBgColor,
      color: headerTextColor,
      width: '100%',
      height: '100%'
    }}>
      <Toolbar sx={{ height: '100%', width: '100%', display: 'flex'}}>
        {logo ? (
          <>
            <Box 
              sx={{
                paddingRight: 1.5,
                height: 'auto'
              }}
              >
              <Media
                src={logo.src}
                style='contained'
                color={logo.color}
                height={logo?.height || '48px'}
                width={logo?.width || '48px'}
                label={`${title} logo`}
                
                />
              </Box>
            <Typography  variant="h4" component="div" sx={{  mr: 4 }}>
              {title}
            </Typography>
          </>
        ): (
          <Typography  variant="h4" component="div" sx={{  mr: 4 }}>
            {title}
          </Typography>
        )}
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {menuItems?.map((item, index) => (
            <ThemedButton
              key={index}
              button={{
                text: item.label,
                href: item.href,
                variant: 'text',
                bgColor: headerBgColor,
                textColor: headerTextColor,
                textSize: 'h6'
              }}
              size="medium"
            />
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
