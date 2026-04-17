import { memo, useMemo } from 'react';

import { format } from 'date-fns';

import { Box, CircularProgress, Skeleton, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { IndexStatuses } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import ClockIcon from '@/assets/clock.svg?react';
import FileIcon from '@/assets/file.svg?react';
import StopIcon from '@/assets/stop-icon.svg?react';
import AttentionIcon from '@/components/Icons/AttentionIcon';
import InfoIcon from '@/components/Icons/InfoIcon';

const IndexListItem = memo(props => {
  const { index, onIndexClick, currentIndex, useMock } = props;
  const styles = indexListItem();

  const isSelected = useMemo(() => currentIndex?.id === index.id, [currentIndex, index]);
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

    if (index.metadata.history?.length > 1 && index.metadata.updated !== undefined) {
      return {
        tooltip: 'reindexed / total indexed',
        count: `${index.metadata.updated} / ${index.metadata.indexed}`,
        skipped: skipped?.total_skipped || 0,
      };
    }

    return {
      tooltip: 'total indexed',
      count: index.metadata.indexed ?? '–',
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

  return (
    <Box
      sx={[
        styles.wrapper,
        ...(isSelected ? [styles.selectedWrapper] : []),
        ...(index.stale && index.metadata.state === IndexStatuses.progress ? [styles.errorWrapper] : []),
      ]}
      className={isSelected && true ? 'selected' : ''}
      onClick={() => onIndexClick(index)}
    >
      <Typography
        variant="bodyMedium"
        color="text.secondary"
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
          <Box sx={[styles.infoItem, { svg: { mt: '.15rem' } }]}>
            <AttentionIcon
              width={16}
              height={16}
            />
            <Tooltip
              title="total skipped during indexing"
              placement="top"
            >
              <Typography
                variant="bodySmall2"
                sx={styles.skippedText}
              >
                {documents.skipped}
              </Typography>
            </Tooltip>
          </Box>
        )}
      </Box>
      {index.metadata.state === IndexStatuses.progress && (
        <CircularProgress
          sx={styles.icon}
          size={14}
          thickness={5}
        />
      )}
      {index.metadata.state === IndexStatuses.fail && (
        <Box sx={styles.icon}>
          <InfoIcon
            width={16}
            height={16}
            fill="#D71616"
          />
        </Box>
      )}

      {index.metadata.state === IndexStatuses.cancelled && (
        <Box sx={[styles.icon, styles.warning]}>
          <StopIcon
            width={16}
            height={16}
          />
        </Box>
      )}
      {index.metadata.state === IndexStatuses.partlyOk && (
        <Box sx={[styles.icon, styles.warning]}>
          <AttentionIcon
            width={16}
            height={16}
          />
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
    flexDirection: 'column',
    justifyContent: 'center',
    width: '100%',
    height: '4rem',
    borderRadius: '.5rem',
    background: `${palette.background.userInputBackground}`,
    padding: '.375rem 1rem',
    border: `.0625rem solid transparent`,
    position: 'relative',
    gap: '.25rem',

    '&:hover': {
      background: palette.split.pressed,
      border: `.0625rem solid ${palette.split.hover}`,
      cursor: 'pointer',
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

  additionalInfo: {
    display: 'flex',
    gap: '1rem',
  },

  infoItem: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '0.5rem',

    svg: {
      path: {
        fill: ({ palette }) => palette.background.button.primary.disabled,
      },
    },
  },

  icon: ({ palette }) => ({
    color: palette.text.info,
    position: 'absolute',
    top: '50%',
    right: '1rem',
    marginTop: '-.4375rem',
  }),
  warning: {
    path: ({ palette }) => ({
      fill: palette.background.warning,
    }),
  },
  skippedText: ({ palette }) => ({
    color: palette.background.warning,
  }),
});

export default IndexListItem;
