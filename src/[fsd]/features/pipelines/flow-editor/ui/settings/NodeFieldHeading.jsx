import { memo } from 'react';

import { Box } from '@mui/material';

import LabelWithTooltip from '@/[fsd]/features/pipelines/flow-editor/ui/settings/input-mappings/LabelWithTooltip';
import { Chip } from '@/[fsd]/shared/ui';

// Heading chip of a node panel field, followed by its info icon
const NodeFieldHeading = memo(props => {
  const { label, tooltip, sx } = props;

  const styles = nodeFieldHeadingStyles();

  return (
    <Box sx={[styles.root, sx]}>
      <Chip.HeadingChip label={label} />
      <LabelWithTooltip
        tooltip={tooltip}
        title=""
      />
    </Box>
  );
});

NodeFieldHeading.displayName = 'NodeFieldHeading';

/** @type {MuiSx} */
const nodeFieldHeadingStyles = () => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: '.5rem',
  },
});

export default NodeFieldHeading;
