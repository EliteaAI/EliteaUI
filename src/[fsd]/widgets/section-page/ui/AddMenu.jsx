import { memo, useCallback, useState } from 'react';

import { Box, Menu } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import PlusIcon from '@/assets/plus-icon.svg?react';
import ArrowDownIcon from '@/components/Icons/ArrowDownIcon';

import AddMenuItem from './AddMenuItem';

// «+ Add ⌄»: the section's create actions in one list
const AddMenu = memo(props => {
  const { items = [], label, testId } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const isOpen = Boolean(anchorEl);

  const handleOpen = useCallback(event => setAnchorEl(event.currentTarget), []);
  const handleClose = useCallback(() => setAnchorEl(null), []);

  const styles = addMenuStyles(isOpen);

  if (!items.length) return null;

  return (
    <>
      <StyledTooltip
        title={label}
        placement="top"
      >
        <Box
          component="span"
          sx={styles.wrapper}
        >
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.special}
            startIcon={<PlusIcon />}
            endIcon={
              <ArrowDownIcon
                fill="currentColor"
                style={styles.arrow}
              />
            }
            aria-label={label}
            aria-haspopup="menu"
            aria-expanded={isOpen}
            onClick={handleOpen}
            data-testid={testId}
            sx={styles.button}
          >
            Add
          </Button.BaseBtn>
        </Box>
      </StyledTooltip>
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

/** @type {MuiSx} */
const addMenuStyles = isOpen => ({
  wrapper: {
    display: 'flex',
    flexShrink: 0,
  },
  // The natural width of «+ Add ⌄», as in the prototype
  button: {
    width: '6.6875rem',
    flexShrink: 0,
  },
  arrow: {
    transition: 'transform 0.2s',
    transform: isOpen ? 'rotate(180deg)' : 'none',
  },
});

export default AddMenu;
