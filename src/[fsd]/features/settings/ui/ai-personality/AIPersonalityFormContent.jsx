import { memo } from 'react';

import { Box } from '@mui/material';

import { useFormikAutoSaveOnBlur } from '@/[fsd]/shared/lib/hooks';

import AIPersonalityPersonalization from './AIPersonalityPersonalization';

const AIPersonalityFormContent = memo(() => {
  const styles = aiPersonalityFormContentStyles();

  const { onBlur, requestSubmit } = useFormikAutoSaveOnBlur();

  return (
    <Box
      sx={styles.wrapper}
      onBlur={onBlur}
    >
      <Box sx={styles.container}>
        <AIPersonalityPersonalization onAutoSaveRequested={requestSubmit} />
      </Box>
    </Box>
  );
});

AIPersonalityFormContent.displayName = 'AIPersonalityFormContent';

/** @type {MuiSx} */
const aiPersonalityFormContentStyles = () => ({
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

export default AIPersonalityFormContent;
