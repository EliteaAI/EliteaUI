import { memo, useCallback, useState } from 'react';

import { Divider, ListItemText, Menu, MenuItem } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import { ADD_VALIDATION_MENU } from '../lib/constants';

const MENU_ITEMS = [
  { key: ADD_VALIDATION_MENU.dimensionLibrary, label: 'Dimension (from library)' },
  { key: ADD_VALIDATION_MENU.codeValidationLibrary, label: 'Code validation (from library)' },
  { key: ADD_VALIDATION_MENU.platformCatalog, label: 'Platform validation (catalog)' },
  { divider: true },
  { key: ADD_VALIDATION_MENU.newDimension, label: 'New dimension…' },
  { key: ADD_VALIDATION_MENU.newCodeValidation, label: 'New code validation…' },
];

const AddValidationMenu = memo(props => {
  const { disabled = false, canCreateDimension = false, canCreateCodeValidation = false, onSelect } = props;

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = useCallback(event => setAnchorEl(event.currentTarget), []);
  const handleClose = useCallback(() => setAnchorEl(null), []);

  const handleSelect = useCallback(
    key => {
      setAnchorEl(null);
      onSelect?.(key);
    },
    [onSelect],
  );

  const isItemDisabled = useCallback(
    key => {
      if (key === ADD_VALIDATION_MENU.newDimension) return !canCreateDimension;
      if (key === ADD_VALIDATION_MENU.newCodeValidation) return !canCreateCodeValidation;
      return false;
    },
    [canCreateDimension, canCreateCodeValidation],
  );

  return (
    <>
      <Button.BaseBtn
        variant={BUTTON_VARIANTS.elitea}
        color={BUTTON_COLORS.secondary}
        disabled={disabled}
        onClick={handleOpen}
        data-testid="evaluation-add-validation"
      >
        + Add
      </Button.BaseBtn>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        data-testid="evaluation-add-validation-menu"
      >
        {MENU_ITEMS.map((item, index) =>
          item.divider ? (
            <Divider key={`divider-${index}`} />
          ) : (
            <MenuItem
              key={item.key}
              disabled={isItemDisabled(item.key)}
              onClick={() => handleSelect(item.key)}
              data-testid={`evaluation-add-${item.key}`}
            >
              <ListItemText primary={item.label} />
            </MenuItem>
          ),
        )}
      </Menu>
    </>
  );
});

AddValidationMenu.displayName = 'AddValidationMenu';

export default AddValidationMenu;
