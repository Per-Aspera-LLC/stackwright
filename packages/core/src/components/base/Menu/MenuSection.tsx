import { MenuContent } from '@stackwright/types';
import { MenuItem, Typography } from '@mui/material';
import { MenuThemeConfig } from './menuTheme';
interface MenuItemProps {
  item: MenuContent;
  isCompressed: boolean;
  getTextColor: (bg: string, variant?: string, emphasized?: boolean) => string;
  theme: MenuThemeConfig;
}

export const MenuItemComponent = ({ item, isCompressed, theme }: MenuItemProps) => {
  const effectiveVariant = isCompressed ? 'text' : item.variant;
  const isEmphasizedVariant = item.variant === 'contained' || item.variant === 'outlined';
  const colorSet = theme.colors[effectiveVariant as keyof typeof theme.colors] || theme.colors.default;

  return (
    <MenuItem 
      component="a" 
      href={item.href || '#'}
      sx={{
        backgroundColor: colorSet.background,
        color: colorSet.text,
        border: effectiveVariant === 'outlined' ? 1 : 0,
        borderColor: colorSet.border,
        borderRadius: isEmphasizedVariant && !isCompressed ? '24px' : 0,
        '&:hover': {
          backgroundColor: colorSet.hover
        }
      }}
    >
      <Typography 
        variant="body1"
        sx={{
          color: isCompressed && item.variant === 'contained' ? theme.colors.contained.background : colorSet.text
        }}
      >
        {item.text}
      </Typography>
    </MenuItem>
  );
};