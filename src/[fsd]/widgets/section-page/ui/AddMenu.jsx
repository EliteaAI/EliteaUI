import { memo, useCallback, useState } from 'react';

import { Menu } from '@mui/material';

import AddButton from './AddButton';
import AddMenuItem from './AddMenuItem';

// «+ Add ⌄»: the section's create actions in one list
const AddMenu = memo(props => {
  const { items = [], label, testId } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const isOpen = Boolean(anchorEl);

  const handleOpen = useCallback(event => setAnchorEl(event.currentTarget), []);
  const handleClose = useCallback(() => setAnchorEl(null), []);

  if (!items.length) return null;

  return (
    <>
      <AddButton
        label={label}
        onClick={handleOpen}
        testId={testId}
        hasMenu
        isOpen={isOpen}
      />
      <Menu
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {items.map(item => (
          <AddMenuItem
            key={item.key}
            icon={item.icon}
            label={item.label}
            testId={item.testId}
            onSelect={item.onSelect}
            onClose={handleClose}
          />
        ))}
      </Menu>
    </>
  );
});

AddMenu.displayName = 'AddMenu';

export default AddMenu;
