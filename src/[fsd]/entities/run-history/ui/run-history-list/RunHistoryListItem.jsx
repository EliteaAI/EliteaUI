import { memo, useCallback, useMemo } from 'react';

import { Box, Skeleton } from '@mui/material';

import { formatRunTimestamp, resolveRunHistoryColumns } from '@/[fsd]/entities/run-history/lib/helpers';
import { RunHistoryTooltipCell } from '@/[fsd]/entities/run-history/ui';
import { SharedHelpers } from '@/[fsd]/shared/lib/helpers';

import RunHistoryRowActions from './RunHistoryRowActions';

const NO_EXTRA_COLUMNS = [];

const RunHistoryListItem = memo(props => {
  const {
    item,
    versions = [],
    onItemSelect,
    selectedItem,
    useMock,
    tooltipTrigger,
    handleRestoreConversation,
    handleOpenAnalytics,
    source,
    hasEvent = false,
    shareOpensHistoryTab = false,
    extraColumns = NO_EXTRA_COLUMNS,
  } = props;

  const noVersions = useMemo(() => versions === null, [versions]);

  const styles = runHistoryListItemStyles(resolveRunHistoryColumns(noVersions, hasEvent, extraColumns));

  const getCurrentVersion = useCallback(
    id => {
      if (noVersions) return '-';

      return versions.find(v => v.id === id)?.name ?? '-';
    },
    [versions, noVersions],
  );

  const { date, version, duration } = useMemo(
    () =>
      useMock
        ? { date: '-', version: '-', duration: '-' }
        : {
            date: formatRunTimestamp(item.created_at),
            version: getCurrentVersion(item.version_id),
            duration: SharedHelpers.secondsInHumanFormat(item.duration),
          },
    [getCurrentVersion, item, useMock],
  );

  if (useMock)
    return (
      <Box sx={styles.listItem}>
        <Skeleton
          variant="text"
          width={noVersions ? '50%' : '70%'}
          height={20}
        />
        {hasEvent && (
          <Skeleton
            variant="text"
            width="50%"
            height="1.25rem"
          />
        )}
        {!noVersions && (
          <Skeleton
            variant="text"
            width="50%"
            height={20}
          />
        )}
        <Skeleton
          variant="text"
          width={noVersions ? '50%' : '30%'}
          height={20}
          sx={{ minWidth: '5rem' }}
        />
        {extraColumns.map(column => (
          <Skeleton
            key={column.type}
            variant="text"
            width="50%"
            height={20}
          />
        ))}
      </Box>
    );

  return (
    <Box
      data-testid="run-history-list-item"
      data-selected={selectedItem === item.id}
      sx={[styles.listItem, selectedItem === item.id && styles.selected]}
      onClick={() => onItemSelect(item.id)}
    >
      <RunHistoryTooltipCell
        text={date}
        trigger={tooltipTrigger}
      />
      {hasEvent && (
        <RunHistoryTooltipCell
          text={item.event_label ?? '-'}
          tooltipText={item.event_tooltip ?? ''}
          trigger={tooltipTrigger}
        />
      )}
      {!noVersions && (
        <RunHistoryTooltipCell
          text={version}
          trigger={tooltipTrigger}
        />
      )}
      <RunHistoryTooltipCell
        text={duration}
        trigger={tooltipTrigger}
      />
      {extraColumns.map(column => (
        <RunHistoryTooltipCell
          key={column.type}
          text={column.getText(item)}
          tooltipText={column.getTooltip?.(item) ?? ''}
          trigger={tooltipTrigger}
        />
      ))}
      <RunHistoryRowActions
        item={item}
        source={source}
        onItemSelect={onItemSelect}
        handleRestoreConversation={handleRestoreConversation}
        handleOpenAnalytics={handleOpenAnalytics}
        shareOpensHistoryTab={shareOpensHistoryTab}
      />
    </Box>
  );
});

RunHistoryListItem.displayName = 'RunHistoryListItem';

/** @type {MuiSx} */
const runHistoryListItemStyles = gridTemplateColumns => ({
  listItem: ({ palette }) => ({
    display: 'grid',
    gridTemplateColumns,
    alignItems: 'center',
    padding: '.5rem 1rem',
    width: '100%',
    color: palette.text.secondary,
    position: 'relative',
    borderRadius: '0.5rem',

    span: {
      padding: '0rem 1rem',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      overflow: 'hidden',

      '&:first-of-type': {
        padding: 0,
      },
    },

    '&:after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '0.0625rem',
      backgroundColor: palette.divider,
    },

    '&:nth-of-type(1)': {
      '&:after': { display: 'none' },
    },

    '&:hover': {
      cursor: 'pointer',
      backgroundColor: palette.background.surface.interactive.default,

      '&:after': {
        display: 'none',
      },

      '#actions-block': {
        display: 'flex',
      },
    },

    '&:hover + &:after': {
      display: 'none',
    },
  }),
  selected: ({ palette }) => ({
    background: palette.components.split.background.pressed,

    '&:after': {
      display: 'none',
    },

    '&:hover': {
      cursor: 'pointer',
      background: palette.components.split.background.pressed,
    },

    '+ *:after': {
      display: 'none',
    },
  }),
});

export default RunHistoryListItem;
