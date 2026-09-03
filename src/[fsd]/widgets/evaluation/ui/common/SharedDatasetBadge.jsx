import { memo } from 'react';

import { Box, Tooltip } from '@mui/material';

import ShareIcon from '@/assets/share-icon.svg?react';

const SharedDatasetBadge = memo(props => {
  const { showTooltip = true, tooltipTitle = 'Shared across the project', tooltipDelay = 500 } = props;

  const styles = sharedDatasetBadgeStyles();

  const badge = (
    <Box sx={styles.root}>
      <ShareIcon />
    </Box>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <Tooltip
      title={tooltipTitle}
      placement="top"
      enterDelay={tooltipDelay}
    >
      {badge}
    </Tooltip>
  );
});

SharedDatasetBadge.displayName = 'SharedDatasetBadge';

/** @type {MuiSx} */
const sharedDatasetBadgeStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.25rem',
    height: '1.25rem',
    flexShrink: 0,
    borderRadius: '50%',
    border: `0.0625rem solid ${palette.background.tabButton.default}`,
    '& svg': {
      width: '0.625rem',
      height: '0.625rem',
    },
    '& svg path': {
      fill: palette.text.primary,
    },
  }),
});

export default SharedDatasetBadge;
