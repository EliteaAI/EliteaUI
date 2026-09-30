import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { Banner } from '@/[fsd]/shared/ui';

import EnhanceEvalFixCard from '../EnhanceEvalFixCard';

const EnhanceEvalFixesStep = memo(props => {
  const { fixes = [], acceptedFlags = [], onToggle, description, bannerMessage, testId } = props;

  const styles = enhanceEvalFixesStepStyles();

  return (
    <Box
      sx={styles.root}
      data-testid={testId}
    >
      <Banner.BannerMessage
        variant="info"
        message={bannerMessage}
      />
      {description && (
        <Typography
          variant="bodyMedium"
          sx={styles.description}
        >
          {description}
        </Typography>
      )}
      <Box sx={styles.list}>
        {fixes.map(({ fix, index }) => (
          <EnhanceEvalFixCard
            key={`eval-fix-${index}`}
            testId={`enhance-eval-fix-${index}`}
            fix={fix}
            checked={Boolean(acceptedFlags[index])}
            onToggle={() => onToggle?.(index)}
          />
        ))}
      </Box>
    </Box>
  );
});

EnhanceEvalFixesStep.displayName = 'EnhanceEvalFixesStep';

/** @type {MuiSx} */
const enhanceEvalFixesStepStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '1.5rem 2rem',
  },
  description: ({ palette }) => ({
    color: palette.text.primary,
  }),
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
});

export default EnhanceEvalFixesStep;
