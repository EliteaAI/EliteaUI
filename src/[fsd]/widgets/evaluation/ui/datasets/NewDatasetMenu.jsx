import { memo, useCallback, useState } from 'react';

import { ListItemText, Menu, MenuItem } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import { NEW_DATASET_MENU } from '../../lib/constants';

const MENU_ITEMS = [
  { key: NEW_DATASET_MENU.blank, label: 'Blank dataset' },
  { key: NEW_DATASET_MENU.import, label: 'Import from file…' },
  { key: NEW_DATASET_MENU.fromConversations, label: 'From conversations…' },
];

const NewDatasetMenu = memo(props => {
  const { disabled = false, onSelect } = props;

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

  return (
    <>
      <Button.BaseBtn
        variant={BUTTON_VARIANTS.elitea}
        color={BUTTON_COLORS.primary}
        disabled={disabled}
        onClick={handleOpen}
        data-testid="evaluation-new-dataset"
      >
        + New dataset
      </Button.BaseBtn>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        data-testid="evaluation-new-dataset-menu"
      >
        {MENU_ITEMS.map(item => (
          <MenuItem
            key={item.key}
            onClick={() => handleSelect(item.key)}
            data-testid={`evaluation-new-dataset-${item.key}`}
          >
            <ListItemText primary={item.label} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
});

NewDatasetMenu.displayName = 'NewDatasetMenu';

export default NewDatasetMenu;
