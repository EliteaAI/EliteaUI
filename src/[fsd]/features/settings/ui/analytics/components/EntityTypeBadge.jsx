import { memo } from 'react';

import { Box, useTheme } from '@mui/material';

// Usage's AG/PL indicator colours, kept verbatim so both pages read the same
const PIPELINE_BADGE = { bg: '#2a1a3a', text: '#b98cff' };
const AGENT_BADGE_BG = '#1a3a3a';

const EntityTypeBadge = memo(props => {
  const { kind, sx = {} } = props;

  const { palette } = useTheme();
  const isPipeline = (kind || '').toLowerCase() === 'pipeline';
  const badge = isPipeline ? PIPELINE_BADGE : { bg: AGENT_BADGE_BG, text: palette.text.success || '#4fd1a5' };

  const styles = entityTypeBadgeStyles(badge);

  return (
    <Box
      component="span"
      role="img"
      aria-label={isPipeline ? 'Pipeline' : 'Agent'}
      title={isPipeline ? 'Pipeline' : 'Agent'}
      sx={[styles.badge, sx]}
      data-testid="entity-type-badge"
    >
      {isPipeline ? 'PL' : 'AG'}
    </Box>
  );
});

EntityTypeBadge.displayName = 'EntityTypeBadge';

/** @type {MuiSx} */
const entityTypeBadgeStyles = ({ bg, text }) => ({
  badge: {
    fontSize: '0.5625rem',
    fontWeight: 700,
    padding: '0.0625rem 0.25rem',
    borderRadius: '0.1875rem',
    backgroundColor: bg,
    color: text,
    flexShrink: 0,
  },
});

export default EntityTypeBadge;
