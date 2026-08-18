import { memo, useCallback } from 'react';

import { Box, Checkbox, CircularProgress, FormControlLabel, List, ListItem, Typography } from '@mui/material';

import ListInfiniteMoreLoader from '@/ComponentsLib/ListInfiniteMoreLoader';

const MessageGroupChecklist = memo(props => {
  const {
    groups = [],
    selectedGroupIds = [],
    onToggle,
    isLoading = false,
    loadedCount,
    totalCount,
    onLoadMore,
    resetPageDependencies,
  } = props;

  const handleToggle = useCallback(
    id => {
      onToggle?.(id);
    },
    [onToggle],
  );

  const styles = messageGroupChecklistStyles();

  return (
    <Box sx={styles.container}>
      {isLoading && groups.length === 0 ? (
        <Typography
          variant="bodySmall2"
          color="text.disabled"
          sx={styles.checklistFeedback}
        >
          Loading messages…
        </Typography>
      ) : groups.length === 0 ? (
        <Typography
          variant="bodySmall2"
          color="text.disabled"
          sx={styles.checklistFeedback}
        >
          No messages found.
        </Typography>
      ) : (
        <List
          dense
          disablePadding
        >
          {groups.map(group => (
            <ListItem
              key={group.id}
              disablePadding
              sx={styles.checklistItem}
            >
              <FormControlLabel
                sx={styles.checklistLabel}
                control={
                  <Checkbox
                    size="small"
                    checked={selectedGroupIds.includes(group.id)}
                    onChange={() => handleToggle(group.id)}
                    sx={styles.checkbox}
                  />
                }
                label={
                  <Box sx={styles.checklistLabelContent}>
                    <Typography
                      variant="bodySmall"
                      color="text.secondary"
                      sx={styles.checklistAuthor}
                    >
                      {group.authorName}
                    </Typography>
                    {group.preview && (
                      <Typography
                        variant="bodySmall2"
                        color="text.disabled"
                        noWrap
                        sx={styles.checklistPreview}
                      >
                        {group.preview}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
          {isLoading && (
            <ListItem
              disablePadding
              sx={styles.loadMoreSpinnerItem}
            >
              <CircularProgress
                size={14}
                thickness={4}
              />
            </ListItem>
          )}
        </List>
      )}
      <ListInfiniteMoreLoader
        listCurrentSize={loadedCount}
        totalAvailableCount={totalCount}
        onLoadMore={onLoadMore}
        isLoading={isLoading}
        resetPageDependencies={resetPageDependencies}
      />
      {selectedGroupIds.length === 0 && !isLoading && groups.length > 0 && (
        <Typography
          variant="bodySmall2"
          color="error.main"
          sx={styles.partialError}
        >
          Select at least one message to share.
        </Typography>
      )}
    </Box>
  );
});

MessageGroupChecklist.displayName = 'MessageGroupChecklist';

/** @type {MuiSx} */
const messageGroupChecklistStyles = () => ({
  container: ({ palette }) => ({
    maxHeight: '12rem',
    overflowY: 'auto',
    border: `.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
    padding: '0.25rem 0',
    background: palette.background.tabPanel,
  }),
  checklistFeedback: {
    padding: '0.75rem 1rem',
  },
  checklistItem: {
    padding: '0 0.5rem',
  },
  checklistLabel: {
    width: '100%',
    margin: 0,
    gap: '0.25rem',
    alignItems: 'flex-start',
    padding: '0.25rem 0',
  },
  checkbox: {
    padding: '0.125rem',
    marginTop: '0.125rem',
  },
  checklistLabelContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    overflow: 'hidden',
  },
  checklistAuthor: {
    fontWeight: 600,
  },
  checklistPreview: {
    maxWidth: '28rem',
  },
  loadMoreSpinnerItem: {
    justifyContent: 'center',
    padding: '0.5rem 0',
  },
  partialError: {
    padding: '0.25rem 1rem 0.5rem',
  },
});

export default MessageGroupChecklist;
