import DotMenu from '@/components/DotMenu';
import HeaderContainer from '@/components/HeaderContainer';
import { useTheme } from '@emotion/react';

export default function DetailToolbar({ rightContent, toolbarItems = [], toolbarMenuItems = [] }) {
  const theme = useTheme();

  return (
    <HeaderContainer>
      {rightContent}
      {toolbarMenuItems.length > 0 && (
        <DotMenu
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          slotProps={{
            ListItemText: {
              sx: { color: theme.palette.text.secondary },
              primaryTypographyProps: { variant: 'bodyMedium' },
            },
            ListItemIcon: {
              sx: {
                minWidth: '16px !important',
                marginRight: '12px',
              },
            },
          }}
        >
          {toolbarMenuItems}
        </DotMenu>
      )}
      {toolbarItems}
    </HeaderContainer>
  );
}
