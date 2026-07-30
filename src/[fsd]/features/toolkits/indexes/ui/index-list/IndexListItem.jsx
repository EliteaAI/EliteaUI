import { memo, useMemo } from 'react';

import { format } from 'date-fns';

import { Box, CircularProgress, Skeleton, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { IndexStatuses } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import { useProjectType } from '@/[fsd]/shared/lib/hooks/useProjectType.hooks';
import { Button } from '@/[fsd]/shared/ui';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';
import ClockIcon from '@/assets/clock.svg?react';
import FileIcon from '@/assets/file.svg?react';
import IndexingIcon from '@/assets/indexing.svg?react';
import OpenInNewIcon from '@/assets/open-new-icon.svg?react';
import StopIcon from '@/assets/stop-icon.svg?react';
import UnavailableIcon from '@/assets/unavailable.svg?react';
import { PERMISSIONS } from '@/common/constants';
import EntityIcon from '@/components/EntityIcon';
import AttentionIcon from '@/components/Icons/AttentionIcon';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const IndexListItem = memo(props => {
  const {
    index,
    onIndexClick,
    currentIndex,
    useMock,
    listOnly = false,
    onCardReindex,
    onCardDelete,
    onCardOpenNewTab,
    isReindexing,
  } = props;
  const styles = indexListItem();
  const { isPrivate } = useProjectType();
  const { checkPermission } = useCheckPermission();

  const canDeleteIndex = isPrivate || checkPermission(PERMISSIONS.index.delete);
  const projectId = useSelectedProjectId();

  const isSelected = useMemo(() => currentIndex?.id === index.id, [currentIndex, index]);
  const isInProgress = index?.metadata?.state === IndexStatuses.progress;
  const disableActions = isReindexing || isInProgress;

  const documents = useMemo(() => {
    if (!index.metadata) return { tooltip: '-', count: '–', skipped: '-' };

    let skipped = { total_skipped: 0 };

    try {
      skipped =
        typeof index.metadata.skipped === 'string'
          ? JSON.parse(index.metadata.skipped)
          : index.metadata.skipped;
    } catch {
      // silente catch
    }

    // Reindex detection: the SDK records a history entry per state transition (in_progress
    // + completed), so history.length > 1 fires on any completed run. Count only completed
    // entries — more than one means this collection has been indexed more than once.
    // Units are docs/docs: `indexed` = documents landed in the vector store, `total` =
    // documents fetched from the source. Mixing chunks and docs (previous behavior) made
    // the ratio meaningless when a doc chunker produces multiple chunks per document.
    const completedRuns = Array.isArray(index.metadata.history)
      ? index.metadata.history.filter(h => h?.state === 'completed').length
      : 0;
    const isReindex = completedRuns > 1;
    const total = index.metadata.total ?? index.metadata.indexed ?? '–';
    const indexedDocs = index.metadata.indexed ?? '–';

    if (isReindex) {
      return {
        tooltip: 'reindexed / total',
        count: `${indexedDocs} / ${total}`,
        skipped: skipped?.total_skipped || 0,
      };
    }

    return {
      tooltip: 'indexed / total',
      count: `${indexedDocs} / ${total}`,
      skipped: skipped?.total_skipped || 0,
    };
  }, [index]);

  if (useMock)
    return (
      <Box sx={styles.wrapper}>
        <Skeleton
          variant="text"
          width="70%"
          height={20}
        />
        <Skeleton
          variant="text"
          width="50%"
          height={20}
        />
      </Box>
    );

  const handleReindexClick = e => {
    e.stopPropagation();
    if (disableActions) return;
    onCardReindex?.(index);
  };

  const handleDeleteClick = e => {
    e.stopPropagation();
    if (disableActions) return;
    onCardDelete?.(index);
  };

  const handleOpenNewTabClick = e => {
    e.stopPropagation();
    onCardOpenNewTab?.(index);
  };

  const handleCardClick = () => {
    if (!onIndexClick) return;
    onIndexClick(index);
  };

  return (
    <Box
      sx={[
        styles.wrapper,
        ...(isSelected ? [styles.selectedWrapper] : []),
        ...(index.stale && index.metadata.state === IndexStatuses.progress ? [styles.errorWrapper] : []),
      ]}
      className={isSelected && true ? 'selected' : ''}
      onClick={handleCardClick}
    >
      <EntityIcon
        entityType="index"
        projectId={projectId}
        editable={false}
      />
      <Box sx={styles.mainContent}>
        <Typography
          variant="bodyMedium"
          color="text.secondary"
          sx={styles.nameText}
        >
          {index.metadata.collection}
        </Typography>
        <Box sx={styles.additionalInfo}>
          <Box sx={styles.infoItem}>
            <ClockIcon />
            <Typography variant="bodySmall2">
              {index.metadata.created_on
                ? format(new Date(index.metadata.created_on * 1000), 'dd.MM.yyyy')
                : '–'}
            </Typography>
          </Box>

          <Box sx={styles.infoItem}>
            <FileIcon />
            <Tooltip
              title={documents.tooltip}
              placement="top"
            >
              <Typography variant="bodySmall2">{documents.count}</Typography>
            </Tooltip>
          </Box>

          {Number(documents.skipped) > 0 && (
            <Box sx={[styles.infoItem]}>
              <UnavailableIcon />
              <Tooltip
                title="total skipped during indexing"
                placement="top"
              >
                <Typography
                  variant="bodySmall2"
                  noWrap
                >
                  {documents.skipped}
                </Typography>
              </Tooltip>
            </Box>
          )}
        </Box>
      </Box>

      {listOnly && (onCardReindex || onCardDelete || onCardOpenNewTab) && (
        <Box sx={styles.actions}>
          {onCardOpenNewTab && (
            <Tooltip
              title="Open in new tab"
              placement="top"
            >
              <Button.BaseBtn
                className="index-card-actions"
                variant={Button.BUTTON_VARIANTS.tertiary}
                startIcon={<OpenInNewIcon sx={styles.actionIcon} />}
                onClick={handleOpenNewTabClick}
                data-testid="index-card-open-new-tab-btn"
              />
            </Tooltip>
          )}
          {onCardReindex && (
            <Tooltip
              title="Reindex"
              placement="top"
            >
              <Button.BaseBtn
                className="index-card-actions"
                variant={Button.BUTTON_VARIANTS.tertiary}
                startIcon={<IndexingIcon sx={styles.actionIcon} />}
                onClick={handleReindexClick}
                data-testid="index-card-reindex-btn"
              />
            </Tooltip>
          )}
          {onCardDelete && canDeleteIndex && (
            <Tooltip
              title="Delete"
              placement="top"
            >
              <Button.BaseBtn
                className="index-card-actions"
                variant={Button.BUTTON_VARIANTS.tertiary}
                startIcon={<DeleteIcon sx={styles.actionIcon} />}
                onClick={handleDeleteClick}
                data-testid="index-card-delete-btn"
              />
            </Tooltip>
          )}
          {index.metadata.state !== IndexStatuses.success && (
            <Box style={styles.stateIconContainer}>
              {index.metadata.state === IndexStatuses.progress && (
                <CircularProgress
                  sx={styles.stateIcon}
                  size={14}
                  thickness={5}
                />
              )}
              {index.metadata.state === IndexStatuses.fail && (
                <InfoTooltip
                  infoTooltip={{ icon: styles.error }}
                  disableTooltip
                  sx={styles.stateIcon}
                />
              )}

              {index.metadata.state === IndexStatuses.cancelled && (
                <Box sx={[styles.stateIcon, styles.warning, styles.stateIconContainer]}>
                  <StopIcon
                    width={16}
                    height={16}
                  />
                </Box>
              )}
              {index.metadata.state === IndexStatuses.partlyOk && (
                <Box sx={[styles.stateIcon, styles.warning, styles.stateIconContainer]}>
                  <AttentionIcon
                    width={16}
                    height={16}
                  />
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
});

IndexListItem.displayName = 'IndexListItem';

/** @type {MuiSx} */
const indexListItem = () => ({
  wrapper: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    minHeight: '4rem',
    borderRadius: '.5rem',
    background: `${palette.background.userInputBackground}`,
    padding: '.5rem 1rem',
    border: `.0625rem solid ${palette.border.table}`,
    position: 'relative',
    gap: '1rem',

    '& .index-card-actions': {
      opacity: 0,
      transition: 'opacity 0.15s ease-in-out',
    },

    '&:hover': {
      border: `.0625rem solid ${palette.border.lines}`,
      cursor: 'pointer',

      '& .index-card-actions': {
        opacity: 1,
      },
    },
  }),

  selectedWrapper: ({ palette }) => ({
    background: palette.split.pressed,
    border: `.0625rem solid ${palette.split.hover}`,
  }),

  errorWrapper: ({ palette }) => ({
    border: `1px solid ${palette.background.wrongBkg}`,
    background: palette.background.errorBkg,

    '&:hover': {
      background: palette.background.errorBkg,
      border: `1px solid ${palette.error.main}`,
    },

    '&.selected': {
      background: palette.background.errorBkg,
      border: `1px solid ${palette.error.main}`,
    },
  }),

  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '.25rem',
    flexGrow: 1,
    minWidth: 0,
    overflow: 'hidden',
  },

  nameText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  additionalInfo: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'nowrap',
    alignItems: 'center',
  },

  infoItem: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    whiteSpace: 'nowrap',
    gap: '0.5rem',

    svg: {
      path: {
        fill: ({ palette }) => palette.background.button.primary.disabled,
      },
    },
  },

  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    flexShrink: 0,
    position: 'absolute',
    right: '0.75rem',
  },

  actionButton: ({ palette }) => ({
    padding: '0.25rem',
    color: palette.text.secondary,
    '& svg': {
      width: '1rem',
      height: '1rem',
    },
    '&.Mui-disabled': {
      opacity: 0.4,
    },
  }),
  stateIconContainer: {
    width: '1.5rem',
    height: '1.5rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stateIcon: ({ palette }) => ({
    color: palette.text.info,
  }),
  error: {
    fill: '#D71616',
  },
  warning: {
    path: ({ palette }) => ({
      fill: palette.background.warning,
    }),
  },

  actionIcon: {
    fontSize: '1rem',
  },
});

export default IndexListItem;
