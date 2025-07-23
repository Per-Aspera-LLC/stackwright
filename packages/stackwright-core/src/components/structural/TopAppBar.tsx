import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import { AppBarContent } from '../../types/content';
import { ThemedButton } from '../base/ThemedButton';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { getBetterTextColor, resolveColor } from '../../utils/colorUtils';

export default function TopAppBar({ title, logo, menuItems, textcolor, backgroundcolor }: AppBarContent) {
  const theme = useSafeTheme();
   ;
  const headerBgColor = backgroundcolor ? resolveColor(backgroundcolor, theme.colors) : theme.colors.primary;
   const headerTextColor = textcolor ? resolveColor(textcolor, theme.colors) : getBetterTextColor(theme.colors.text, theme.colors.textSecondary, headerBgColor)


  return (
    <AppBar position="sticky" sx={{ 
      backgroundColor: theme.colors.primary,
      color: headerTextColor,
      width: '100%'

    }}>
      <Toolbar >
        {logo ? (
          <><Box sx={{ mr: 2 }}>
            <img
              src={logo.image}
              alt={`${title} logo`}
              width={logo.width || 100}
              height={logo.height || 50}
              style={{ objectFit: 'contain' }} />
          </Box>
          <Typography  variant="h6" component="div" sx={{  mr: 4 }}>
              {title}
          </Typography></>
        ): (
          <Typography  variant="h6" component="div" sx={{  mr: 4 }}>
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
                label: item.label,
                buttonBackground: 'transparent',
                buttonColor: headerTextColor,
                size: 'button'
              }}
              size="medium"
            />
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
