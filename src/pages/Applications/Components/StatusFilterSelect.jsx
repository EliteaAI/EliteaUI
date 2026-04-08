import { memo, useMemo } from 'react';

import { Box, Typography, useTheme } from '@mui/material';

import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { PUBLIC_PROJECT_ID } from '@/common/constants';

const StatusFilterSelect = memo(({ projectId, selectedTab, tabs, onChangeTab }) => {
  const theme = useTheme();

  const statusOptions = useMemo(
    () =>
      tabs
        .filter(item => item.display !== 'none')
        .map((item, index) => ({ label: item.label, value: index })),
    [tabs],
  );

  const styles = useStyles();

  return (
    <Box sx={styles.container}>
      <Box sx={styles.labelBox}>
        <Typography
          component={'div'}
          variant="bodyMedium"
          color={'text.default'}
        >
          {projectId != PUBLIC_PROJECT_ID ? 'Statuses:' : 'Filter by:'}
        </Typography>
      </Box>
      <Box sx={styles.selectBox}>
        <SingleSelect
          onValueChange={onChangeTab}
          value={selectedTab}
          options={statusOptions}
          customSelectedColor={`${theme.palette.text.primary} !important`}
          customSelectedFontSize={'0.875rem'}
          sx={styles.select}
        />
      </Box>
    </Box>
  );
});

StatusFilterSelect.displayName = 'StatusFilterSelect';

export default StatusFilterSelect;

const useStyles = () => ({
  container: {
    display: 'flex',
    marginLeft: '0.5rem',
    zIndex: 1001,
    minWidth: '7.3125rem',
    gap: '0.75rem',
    alignItems: 'center !important',
    height: '100%',
  },
  labelBox: {
    height: '1.5rem',
    width: '3.75rem',
  },
  selectBox: {
    flex: 1,
  },
  select: {
    margin: '0.3125rem 0 0 0 !important',
  },
});
