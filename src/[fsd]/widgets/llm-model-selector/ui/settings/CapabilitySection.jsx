import { memo } from 'react';

import { Box } from '@mui/material';

import { Label } from '@/[fsd]/shared/ui';

import CapabilityChip from '../CapabilityChip';

const CapabilitySection = memo(props => {
  const { supportsVision = false, supportsReasoning = false } = props;

  if (!supportsVision && !supportsReasoning) return null;

  return (
    <Box sx={styles.container}>
      <Label.InfoLabelWithTooltip
        label="Capabilities"
        variant="subtitle"
        sx={styles.label}
      />
      <Box sx={styles.chips}>
        {supportsVision && (
          <CapabilityChip
            type="vision"
            showLabel
          />
        )}
        {supportsReasoning && (
          <CapabilityChip
            type="reasoning"
            showLabel
          />
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
    gap: '1rem',
  },
  label: {
    paddingLeft: '0.5rem',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
};

export default CapabilitySection;
