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

  const styles = runHistoryListItemStyles(noVersions, hasEvent, extraColumns);

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
        {extraColumns.map(column => (
          <Skeleton
            key={column.id}
            variant="text"
            width="50%"
            height="1.25rem"
          />
        ))}
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
      {extraColumns.map(column => {
        const cell = column.render(item);
        // A text cell gets the overflow tooltip; a node (for example a link) renders as it is
        return typeof cell === 'string' ? (
          <RunHistoryTooltipCell
            key={column.id}
            text={cell}
            // The narrow schedule cells always give their full text, so a cut "Waiting for input" can be read
            tooltipText={cell === '-' ? '' : cell}
            trigger={tooltipTrigger}
          />
        ) : (
          <Box
            key={column.id}
            sx={styles.nodeCell}
          >
            {cell}
          </Box>
        );
      })}
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
const runHistoryListItemStyles = (noVersions, hasEvent, extraColumns) => ({
  nodeCell: {
    minWidth: 0,
    padding: '0 1rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  listItem: ({ palette }) => ({
    display: 'grid',
    gridTemplateColumns: resolveRunHistoryColumns(noVersions, hasEvent, extraColumns),
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
