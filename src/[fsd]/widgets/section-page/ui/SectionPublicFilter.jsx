import { memo, useMemo } from 'react';

import { Box, Typography, useTheme } from '@mui/material';

import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { PUBLIC_VIEWS, PUBLIC_VIEW_OPTIONS } from '@/[fsd]/widgets/section-page/lib/constants';

const SectionPublicFilter = memo(props => {
  const { value, onChange, showAdmin = false, testIdPrefix } = props;
  const theme = useTheme();

  const options = useMemo(
    () => PUBLIC_VIEW_OPTIONS.filter(option => showAdmin || option.value !== PUBLIC_VIEWS.admin),
    [showAdmin],
  );

  const styles = sectionPublicFilterStyles();

  return (
    <Box sx={styles.root}>
      <Box sx={styles.labelBox}>
        <Typography
          component="div"
          variant="bodyMedium"
          sx={styles.label}
        >
          Filter by:
        </Typography>
      </Box>
      <Box sx={styles.select}>
        <SingleSelect
          onValueChange={onChange}
          value={value}
          options={options}
          customSelectedColor={`${theme.palette.text.primary} !important`}
          customSelectedFontSize="0.875rem"
          sx={styles.selectControl}
          data-testid={`${testIdPrefix}-public-filter`}
        />
      </Box>
    </Box>
  );
});

SectionPublicFilter.displayName = 'SectionPublicFilter';

// Values of the old "Filter by" (StatusFilterSelect): the select's top margin puts its value on the label's baseline
/** @type {MuiSx} */
const sectionPublicFilterStyles = () => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    minWidth: '7.3125rem',
    height: '100%',
  },
  labelBox: {
    height: '1.5rem',
    width: '3.75rem',
    flexShrink: 0,
  },
  label: ({ palette }) => ({
    color: palette.text.primary,
    whiteSpace: 'nowrap',
  }),
  select: {
    flex: 1,
  },
  selectControl: {
    margin: '0.3125rem 0 0 0 !important',
  },
});

export default SectionPublicFilter;
