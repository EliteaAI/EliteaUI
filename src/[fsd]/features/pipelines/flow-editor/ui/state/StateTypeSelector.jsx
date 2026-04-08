import { memo, useState } from 'react';

import { Box, Menu, MenuItem, Typography } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorState } from '@/[fsd]/features/pipelines/flow-editor/ui';
import AbcIcon from '@/assets/abc-icon.svg?react';
import CheckedIcon from '@/assets/checked-icon.svg?react';
import HashIcon from '@/assets/hash-icon.svg?react';
import JsonIcon from '@/assets/json-icon.svg?react';
import ListViewIcon from '@/assets/list-view-icon.svg?react';

const iconMapping = {
  str: AbcIcon,
  number: HashIcon,
  dict: JsonIcon,
  list: ListViewIcon,
};

const stateTypeOptions = Object.keys(FlowEditorConstants.StateVariableTypes).reduce((acc, key) => {
  acc[FlowEditorConstants.StateVariableTypes[key]] = {
    label: key,
    icon: iconMapping[FlowEditorConstants.StateVariableTypes[key]],
  };
  return acc;
}, {});

const StateTypeSelector = memo(props => {
  const { type, onTypeChange, disabled = false } = props;

  const styles = stateTypeSelectorStyles();

  const [anchorEl, setAnchorEl] = useState(null);

  const open = Boolean(anchorEl);

  const handleClick = event => {
    if (!disabled) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectType = newType => {
    onTypeChange(newType);
    handleClose();
  };

  const IconComponent = stateTypeOptions[type]?.icon || stateTypeOptions.str.icon;

  return (
    <>
      <FlowEditorState.StateVariableIconButton
        tooltip="Select data type"
        onClick={handleClick}
        isActive={open}
        disabled={disabled}
        sx={styles.buttonIcon}
      >
        <IconComponent style={{ fontSize: '1.25rem' }} />
      </FlowEditorState.StateVariableIconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        slotProps={{
          paper: {
            sx: styles.menuPaper,
          },
        }}
      >
        {Object.entries(stateTypeOptions).map(([typeKey, typeConfig]) => {
          const MenuIconComponent = typeConfig.icon;
          const isSelected = type === typeKey;

          return (
            <MenuItem
              key={typeKey}
              selected={isSelected}
              onClick={() => handleSelectType(typeKey)}
              sx={styles.menuItem(isSelected)}
            >
              <Box sx={styles.menuItemContent}>
                <MenuIconComponent style={{ fontSize: '1.25rem' }} />
                <Typography
                  variant="bodyMedium"
                  color="text.secondary"
                >
                  {typeConfig.label}
                </Typography>
              </Box>
              {isSelected && <CheckedIcon style={{ fontSize: '0.75rem' }} />}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
});

StateTypeSelector.displayName = 'StateTypeSelector';

const stateTypeSelectorStyles = () => ({
  buttonIcon: {
    fontSize: '1.25rem',
  },
  menuPaper: {
    marginTop: ({ spacing }) => spacing(1),
    width: '8.4375rem',
  },
  menuItem:
    isSelected =>
    ({ spacing, palette }) => ({
      display: 'flex',
      alignItems: 'center',
      gap: spacing(1),
      padding: spacing(1, 1.5),
      justifyContent: 'space-between',
      ...(isSelected && {
        backgroundColor: palette.background.select.selected.default,
        '&.Mui-selected': {
          backgroundColor: palette.background.select.selected.default,
        },
        '&.Mui-selected:hover': {
          backgroundColor: palette.background.select.selected.hover,
        },
      }),
    }),
  menuItemContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
  },
});

export default StateTypeSelector;
