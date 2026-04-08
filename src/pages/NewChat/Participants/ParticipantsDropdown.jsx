import { useCallback, useMemo, useRef } from 'react';

import {
  Box,
  ClickAwayListener,
  Grow,
  MenuItem,
  Paper,
  Popper,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';

import { SPACING } from '@/common/designTokens';
import { getChatParticipantUniqueId } from '@/common/utils';
import PlusIcon from '@/components/Icons/PlusIcon';
import { DROPDOWN_CONSTANTS } from '@/components/UnifiedDropdown';
import ParticipantItem from '@/pages/NewChat/Participants/ParticipantItem';

/**
 * Check if an element is inside a MUI Dialog/Modal
 * @param {HTMLElement} element
 * @returns {boolean}
 */
const isInsideModal = element => {
  if (!element) return false;
  // Check if the element or any of its parents is a MUI Dialog backdrop or paper
  let current = element;
  while (current) {
    // Check for MUI Dialog classes
    if (
      current.classList?.contains('MuiDialog-root') ||
      current.classList?.contains('MuiModal-root') ||
      current.classList?.contains('MuiBackdrop-root') ||
      current.getAttribute?.('role') === 'dialog' ||
      current.getAttribute?.('role') === 'presentation'
    ) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
};

const ParticipantsDropdown = ({
  anchorEl,
  open,
  onClose,
  participants = [],
  onAddNew,
  showDivider = true,
  // When true, the dropdown opens to the left of the anchor (for collapsed rail)
  preferLeft = false,
  // New prop to control top alignment
  preferTopAlign = false,
  sx = {},
  disabledEdit,
  onSelectParticipant,
  activeParticipantId,
  onDeleteParticipant,
  onUpdateParticipant,
  entityType = 'item',
  AddIcon = PlusIcon,
  editingToolkit,
  onEditParticipant,
}) => {
  const theme = useTheme();
  const scrollRef = useRef(null);

  // Determine placement based on positioning preferences
  const popperPlacement = useMemo(() => {
    if (preferLeft && preferTopAlign) {
      return 'left-start'; // Left side, aligned with top of anchor
    } else if (preferLeft) {
      return 'left'; // Left side, centered vertically
    } else if (preferTopAlign) {
      return 'bottom-start'; // Below anchor, aligned with left edge
    } else {
      return 'bottom-start'; // Default bottom placement
    }
  }, [preferLeft, preferTopAlign]);

  // Adjust offset based on placement
  const offsetOptions = useMemo(() => {
    if (preferLeft && preferTopAlign) {
      return [0, 8]; // Add horizontal gap from the icon when placed on the left
    } else if (preferLeft) {
      return [0, 8]; // Add horizontal gap from the icon when placed on the left
    } else {
      return [0, 8]; // Default bottom offset
    }
  }, [preferLeft, preferTopAlign]);

  // Paper styles - dynamic height based on content
  const paperSx = useMemo(
    () => ({
      borderRadius: DROPDOWN_CONSTANTS.BORDER_RADIUS.MENU,
      // marginTop: (preferLeft && !preferTopAlign) ? 0 : DROPDOWN_CONSTANTS.SPACING.MENU_TOP_MARGIN,
      border: `1px solid ${theme.palette.border.lines}`,
      background: theme.palette.background.secondary,
      boxShadow: theme.palette.boxShadow.default,
      width: DROPDOWN_CONSTANTS.DIMENSIONS.MENU_WIDTH,
      maxHeight: DROPDOWN_CONSTANTS.DIMENSIONS.MENU_MAX_HEIGHT,
      // Merge additional styles
      ...sx,
    }),
    [theme, sx],
  );

  // Menu item styles for "Create new" item - exact Figma specs
  const createNewItemStyles = {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: `${SPACING.SM} ${SPACING.XL}`, // 8px 20px - Figma padding for "Create New" item
    height: DROPDOWN_CONSTANTS.DIMENSIONS.ITEM_HEIGHT,
    gap: DROPDOWN_CONSTANTS.SPACING.ITEM_ICON_TEXT_GAP,
    color: theme.palette.text.primary,
  };

  // Menu item styles for regular items
  const listItemStyles = {
    fontFamily: 'Montserrat',
    padding: `${SPACING.SM} ${SPACING.LG}`, // 8px 16px - Figma padding for regular items
    height: DROPDOWN_CONSTANTS.DIMENSIONS.ITEM_HEIGHT,
    gap: DROPDOWN_CONSTANTS.SPACING.ITEM_REGULAR_GAP,
    color: theme.palette.text.primary,
    '&:hover': {
      backgroundColor: theme.palette.background.select.hover,
    },
  };

  // Entity-specific empty-state copy
  const emptyText = useMemo(() => {
    const key = typeof entityType === 'string' ? entityType.toLowerCase() : '';
    if (key === 'toolkit' || key === 'toolkits') return 'Still no toolkits added';
    if (key === 'agent' || key === 'agents') return 'Still no agents added';
    if (key === 'pipeline' || key === 'pipelines') return 'Still no pipelines added';
    return 'No items added';
  }, [entityType]);

  const onEdit = useCallback(
    participant => {
      onClose?.();
      onEditParticipant?.(participant);
    },
    [onClose, onEditParticipant],
  );

  // Handle click away - ignore clicks on modals/dialogs
  const handleClickAway = useCallback(
    event => {
      // Don't close if clicking inside a modal
      if (isInsideModal(event.target)) {
        return;
      }
      onClose?.();
    },
    [onClose],
  );

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      role={undefined}
      placement={popperPlacement} // Dynamic placement based on preferences
      strategy="fixed"
      modifiers={[
        {
          name: 'offset',
          options: { offset: offsetOptions },
        },
        {
          name: 'flip',
          enabled: true, // Allow flipping if there's not enough space
          options: {
            // Define fallback placements based on preference
            fallbackPlacements: preferLeft
              ? ['right-start', 'bottom-start', 'top-start']
              : ['top-start', 'left-start', 'right-start'],
          },
        },
        {
          name: 'preventOverflow',
          options: {
            boundary: 'viewport',
            altBoundary: true,
            tether: true,
            padding: 8, // Add padding from viewport edges
          },
        },
      ]}
      transition
      sx={{
        zIndex: theme.zIndex.modal ? theme.zIndex.modal + 10 : 2200,
      }}
    >
      {({ TransitionProps, placement: placement }) => (
        <Grow
          {...TransitionProps}
          style={{
            transformOrigin: placement?.startsWith('left')
              ? 'right center' // Grow from right when positioned on left
              : placement?.startsWith('right')
                ? 'left center' // Grow from left when positioned on right
                : placement?.startsWith('top')
                  ? 'center bottom' // Grow from bottom when positioned on top
                  : 'center top', // Default for bottom placement
          }}
        >
          <Paper sx={paperSx}>
            <ClickAwayListener onClickAway={handleClickAway}>
              <Box
                ref={scrollRef}
                sx={{
                  height: 'auto',
                  maxHeight: '325px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Create New Item */}
                <Tooltip
                  title={`Add ${entityType}`}
                  placement="top"
                  disableHoverListener={open}
                  disableFocusListener={open}
                  disableTouchListener={open}
                >
                  <Box
                    onClick={onAddNew}
                    sx={createNewItemStyles}
                  >
                    <AddIcon
                      style={{ width: '16px', height: '16px' }}
                      fill={theme.palette.icon.fill.secondary}
                    />
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        gap: '4px',
                        width: '160px',
                      }}
                    >
                      <Typography
                        variant="bodyMedium"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {`Add ${entityType}`}
                      </Typography>
                    </Box>
                  </Box>
                </Tooltip>

                {/* Divider */}
                {showDivider && participants.length > 0 && (
                  <Box sx={{ padding: '0px 0px 4px', height: '5px' }}>
                    <Box
                      sx={{
                        width: '228px',
                        height: '1px',
                        backgroundColor: theme.palette.border.lines,
                      }}
                    />
                  </Box>
                )}

                {/* Items List */}
                {participants.length > 0 && (
                  <Box
                    display={'flex'}
                    flexDirection="column"
                    width={'100%'}
                    gap="8px"
                    padding="8px 16px"
                  >
                    {participants.map((participant, index) => (
                      <ParticipantItem
                        disabledEdit={disabledEdit}
                        onClickItem={onSelectParticipant}
                        key={participant.id || participant.name + index}
                        collapsed={false}
                        // Disable inner item tooltips while dropdown is open to avoid clutter
                        disableTooltip
                        participant={participant}
                        isActive={activeParticipantId === getChatParticipantUniqueId(participant)}
                        onDelete={onDeleteParticipant}
                        onUpdateParticipant={onUpdateParticipant}
                        editingToolkit={editingToolkit}
                        onEdit={onEdit}
                      />
                    ))}
                  </Box>
                )}
                {/* No Results Message */}
                {participants.length === 0 && (
                  <MenuItem
                    disabled
                    sx={listItemStyles}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        gap: '4px',
                        width: '168px',
                      }}
                    >
                      <Typography
                        variant="bodyMedium"
                        sx={{
                          fontFamily: 'Montserrat',
                          color: theme.palette.text.secondary,
                        }}
                      >
                        {emptyText}
                      </Typography>
                    </Box>
                  </MenuItem>
                )}
              </Box>
            </ClickAwayListener>
          </Paper>
        </Grow>
      )}
    </Popper>
  );
};

export default ParticipantsDropdown;
