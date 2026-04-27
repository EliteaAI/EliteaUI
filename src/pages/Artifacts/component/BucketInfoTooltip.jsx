import { memo, useMemo } from 'react';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';

import { formatRetentionDaysDisplay } from '@/utils/retentionPolicy';

const BucketInfoTooltip = memo(props => {
  const { fileCount = 0, retentionDays } = props;

  const styles = bucketInfoTooltipStyles();

  // Format retention days (new API format)
  const retentionText = useMemo(() => formatRetentionDaysDisplay(retentionDays), [retentionDays]);

  const tooltipItems = useMemo(
    () => [
      {
        label: 'Retention Policy:',
        value: retentionText,
      },
      {
        label: 'Number of files:',
        value: fileCount,
      },
    ],
    [retentionText, fileCount],
  );

  const tooltipContent = useMemo(
    () => (
      <Box sx={styles.contentBox}>
        {tooltipItems.map((item, index) => (
          <Box
            key={index}
            sx={styles.row}
          >
            <Typography
              variant="labelSmall"
              sx={styles.label}
            >
              {item.label}
            </Typography>
            <Typography
              variant="labelSmall"
              sx={styles.value}
            >
              {item.value}
            </Typography>
          </Box>
        ))}
      </Box>
    ),
    [tooltipItems, styles],
  );

  return (
    <Tooltip
      title={tooltipContent}
      placement="left"
      arrow
      sx={styles.tooltip}
    >
      <IconButton
        variant="alita"
        color="tertiary"
        sx={styles.iconButton}
        size="small"
        aria-label="Bucket info"
      >
        <InfoOutlinedIcon sx={styles.icon} />
      </IconButton>
    </Tooltip>
  );
});

BucketInfoTooltip.displayName = 'BucketInfoTooltip';

/** @type {MuiSx} */
const bucketInfoTooltipStyles = () => ({
  contentBox: {
    padding: '0.5rem',
    minWidth: '12.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  row: {
    display: 'flex',
    gap: '0.25rem',
    marginBottom: '0.5rem',
    whiteSpace: 'nowrap',
    '&:last-child': {
      marginBottom: 0,
    },
  },
  label: {
    fontWeight: 600,
  },
  value: {
    fontWeight: 500,
  },
  tooltip: ({ palette, shadows }) => ({
    '& .MuiTooltip-tooltip': {
      backgroundColor: palette.background.paper,
      color: palette.text.primary,
      border: `0.0625rem solid ${palette.border.lines}`,
      boxShadow: shadows[4],
      borderRadius: '0.5rem',
      maxWidth: '18.75rem',
    },
    '& .MuiTooltip-arrow': {
      color: palette.background.paper,
      '&:before': {
        border: `0.0625rem solid ${palette.border.lines}`,
      },
    },
  }),
  iconButton: {
    padding: 0,
    minWidth: '1.75rem',
    width: '1.75rem',
    height: '1.75rem',
  },
  icon: ({ palette }) => ({
    color: palette.icon.fill.default,
    fontSize: '1rem',
  }),
});

export default BucketInfoTooltip;
