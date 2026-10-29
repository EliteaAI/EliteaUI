import { memo, useCallback } from 'react';

import { ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import CheckedIcon from '@/assets/checked-icon.svg?react';

const { ORIENTATION } = FlowEditorConstants;

const ARRANGE_OPTIONS = [
  { orientation: ORIENTATION.vertical, label: 'Arrange top to bottom', testId: 'pipeline-canvas-arrange-tb' },
  {
    orientation: ORIENTATION.horizontal,
    label: 'Arrange left to right',
    testId: 'pipeline-canvas-arrange-lr',
  },
];

const CanvasArrangeMenu = memo(props => {
  const { anchorEl, orientation, onArrange, onClose } = props;

  const handleSelect = useCallback(
    nextOrientation => {
      onClose();
      onArrange(nextOrientation);
    },
    [onArrange, onClose],
  );

  const styles = canvasArrangeMenuStyles();

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      slotProps={{ paper: { sx: styles.paper } }}
      data-testid="pipeline-canvas-arrange-menu"
    >
      {ARRANGE_OPTIONS.map(option => {
        const isCurrent = option.orientation === orientation;
        return (
          <MenuItem
            key={option.orientation}
            selected={isCurrent}
            onClick={() => handleSelect(option.orientation)}
            data-testid={option.testId}
            data-current={isCurrent || undefined}
          >
            <ListItemText primaryTypographyProps={{ variant: 'bodyMedium' }}>{option.label}</ListItemText>
            <ListItemIcon sx={styles.checkSlot}>
              {isCurrent && <CheckedIcon style={styles.checkIcon} />}
            </ListItemIcon>
          </MenuItem>
        );
      })}
    </Menu>
  );
});

CanvasArrangeMenu.displayName = 'CanvasArrangeMenu';

/** @type {MuiSx} */
const canvasArrangeMenuStyles = () => ({
  paper: {
    marginLeft: '0.5rem',
  },
  checkSlot: ({ palette }) => ({
    justifyContent: 'flex-end',
    minWidth: '1.5rem !important',
    marginLeft: '1rem',
    color: palette.icon.secondary,
  }),
  checkIcon: {
    width: '0.75rem',
    height: '0.75rem',
  },
});

export default CanvasArrangeMenu;
