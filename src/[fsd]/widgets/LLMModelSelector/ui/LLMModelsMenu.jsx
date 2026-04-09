import { memo } from 'react';

import { Box, ListItemIcon, Typography } from '@mui/material';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import ShareIcon from '@/assets/share-icon.svg?react';
import BriefcaseIcon from '@/components/Icons/BriefcaseIcon.jsx';

import CapabilityChip from './CapabilityChip';

const LLMModelsMenu = memo(props => {
  const { anchorEl, onClose, models = [], selectedModel, onSelectModel } = props;

  const open = Boolean(anchorEl);

  const handleMenuItemClick = (event, index) => {
    onSelectModel(models[index]);
    onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      slotProps={{
        list: {
          'aria-labelledby': 'model-selector-button',
        },
        paper: {
          sx: styles.menuPaper,
        },
      }}
    >
      {models.map((item, index) => (
        <MenuItem
          key={index}
          selected={item.id === selectedModel?.id}
          onClick={event => handleMenuItemClick(event, index)}
          sx={styles.menuItem}
        >
          <ListItemIcon sx={styles.listItemIcon}>
            {item.shared ? <ShareIcon fontSize="inherit" /> : <BriefcaseIcon fontSize="inherit" />}
          </ListItemIcon>
          <Box sx={styles.itemContent}>
            <Typography
              variant="bodyMedium"
              sx={styles.itemName}
            >
              {item.display_name || item.name}
            </Typography>
            {(item.supports_vision || item.supports_reasoning) && (
              <Box sx={styles.chips}>
                {item.supports_vision && (
                  <CapabilityChip
                    type="vision"
                    showTooltip
                  />
                )}
                {item.supports_reasoning && (
                  <CapabilityChip
                    type="reasoning"
                    showTooltip
                  />
                )}
              </Box>
            )}
          </Box>
        </MenuItem>
      ))}
    </Menu>
  );
});

LLMModelsMenu.displayName = 'LLMModelsMenu';

/** @type {MuiSx} */
const styles = {
  menuPaper: {
    marginTop: '-0.25rem',
  },
  itemContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    minWidth: 0,
  },
  itemName: ({ palette }) => ({
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: palette.text.secondary,
  }),
  chips: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    flexShrink: 0,
  },
  menuItem: {
    '& .MuiListItemIcon-root': {
      minWidth: 0,
      marginRight: '0.6rem',
    },
  },
  listItemIcon: ({ palette }) => ({
    color: palette.icon.fill.default,
  }),
};

export default LLMModelsMenu;
