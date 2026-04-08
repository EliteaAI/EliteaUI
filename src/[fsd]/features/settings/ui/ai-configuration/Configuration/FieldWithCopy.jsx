import { memo, useCallback, useMemo } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { handleCopy } from '@/common/utils';
import useToast from '@/hooks/useToast';

const FieldWithCopy = memo(props => {
  const { label = '', value = '' } = props;

  const { toastInfo } = useToast();
  const styles = useMemo(() => fieldWithCopyStyles(), []);

  const onCopy = useCallback(() => {
    handleCopy(value);
    toastInfo(`The ${label} is copied to clipboard`);
  }, [label, toastInfo, value]);

  return (
    <Box sx={styles.container}>
      <Typography
        sx={styles.label}
        variant="bodyMedium"
      >
        {label}
      </Typography>
      <Box sx={styles.valueContainer}>
        <Tooltip
          title="Click to copy"
          placement="top"
        >
          <Typography
            variant="bodyMedium"
            color="text.secondary"
            onClick={onCopy}
            sx={styles.value}
          >
            {value}
          </Typography>
        </Tooltip>
      </Box>
    </Box>
  );
});

FieldWithCopy.displayName = 'FieldWithCopy';

/** @type {MuiSx} */
const fieldWithCopyStyles = () => ({
  container: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
  },
  label: {
    width: '8.25rem',
  },
  valueContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  value: ({ palette }) => ({
    padding: '0 0.5rem',
    borderRadius: '0.9375rem',
    '&:hover': {
      cursor: 'pointer',
      backgroundColor: palette.background.userInputBackgroundActive,
    },
  }),
});

export default FieldWithCopy;
