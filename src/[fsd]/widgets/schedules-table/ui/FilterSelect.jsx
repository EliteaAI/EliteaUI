import { memo } from 'react';

import { Box } from '@mui/material';

import { SingleSelect } from '@/[fsd]/shared/ui/select';

// An unset select shows its label as the placeholder; a set select shows the label above the value
const FilterSelect = memo(({ id, label, width, options, value, onValueChange }) => {
  const styles = filterSelectStyles(width);
  return (
    <Box
      sx={styles.select}
      data-testid={`schedules-filter-${id}`}
    >
      <SingleSelect
        showBorder
        label={label}
        options={options}
        value={value}
        onValueChange={onValueChange}
        showEmptyPlaceholder={false}
        inputProps={{ 'aria-label': label }}
      />
    </Box>
  );
});

FilterSelect.displayName = 'FilterSelect';

/** @type {MuiSx} */
const filterSelectStyles = width => ({
  select: ({ breakpoints }) => ({
    width,
    [breakpoints.down(1100)]: { flex: '1 1 9rem' },
    [breakpoints.down('sm')]: { flexBasis: '100%' },
  }),
});

export default FilterSelect;
