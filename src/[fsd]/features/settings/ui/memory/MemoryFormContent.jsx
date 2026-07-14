import { memo } from 'react';

import { Box } from '@mui/material';

import { useFormikAutoSaveOnBlur } from '@/[fsd]/shared/lib/hooks';

import MemoryContextManagement from './MemoryContextManagement';

const MemoryFormContent = memo(props => {
  const { modelList } = props;

  const styles = memoryFormContentStyles();

  const { onBlur, requestSubmit } = useFormikAutoSaveOnBlur();

  return (
    <Box
      sx={styles.wrapper}
      onBlur={onBlur}
    >
      <Box sx={styles.container}>
        <MemoryContextManagement
          modelList={modelList}
          onAutoSaveRequested={requestSubmit}
        />
      </Box>
    </Box>
  );
});

MemoryFormContent.displayName = 'MemoryFormContent';

/** @type {MuiSx} */
const memoryFormContentStyles = () => ({
  wrapper: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '1.5rem',
    maxWidth: '50rem',
    width: '100%',
  },
});

export default MemoryFormContent;
