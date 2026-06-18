import { memo, useCallback, useMemo, useRef } from 'react';

import { Box, ClickAwayListener, Grow, Paper, Popper, Typography } from '@mui/material';

import { getChatParticipantUniqueId } from '@/[fsd]/features/chat/participants/lib/helpers';
import { SPACING } from '@/common/designTokens';
import { DROPDOWN_CONSTANTS } from '@/components/UnifiedDropdown';

import ParticipantItem from '../ExpandedParticipants/ParticipantItem';

const CollapsedParticipantsDropdown = memo(props => {
  const {
    anchorEl,
    open,
    onClose,
    participants = [],
    showDivider = true,
    preferLeft = false,
    preferTopAlign = false,
    sx = {},
    disabledEdit,
    onSelectParticipant,
    activeParticipantId,
    onDeleteParticipant,
    onUpdateParticipant,
    entityType = 'item',
    editingToolkit,
    onEditParticipant,
  } = props;

  const scrollRef = useRef(null);
  const styles = collapsedParticipantsDropdownStyles();

  const popperPlacement = useMemo(() => {
    if (preferLeft && preferTopAlign) return 'left-start';
    else if (preferLeft) return 'left';
    else if (preferTopAlign) return 'bottom-start';
    else return 'bottom-start';
  }, [preferLeft, preferTopAlign]);

  const offsetOptions = useMemo(() => {
    if (preferLeft && preferTopAlign) return [0, 8];
    else if (preferLeft) return [0, 8];
    else return [0, 8];
  }, [preferLeft, preferTopAlign]);

  const modifiers = useMemo(
    () => [
      {
        name: 'offset',
        options: { offset: offsetOptions },
      },
      {
        name: 'flip',
        enabled: true,
        options: {
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
          padding: 8,
        },
      },
    ],
    [offsetOptions, preferLeft],
  );

  const onEdit = useCallback(
    participant => {
      onClose?.();
      onEditParticipant?.(participant);
    },
    [onClose, onEditParticipant],
  );

  const isInsideModal = useCallback(element => {
    if (!element) return false;

    let current = element;
    while (current) {
      if (
        current.classList?.contains('MuiDialog-root') ||
        current.classList?.contains('MuiModal-root') ||
        current.classList?.contains('MuiBackdrop-root') ||
        current.getAttribute?.('role') === 'dialog' ||
        current.getAttribute?.('role') === 'presentation'
      )
        return true;

      current = current.parentElement;
    }
    return false;
  }, []);

  const handleClickAway = useCallback(
    event => {
      if (isInsideModal(event.target)) return;

      onClose?.();
    },
    [isInsideModal, onClose],
  );

  return (
    <>
      <Popper
        open={open}
        anchorEl={anchorEl}
        role={undefined}
        placement={popperPlacement}
        strategy="fixed"
        modifiers={modifiers}
        transition
        sx={styles.popper}
      >
        {({ TransitionProps, placement: placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: placement?.startsWith('left')
                ? 'right center'
                : placement?.startsWith('right')
                  ? 'left center'
                  : placement?.startsWith('top')
                    ? 'center bottom'
                    : 'center top',
            }}
          >
            <Paper sx={[styles.paper, sx]}>
              <ClickAwayListener onClickAway={handleClickAway}>
                <Box
                  ref={scrollRef}
                  sx={styles.contentWrapper}
                >
                  <Box sx={styles.titleWrapper}>
                    <Box sx={styles.titleContent}>
                      <Typography sx={styles.title}>{entityType}</Typography>
                    </Box>
                  </Box>

                  {showDivider && participants.length > 0 && (
                    <Box sx={styles.dividerWrapper}>
                      <Box sx={styles.divider} />
                    </Box>
                  )}

                  {participants.length > 0 && (
                    <Box sx={styles.participantsList}>
                      {participants.map((participant, index) => (
                        <ParticipantItem
                          disableTooltip
                          key={participant.id || participant.name + index}
                          disabledEdit={disabledEdit}
                          onClickItem={onSelectParticipant}
                          collapsed={false}
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
                </Box>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
});

CollapsedParticipantsDropdown.displayName = 'CollapsedParticipantsDropdown';

/** @type {MuiSx} */
const collapsedParticipantsDropdownStyles = () => ({
  paper: ({ palette }) => ({
    borderRadius: DROPDOWN_CONSTANTS.BORDER_RADIUS.MENU,
    border: `.0625rem solid ${palette.border.lines}`,
    background: palette.background.secondary,
    boxShadow: '0rem .5rem .75rem 0rem rgba(0, 0, 0, 0.3)',
    width: '16.9375rem',
    maxHeight: DROPDOWN_CONSTANTS.DIMENSIONS.MENU_MAX_HEIGHT,
  }),
  contentWrapper: {
    height: 'auto',
    maxHeight: '20.3125rem',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  titleWrapper: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: `${SPACING.SM} ${SPACING.XL}`,
    height: DROPDOWN_CONSTANTS.DIMENSIONS.ITEM_HEIGHT,
    gap: DROPDOWN_CONSTANTS.SPACING.ITEM_ICON_TEXT_GAP,
    color: palette.border.lines,
    textTransform: 'uppercase',
  }),
  titleContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '.25rem',
    width: '10rem',
  },
  title: ({ palette }) => ({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontFamily: 'Montserrat',
    fontWeight: 500,
    fontStyle: 'Medium',
    fontSize: '.75rem',
    lineHeight: '1rem',
    letterSpacing: '6%',
    textTransform: 'uppercase',
    color: palette.border.hover,
  }),
  popper: ({ zIndex }) => ({
    zIndex: zIndex?.modal ? zIndex.modal + 10 : 2200,
  }),
  dividerWrapper: {
    padding: '0rem 0rem .25rem',
    height: '.3125rem',
  },
  divider: ({ palette }) => ({
    width: '16.9375rem',
    height: '.0625rem',
    backgroundColor: palette.border.lines,
  }),
  participantsList: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: '.5rem',
    padding: '.5rem 1rem',
  },
});

export default CollapsedParticipantsDropdown;
