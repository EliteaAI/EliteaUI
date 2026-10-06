import { forwardRef, memo, useCallback } from 'react';

import { Box, CircularProgress, Paper } from '@mui/material';

import { BaseTab, BaseTabs } from '@/[fsd]/shared/ui/tabs';

// Autocomplete paper slot with a participant-type tab bar pinned above the options list
const ChatParticipantPickerPaper = memo(
  forwardRef((props, ref) => {
    const { children, tabs = [], activeTab, onTabChange, isLoadingMore = false, sx, ...restProps } = props;

    const styles = chatParticipantPickerPaperStyles();

    // Keep focus in the search input so clicking a tab does not blur and close the dropdown
    const handleTabsMouseDown = useCallback(event => event.preventDefault(), []);

    return (
      <Paper
        ref={ref}
        {...restProps}
        sx={[styles.paper, ...(Array.isArray(sx) ? sx : [sx])]}
      >
        <Box
          sx={styles.tabsWrapper}
          onMouseDown={handleTabsMouseDown}
        >
          <BaseTabs
            value={activeTab}
            onChange={onTabChange}
            variant="scrollable"
            scrollButtons={false}
            sx={styles.tabs}
          >
            {tabs.map(tab => (
              <BaseTab
                key={tab.value}
                value={tab.value}
                label={tab.label}
                data-testid={`chat-participant-tab-${tab.value}`}
              />
            ))}
          </BaseTabs>
        </Box>
        {children}
        {isLoadingMore && (
          <Box
            sx={styles.loadingMore}
            data-testid="chat-participant-loading-more"
          >
            <CircularProgress size={20} />
          </Box>
        )}
      </Paper>
    );
  }),
);

ChatParticipantPickerPaper.displayName = 'ChatParticipantPickerPaper';

/** @type {MuiSx} */
const chatParticipantPickerPaperStyles = () => ({
  // Fixed height so the dropdown does not resize between loading, empty and populated states
  paper: ({ palette, typography }) => ({
    height: '20rem',
    display: 'flex',
    flexDirection: 'column',
    '& .MuiAutocomplete-listbox': {
      flex: 1,
      minHeight: 0,
      maxHeight: 'none',
      overflowY: 'auto',
    },
    // Loading / empty states read like a muted option row
    '& .MuiAutocomplete-loading, & .MuiAutocomplete-noOptions': {
      ...typography.bodyMedium,
      flex: 1,
      padding: '0.5rem 1rem',
      color: palette.text.primary,
    },
    marginBottom: '0.5rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: palette.background.default.secondary,
    boxShadow: palette.boxShadow.default,
  }),
  tabsWrapper: ({ palette }) => ({
    flexShrink: 0,
    padding: '0.5rem 1rem 0',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  loadingMore: {
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'center',
    padding: '0.5rem 0',
  },
  tabs: {
    minHeight: 'unset',
    '& .MuiTabs-indicator': {
      height: '0.125rem',
    },
  },
});

export default ChatParticipantPickerPaper;
