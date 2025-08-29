import { Box, Typography, Link, Stack } from '@mui/material';
import Grid from '@mui/material/Grid'
import { FooterConfig } from '../../../../types/src/types/siteConfig';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { getBetterTextColor, resolveColor } from '../../utils/colorUtils';
import { ThemedButton } from '../base/ThemedButton';
import { FlareSharp, GridOnTwoTone, SocialDistance } from '@mui/icons-material';
interface BottomAppBarProps {
  footer?: FooterConfig;
}

export default function BottomAppBar({ footer }: BottomAppBarProps) {
  const theme = useSafeTheme();
  const currentYear = new Date().getFullYear();

  const backgroundColor = footer?.backgroundColor ? resolveColor(footer?.backgroundColor, theme.colors) : theme.colors.primary;
  const textColor = footer?.textColor ? resolveColor(footer.textColor, theme.colors) : getBetterTextColor(theme.colors.text, theme.colors.textSecondary, backgroundColor)
  
 

  let numOfItems = 0;
  if(footer?.socialLinks)
    numOfItems += footer?.socialLinks.length + 1;
  if(footer?.links)
    numOfItems += footer?.links.length;

  const itemsPerColumn = footer?.itemsPerColumn || 3;

  let numOfColumns = 12;
  if (numOfItems > itemsPerColumn ) {
    numOfColumns = numOfItems / itemsPerColumn;
  }
  
  return (
    <Grid
      component="footer"
      direction='row'
      justifyContent='center'
      alignContent={footer?.socialLinks ? 'space-between' : 'center'}
      alignItems={footer?.socialLinks ? 'space-between' : 'center'}
      container
      spacing={2}
      sx={{
        backgroundColor: backgroundColor ,
        color: textColor,
        py: 1,
        px: 2,
        mt: 'auto',
        maxHeight: 'auto',
        display: 'flex',
        minHeight: 32
      }}
    >
      
        <Grid 
          direction='row' 
          container 
          alignItems='center' 
          spacing={1}
          sx={{
            px: 2.5
          }}
          >

          {footer?.links && footer.links.map((link, index) => (
            <Grid key={link.href}>
              <Link
                key={link.href}
                href={link.href}
                color="inherit"
                width='100%'
                sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                {link.label}
              </Link>
            </Grid>
          ))}
          
        {footer?.socialLinks && (
        <Grid direction={footer?.socialLinks.length > 3 ? 'column' : 'row'} container spacing={1} padding={0} >
          <Grid key={"Social Header"}>
              <Typography width='100%' variant='h6' sx={{ textEmphasis: 'bold', paddingLeft: 5}}>
                {footer?.socialText? footer.socialText : "Social Media"}
              </Typography>
          </Grid>
        {footer?.socialLinks && (
          footer.socialLinks.map((social, index) => (
            <Grid key={social.href} >
              <ThemedButton key={social.href || index} button={social} />
            </Grid>
          ))
        )}
          </Grid>
        )}
        
        </Grid>
        <Grid container width='100%' columns={12} alignContent={'center'} alignItems={'center'}>
          <Typography variant="body2" sx={{ textAlign: 'center' }} width='100%' >
            {`@ ${currentYear} ${footer?.copyright}` || `© ${currentYear} All rights reserved.`}
          </Typography>
        </Grid>
    </Grid>
  
  );
}
