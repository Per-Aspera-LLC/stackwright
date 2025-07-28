import { Box, Typography, Link, Stack } from '@mui/material';
import Grid from '@mui/material/Grid'
import { FooterConfig } from '../../../../types/src/types/siteConfig';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { ThemedButton } from '../base/ThemedButton';
interface BottomAppBarProps {
  footer?: FooterConfig;
}

export default function BottomAppBar({ footer }: BottomAppBarProps) {
  const theme = useSafeTheme();
  const currentYear = new Date().getFullYear();
  let columns = 0;
  if(footer?.socialLinks)
    columns++;
  if(footer?.links)
    columns++;
  
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: theme.colors.surface,
        color: theme.colors.text,
        py: 4,
        px: 2,
        mt: 'auto',
        maxHeight: 54,
        minHeight: 32
      }}
    >
      <Grid columns={columns} >

     
          <Grid alignItems="center" columns={4}>
            {footer?.links && (
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
                {footer.links.map((link, index) => (
                  <Link
                    key={index}
                    href={link.href}
                    color="inherit"
                    sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                  >
                    {link.label}
                  </Link>
                ))}
              </Box>
            )}
          </Grid>
        
          {footer?.socialLinks && (
            <Stack direction='column' spacing={1} alignItems="center">
              <Typography>
                {footer?.socialText? footer.socialText : "Social Media"}
              </Typography>
              <Grid columns={2}>
                {footer.socialLinks.map((social, index) => (
                  <ThemedButton button={social}/>
                ))}
              </Grid>
            </Stack>
          )}
      </Grid>
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Typography variant="body2" sx={{ color: theme.colors.text, textAlign: 'center' }}>
          {footer?.copyright || `© ${currentYear} All rights reserved.`}
        </Typography>
      </Box>

    </Box>
  );
}