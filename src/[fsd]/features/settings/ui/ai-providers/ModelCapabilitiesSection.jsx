import { memo, useMemo } from 'react';

import { Box, Chip, Typography } from '@mui/material';

const ModelCapabilitiesSection = memo(props => {
  const { capabilities } = props;

  const styles = useMemo(() => modelCapabilitiesSectionStyles(), []);

  if (!capabilities || capabilities.length === 0) {
    return null;
  }

  return (
    <Box sx={styles.capabilitiesSection}>
      <Typography
        variant="h6"
        sx={styles.sectionTitle}
      >
        Model Capabilities
      </Typography>

      <Box sx={styles.capabilitiesContainer}>
        {capabilities.map((capability, index) => (
          <Chip
            key={index}
            label={capability}
            size="small"
            sx={styles.capabilityChip}
          />
        ))}
      </Box>
    </Box>
  );
});

ModelCapabilitiesSection.displayName = 'ModelCapabilitiesSection';

/** @type {MuiSx} */
const modelCapabilitiesSectionStyles = () => ({
  capabilitiesSection: {
    flexShrink: 0,
  },
  sectionTitle: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  }),
  capabilitiesContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  capabilityChip: ({ palette }) => ({
    backgroundColor: palette.primary.main,
    color: palette.primary.contrastText,
    fontWeight: 500,
    fontSize: '0.75rem',
    height: '1.75rem',
    borderRadius: '0.875rem',
    border: 'none',
    '& .MuiChip-label': {
      px: 2,
    },
    '&:hover': {
      backgroundColor: palette.primary.dark,
    },
  }),
});

export default ModelCapabilitiesSection;
