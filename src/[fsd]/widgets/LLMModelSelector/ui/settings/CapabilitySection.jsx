import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { Label } from '@/[fsd]/shared/ui';
import ImageIcon from '@/assets/image.svg?react';
import ReasonIcon from '@/assets/reason-icon.svg?react';

const CapabilitySection = memo(props => {
  const { supportsVision = false, supportsReasoning = false } = props;

  if (!supportsVision && !supportsReasoning) return null;

  return (
    <Box sx={styles.container}>
      <Label.InfoLabelWithTooltip
        label="Capabilities"
        variant="subtitle"
      />
      <Box sx={styles.chips}>
        {supportsVision && (
          <Box sx={[styles.chip, styles.imageAnalysisChip]}>
            <Box
              component={ImageIcon}
              sx={styles.visionIcon}
            />
            <Typography variant="labelSmall">Image analysis</Typography>
          </Box>
        )}
        {supportsReasoning && (
          <Box sx={[styles.chip, styles.reasoningChip]}>
            <Box
              component={ReasonIcon}
              sx={styles.reasoningIcon}
            />
            <Typography variant="labelSmall">Reasoning</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
});

CapabilitySection.displayName = 'CapabilitySection';

/** @type {MuiSx} */
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  chip: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.25rem 0.375rem',
    borderRadius: '0.5rem',
    backdropFilter: `blur(${palette.mode === 'light' ? '0.375rem' : '0.75rem'})`,
    color: palette.text.secondary,
  }),
  imageAnalysisChip: ({ palette }) => ({
    backgroundColor: palette.capability.vision.background,
  }),
  reasoningChip: ({ palette }) => ({
    backgroundColor: palette.capability.reasoning.background,
  }),
  visionIcon: ({ palette }) => ({
    fontSize: '1rem',
    width: '1rem',
    height: '1rem',
    color: palette.capability.vision.icon,
  }),
  reasoningIcon: ({ palette }) => ({
    fontSize: '1rem',
    width: '1rem',
    height: '1rem',
    color: palette.capability.reasoning.icon,
  }),
};

export default CapabilitySection;
