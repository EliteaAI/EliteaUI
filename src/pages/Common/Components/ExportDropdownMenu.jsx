import * as React from 'react';

import { Typography } from '@mui/material';
import { styled } from '@mui/system';

import { useSystemSenderName } from '@/[fsd]/shared/lib/hooks/useEnvironmentSettingByKey.hooks';
import ExportIcon from '@/components/Icons/ExportIcon';
import useToast from '@/hooks/useToast';
import { useExport } from '@/pages/Common/Components/useExport';
import { Menu } from '@base-ui-components/react/menu';
import { Select as Dropdown } from '@base-ui-components/react/select';

const MenuSection = styled('div')(({ theme, withIcon = false }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: `.5rem ${withIcon ? '1' : '2.5'}rem`,

  '& svg': {
    marginRight: '8px',
  },

  '&:hover': {
    backgroundColor: withIcon ? '' : theme.palette.background.select.hover,
    cursor: 'pointer',
  },
}));

const DropdownMenuContainer = styled('div')(() => {
  return {
    position: 'relative',
  };
});

const StyledDropdown = styled(Menu)(() => {
  return {
    position: 'absolute',
    zIndex: '999',
    right: '-19px',
    width: '12.625rem',
  };
});

const Listbox = styled('ul')(
  ({ theme }) => `
    box-sizing: border-box;
    padding: 0;
    margin: 12px 0;
    min-width: 200px;
    border-radius: 0.5rem;
    overflow: auto;
    outline: 0px;
    background: ${theme.palette.background.secondary};
    border: 1px solid ${theme.palette.border.lines};
    color: ${theme.typography.headingMedium.color};
    box-shadow: 0px 4px 30px ${theme.palette.background.secondary};
    z-index: 1;
    `,
);

export default function ExportDropdownMenu({ children, id, owner_id, name, entity_name }) {
  const { toastError } = useToast();
  const systemSenderName = useSystemSenderName();
  const [openDropDown, setOpenDropDown] = React.useState(false);

  const handleDropdownSwitch = React.useCallback(event => {
    event.stopPropagation();
    setOpenDropDown(preStatus => {
      return !preStatus;
    });
  }, []);

  const closeDropdown = React.useCallback(() => {
    setOpenDropDown(false);
  }, []);

  const { doExport } = useExport({
    id,
    name,
    entity_name,
    owner_id,
    toastError,
  });

  React.useEffect(() => {
    window.addEventListener('click', closeDropdown);
    return () => {
      window.removeEventListener('click', closeDropdown);
    };
  });

  return (
    <>
      <Dropdown open={openDropDown}>
        <DropdownMenuContainer onClick={handleDropdownSwitch}>
          {children}
          <StyledDropdown slots={{ listbox: Listbox }}>
            <MenuSection withIcon>
              <ExportIcon style={{ width: '1rem', height: '1rem' }} />
              <Typography
                style={{ cursor: 'pointer' }}
                variant="headingMedium"
              >
                Export
              </Typography>
            </MenuSection>
            <MenuSection onClick={doExport({ isDial: false })}>[{systemSenderName} format]</MenuSection>
            <MenuSection onClick={doExport({ isDial: true })}>[DIAL format]</MenuSection>
          </StyledDropdown>
        </DropdownMenuContainer>
      </Dropdown>
    </>
  );
}

// Export styled components for backward compatibility
export { MenuSection, DropdownMenuContainer, StyledDropdown, Listbox };
