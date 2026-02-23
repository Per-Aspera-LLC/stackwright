import { Box, IconButton, Menu } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { MenuContent } from '@stackwright/types';

interface CompressedMenuProps {
  menuItems: MenuContent[];
  menuOpen: boolean;
  anchorEl: HTMLElement | null;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  onMenuClose: () => void;
  buildMenu: (items: MenuContent[], compressed: boolean) => React.ReactNode;
}

export const CompressedMenu = ({
  menuItems,
  menuOpen,
  anchorEl,
  onMenuOpen,
  onMenuClose,
  buildMenu
}: CompressedMenuProps) => (
  <Box>
    <IconButton
      sx={{ 
        color: 'primary.main',
        '&:hover': {
          backgroundColor: 'transparent',
          color: 'primary.dark',
        }
      }}
      onClick={onMenuOpen}
    >
      <MenuIcon />
    </IconButton>
    <Menu
      open={menuOpen}
      anchorEl={anchorEl}
      onClose={onMenuClose}
      sx={{
        '& .MuiPaper-root': {
          width: 'auto',
          maxWidth: '200px',
          backgroundColor: 'white',
        }
      }}
    >
      <Box p={1} width="100%">
        {buildMenu(menuItems, true)}
      </Box>
    </Menu>
  </Box>
);
