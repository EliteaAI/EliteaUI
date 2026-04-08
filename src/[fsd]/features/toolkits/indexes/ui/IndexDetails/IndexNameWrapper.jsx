import { memo, useMemo } from 'react';

import { Box, CircularProgress, Typography, useTheme } from '@mui/material';

import { IndexStatuses } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import StopIcon from '@/assets/stop-icon.svg?react';
import AttentionIcon from '@/components/Icons/AttentionIcon';
import InfoIcon from '@/components/Icons/InfoIcon';

const IndexNameWrapper = memo(props => {
  const { index } = props;
  const styles = indexNameWrapperStyles();

  const theme = useTheme();

  const state = index?.metadata?.state;
  const isFailed = state === IndexStatuses.fail;
  const isPartlyOk = state === IndexStatuses.partlyOk;
  const isWarningBadge = [IndexStatuses.fail, IndexStatuses.cancelled, IndexStatuses.partlyOk].includes(
    state,
  );

  const badgeLabel = useMemo(() => {
    if (isFailed) return 'Index processing error';
    if (isPartlyOk) return 'Partially indexed';
    return 'Stopped';
  }, [isFailed, isPartlyOk]);

  return (
    <Box sx={styles.nameWrapper}>
      <Typography
        variant="headingSmall"
        color="text.secondary"
      >
        {index?.metadata?.collection}
      </Typography>
      {isWarningBadge && (
        <Box sx={ui => styles.errorWrapper(ui, isFailed)}>
          <>
            {isFailed ? (
              <InfoIcon
                width={16}
                height={16}
                fill={theme.palette.background.button.danger}
              />
            ) : isPartlyOk ? (
              <AttentionIcon
                width={16}
                height={16}
              />
            ) : (
              <StopIcon sx={{ fontSize: '1rem' }} />
            )}
          </>

          <Typography
            variant="bodySmall"
            color="text.secondary"
          >
            {badgeLabel}
          </Typography>
        </Box>
      )}
      {state === IndexStatuses.progress && (
        <Box sx={styles.progressWrapper}>
          <CircularProgress
            sx={styles.progressIcon}
            size={14}
            thickness={5}
          />
          <Typography
            variant="bodySmall"
            color="text.secondary"
            sx={{ whiteSpace: 'nowrap' }}
          >
            In Progress
          </Typography>
        </Box>
      )}
    </Box>
  );
});

IndexNameWrapper.displayName = 'IndexNameWrapper';

/** @type {MuiSx} */
const indexNameWrapperStyles = () => ({
  nameWrapper: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: '1rem',
  },
  errorWrapper: ({ palette }, isError) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '.25rem .75rem .25rem 0.25rem',
    borderRadius: '1rem',
    border: `1px solid ${isError ? palette.background.wrongBkg : palette.background.warning40}`,
    background: isError ? palette.background.errorBkg : palette.background.warning8,
    gap: '0.5rem',

    svg: {
      minWidth: '1rem',

      ...(!isError
        ? {
            path: {
              fill: palette.background.warning,
            },
          }
        : {}),
    },
  }),
  progressWrapper: ({ palette }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '.25rem .75rem',
    borderRadius: '1rem',
    border: `1px solid ${palette.border.tips}`,
    background: palette.background.info,
    gap: '0.5rem',

    svg: {
      minWidth: '1rem',
    },
  }),
  progressIcon: ({ palette }) => ({
    color: palette.text.info,
    width: '1rem !important',
    height: '1rem !important',
  }),
});

export default IndexNameWrapper;
