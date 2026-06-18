import { memo, useMemo } from 'react';

import { Box, IconButton, Typography } from '@mui/material';

import { CHAT_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants';
import { ContextBudgetUI } from '@/[fsd]/widgets/context-budget';
import DoubleLeftIcon from '@/components/Icons/DoubleLeftIcon';
import DoubleRightIcon from '@/components/Icons/DoubleRightIcon';
import useGetComponentWidth from '@/hooks/useGetComponentWidth';
import useIsSmallWindow from '@/hooks/useIsSmallWindow';
import { useTheme } from '@emotion/react';

import CollapsedPerticapantsList from './CollapsedParticipants/CollapsedPerticapantsList';
import ExpandedPerticapantsList from './ExpandedParticipants/ExpandedParticipantsList';

const Participants = memo(props => {
  const {
    disabledEdit,
    participants,
    collapsed,
    onCollapsed,
    activeParticipantId,
    onSelectParticipant,
    onDeleteParticipant,
    onUpdateParticipant,
    onEditParticipant,
    disabledAdd,
    editingToolkit,
    conversationId,
    contextStrategy,
    setActiveConversation,
    conversationInstructions,
    persona,
    selectedManager,
    newConversationSelectedManager,
  } = props;
  const theme = useTheme();

  const { isSmallWindow } = useIsSmallWindow();
  const { componentRef, componentWidth } = useGetComponentWidth();

  const { showTitle, showCollapsedParticipants, ExpandCollapseButton } = useMemo(
    () => ({
      showTitle: !collapsed || isSmallWindow,
      showCollapsedParticipants: collapsed && !isSmallWindow,
      ExpandCollapseButton: !isSmallWindow ? (collapsed ? DoubleLeftIcon : DoubleRightIcon) : null,
    }),
    [collapsed, isSmallWindow],
  );

  return (
    <Box
      ref={componentRef}
      sx={styles.mainContainer(collapsed)}
    >
      <Box
        sx={styles.contentContainer(collapsed, isSmallWindow)}
        data-tour={CHAT_TOUR_TARGET_IDS.participants}
      >
        <Box sx={styles.headerContainer(collapsed, isSmallWindow)}>
          {showTitle && (
            <Box sx={styles.titleContainer}>
              <Typography variant="subtitle">Participants</Typography>
            </Box>
          )}
          {Boolean(ExpandCollapseButton) && (
            <IconButton
              sx={styles.collapseButton}
              variant="elitea"
              color="tertiary"
              onClick={onCollapsed}
            >
              <ExpandCollapseButton
                fill={theme.palette.icon.fill.default}
                width={16}
              />
            </IconButton>
          )}
        </Box>

        <Box sx={styles.participantsContainer(collapsed, isSmallWindow)}>
          {showCollapsedParticipants ? (
            <CollapsedPerticapantsList
              participants={participants}
              onSelectParticipant={onSelectParticipant}
              onDeleteParticipant={onDeleteParticipant}
              disabledAdd={disabledAdd}
              disabledEdit={disabledEdit}
              activeParticipantId={activeParticipantId}
              onUpdateParticipant={onUpdateParticipant}
              onEditParticipant={onEditParticipant}
              editingToolkit={editingToolkit}
            />
          ) : (
            <ExpandedPerticapantsList
              participants={participants}
              componentWidth={componentWidth}
              onSelectParticipant={onSelectParticipant}
              onDeleteParticipant={onDeleteParticipant}
              onEditParticipant={onEditParticipant}
              disabledAdd={disabledAdd}
              disabledEdit={disabledEdit}
              activeParticipantId={activeParticipantId}
              editingToolkit={editingToolkit}
              selectedManager={selectedManager}
              newConversationSelectedManager={newConversationSelectedManager}
            />
          )}
        </Box>
      </Box>

      {conversationId && (
        <Box
          data-tour={CHAT_TOUR_TARGET_IDS.contextBudget}
          sx={styles.contextBudgetWrapper}
        >
          <ContextBudgetUI.ContextBudgetInfo
            conversationId={conversationId}
            collapsed={collapsed && !isSmallWindow}
            contextStrategy={contextStrategy}
            setActiveConversation={setActiveConversation}
            conversationInstructions={conversationInstructions}
            persona={persona}
          />
        </Box>
      )}
    </Box>
  );
});

Participants.displayName = 'Participants';

/**
 * @type MuiSx
 */
const styles = {
  mainContainer: collapsed => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: collapsed ? 'flex-end' : 'flex-start',
    width: '100%',
    height: '100%',
    gap: '.75rem',
  }),
  contentContainer: (collapsed, isSmallWindow) => ({
    height: '100%',
    position: 'relative',
    width: collapsed && !isSmallWindow ? '3.25rem' : '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: collapsed && !isSmallWindow ? 'center' : 'flex-start',
    overflowY: 'scroll',
  }),
  headerContainer: (collapsed, isSmallWindow) => ({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: collapsed && !isSmallWindow ? 'center' : 'space-between',
    height: '2rem',
    alignItems: 'center',
    width: '100%',
  }),
  titleContainer: {
    display: 'flex',
    flexDirection: 'row',
    height: '100%',
    alignItems: 'center',
    gap: '1rem',
  },
  collapseButton: {
    marginLeft: '0rem',
  },
  participantsContainer: (collapsed, isSmallWindow) => ({
    marginTop: '.5rem',
    gap: '.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: !collapsed || isSmallWindow ? 'flex-start' : 'center',
    overflowY: 'scroll',
    msOverflowStyle: 'none',
    scrollbarWidth: 'none',
    '::-webkit-scrollbar': {
      display: 'none',
    },
    maxHeight: `calc(100% - 2.5rem)`,
    paddingBottom: !collapsed || isSmallWindow ? '2rem' : '1.25rem',
    paddingTop: !collapsed || isSmallWindow ? '0rem' : '.5rem',
    width: '100%',
  }),
  contextBudgetWrapper: { width: '100%' },
};

export default Participants;
