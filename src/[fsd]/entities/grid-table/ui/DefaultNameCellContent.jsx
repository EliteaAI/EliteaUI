import { memo } from 'react';

import { Box, LinearProgress, Typography } from '@mui/material';

import { Tooltip } from '@/[fsd]/shared/ui';

const DefaultNameCellContent = memo(props => {
  const { namePrefix, isLoading, loadingProgress, rowName, styles } = props;

  return (
    <>
      {namePrefix}
      <Box sx={styles.nameContent}>
        {isLoading ? (
          <>
            <Typography
              variant="bodyMedium"
              color="text.primary"
              sx={styles.nameText}
            >
              {rowName}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={loadingProgress}
              sx={styles.progressBar}
            />
          </>
        ) : (
          <Tooltip.TypographyWithConditionalTooltip
            title={rowName}
            placement="top"
            variant="bodyMedium"
            color="text.secondary"
            sx={styles.nameText}
          >
            {rowName}
          </Tooltip.TypographyWithConditionalTooltip>
        )}
      </Box>
    </>
  );
});

DefaultNameCellContent.displayName = 'DefaultNameCellContent';

export default DefaultNameCellContent;
