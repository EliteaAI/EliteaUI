import { memo } from 'react';

import { Box } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import PlusIcon from '@/assets/plus-icon.svg?react';
import ArrowDownIcon from '@/components/Icons/ArrowDownIcon';

// «+ Add» of a section page; with a menu it shows the arrow («+ Add ⌄») and keeps the same width either way
const AddButton = memo(props => {
  const { label, onClick, testId, hasMenu = false, isOpen = false } = props;

  const styles = addButtonStyles(isOpen);

  return (
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
            hasMenu ? (
              <ArrowDownIcon
                fill="currentColor"
                style={styles.arrow}
              />
            ) : undefined
          }
          aria-label={label}
          aria-haspopup={hasMenu ? 'menu' : undefined}
          aria-expanded={hasMenu ? isOpen : undefined}
          onClick={onClick}
          data-testid={testId}
          sx={styles.button}
        >
          Add
        </Button.BaseBtn>
      </Box>
    </StyledTooltip>
  );
});

AddButton.displayName = 'AddButton';

/** @type {MuiSx} */
const addButtonStyles = isOpen => ({
  wrapper: {
    display: 'flex',
    flexShrink: 0,
  },
  // The natural width of «+ Add ⌄», as in the prototype, so the search never moves
  button: {
    width: '6.6875rem',
    flexShrink: 0,
  },
  arrow: {
    transition: 'transform 0.2s',
    transform: isOpen ? 'rotate(180deg)' : 'none',
  },
});

export default AddButton;
