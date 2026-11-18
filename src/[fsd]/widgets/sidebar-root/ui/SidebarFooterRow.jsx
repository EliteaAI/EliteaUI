import { memo, useCallback } from 'react';

import { useSelector } from 'react-redux';

import { Box, Divider, GlobalStyles } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { SIDEBAR_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours';
import { useSidebarNavigation } from '@/[fsd]/widgets/sidebar-root/lib/hooks';
import ResourcesButton from '@/[fsd]/widgets/sidebar-root/ui/button/ResourcesButton';
import SettingsButton from '@/[fsd]/widgets/sidebar-root/ui/button/SettingsButton';
import { COLLAPSED_SIDE_BAR_WIDTH, SIDE_BAR_WIDTH } from '@/common/constants';

const SUPPORT_ASSISTANT_LABEL = 'Support Assistant';
// px: the bottom row's cells are square, the assistant package draws a 1.75rem button
const FOOTER_CELL_SIZE = 52;
const ASSISTANT_BUTTON_SIZE = 28;

const SidebarFooterRow = memo(props => {
  const { onToggleAssistant } = props;
  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);
  const { navigateToPage } = useSidebarNavigation();

  const styles = sidebarFooterRowStyles(sideBarCollapsed);

  const onAssistantKeyDown = useCallback(
    event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      onToggleAssistant();
    },
    [onToggleAssistant],
  );

  const assistantCell = onToggleAssistant ? (
    <>
      <GlobalStyles styles={styles.assistantPosition} />
      <StyledTooltip
        placement={sideBarCollapsed ? 'right' : 'top'}
        title={SUPPORT_ASSISTANT_LABEL}
        enterDelay={500}
        enterNextDelay={500}
      >
        <Box
          role="button"
          tabIndex={0}
          aria-label={SUPPORT_ASSISTANT_LABEL}
          data-tour={SIDEBAR_TOUR_TARGET_IDS.supportAssistant}
          data-testid="sidebar-support-assistant"
          onClick={onToggleAssistant}
          onKeyDown={onAssistantKeyDown}
          sx={styles.assistantCell}
        />
      </StyledTooltip>
    </>
  ) : null;

  if (sideBarCollapsed) {
    return (
      <>
        <Box sx={styles.railButtons}>
          <SettingsButton navigateToPage={navigateToPage} />
          <Divider sx={styles.railDivider} />
          <ResourcesButton />
        </Box>
        {assistantCell}
      </>
    );
  }

  return (
    <Box
      sx={styles.row}
      data-testid="sidebar-footer-row"
    >
      <Box sx={styles.settingsCell}>
        <SettingsButton
          navigateToPage={navigateToPage}
          sx={styles.settingsButton}
        />
      </Box>
      <ResourcesButton cell />
      {assistantCell}
    </Box>
  );
});

SidebarFooterRow.displayName = 'SidebarFooterRow';

/** @type {MuiSx} */
const sidebarFooterRowStyles = sideBarCollapsed => {
  const menuWidth = sideBarCollapsed ? COLLAPSED_SIDE_BAR_WIDTH : SIDE_BAR_WIDTH;
  // The bot's cell is the row's last one when open, the whole rail width when folded
  const cellCenter = sideBarCollapsed ? menuWidth / 2 : menuWidth - FOOTER_CELL_SIZE / 2;

  return {
    row: ({ palette }) => ({
      display: 'flex',
      alignItems: 'stretch',
      height: `${FOOTER_CELL_SIZE / 16}rem`,
      flexShrink: 0,
      boxSizing: 'border-box',
      borderTop: `0.0625rem solid ${palette.border.subtle}`,
    }),
    settingsCell: ({ palette }) => ({
      flex: 1,
      minWidth: 0,
      display: 'flex',
      borderRight: `0.0625rem solid ${palette.border.subtle}`,
    }),
    settingsButton: {
      height: '100%',
      borderRadius: 0,
      paddingInline: '1.5rem 1rem',
    },
    assistantCell: ({ palette }) => ({
      flexShrink: 0,
      boxSizing: 'border-box',
      cursor: 'pointer',
      ...(sideBarCollapsed
        ? {
            height: `${FOOTER_CELL_SIZE / 16}rem`,
            borderTop: `0.0625rem solid ${palette.border.subtle}`,
          }
        : {
            width: `${FOOTER_CELL_SIZE / 16}rem`,
            borderLeft: `0.0625rem solid ${palette.border.subtle}`,
          }),
      '&:hover': {
        backgroundColor: palette.components.sidebar.menuItem.hover,
      },
    }),
    // The assistant package only docks to a window corner; this centres its button in the bot's cell
    assistantPosition: {
      '.elitea-assistant-container.elitea-assistant-container--bottom-left': {
        left: `${(cellCenter - ASSISTANT_BUTTON_SIZE / 2) / 16}rem`,
      },
    },
    railButtons: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 1rem',
    },
    railDivider: ({ palette }) => ({
      borderColor: palette.border.subtle,
      alignSelf: 'stretch',
      marginInline: '-1rem',
    }),
  };
};

export default SidebarFooterRow;
