import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { SingleSelect } from '@/[fsd]/shared/ui/select';

const SelectWithLabel = memo(({ label, value, onChange, options, disabled, showOptionIcon }) => {
  const styles = getStyles();
  return (
    <Box sx={styles.container}>
      <Typography
        variant="bodyMedium"
        color="text.primary"
      >
        {label}
      </Typography>
      <Box>
        <SingleSelect
          sx={styles.select}
          disabled={disabled}
          label={''}
          value={value}
          onValueChange={onChange}
          options={options || []}
          showOptionIcon={showOptionIcon}
          inputSX={styles.selectInput}
          menuItemIconSX={styles.selectIcon}
        />
      </Box>
    </Box>
  );
});

SelectWithLabel.displayName = 'SelectWithLabel';

/** @type {MuiSx} */
const getStyles = () => ({
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '.5rem',
  },
  select: {
    margin: '0 !important',
  },
  selectInput: {
    padding: '0.385rem !important',
    '& .MuiInput-input': {
      paddingBottom: '0.1875rem !important',
    },
    '& .MuiSelect-icon': {
      top: 'calc(50% - 0.5625rem) !important',
    },
  },
  selectIcon: {
    width: '0.875rem !important',
    height: '1.125rem !important',
    fontSize: '0.875rem !important',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    svg: {
      fontSize: '0.875rem !important',
    },
  },
});

export default SelectWithLabel;
