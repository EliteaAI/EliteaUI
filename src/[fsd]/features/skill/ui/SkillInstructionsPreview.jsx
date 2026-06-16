import { memo } from 'react';

import { useFormikContext } from 'formik';

import { Box, Typography } from '@mui/material';

import { Markdown } from '@/[fsd]/shared/ui';
import { ContentContainer } from '@/pages/Common/Components/StyledComponents';

const SkillInstructionsPreview = memo(() => {
  const styles = skillInstructionsPreviewStyles();
  const { values } = useFormikContext();
  const instructions = values?.version_details?.instructions || '';

  return (
    <ContentContainer
      height="100%"
      sx={styles.previewContainer}
    >
      <Typography
        variant="labelMedium"
        color="text.secondary"
        sx={styles.previewTitle}
      >
        Instructions preview
      </Typography>
      {instructions ? (
        <Box sx={styles.previewBody}>
          <Markdown>{instructions}</Markdown>
        </Box>
      ) : (
        <Typography
          variant="bodyMedium"
          color="text.default"
        >
          Nothing to preview yet. Add markdown instructions on the left.
        </Typography>
      )}
    </ContentContainer>
  );
});

SkillInstructionsPreview.displayName = 'SkillInstructionsPreview';

/** @type {MuiSx} */
const skillInstructionsPreviewStyles = () => ({
  previewContainer: {
    height: '100%',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  previewTitle: {
    flexShrink: 0,
  },
  previewBody: {
    flex: 1,
    overflowY: 'auto',
  },
});

export default SkillInstructionsPreview;
