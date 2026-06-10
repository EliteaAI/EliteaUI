import { memo } from 'react';

import { Box, Divider, Typography } from '@mui/material';

import { getToolIcon } from '@/common/toolkitUtils';

// Header for a sub-agent activity group: agent icon + sub-agent name + a
// horizontal divider filling the remaining width. Used to separate parallel
// sub-agent output (chips, streaming, HITL cards) by originating sub-agent
// name (issue #4993).
const SubAgentSection = memo(props => {
  const { name } = props;
  const AgentIcon = getToolIcon('agent');

  return (
    <Box sx={subAgentSectionStyles.header}>
      <Box sx={subAgentSectionStyles.labelRow}>
        <AgentIcon style={subAgentSectionStyles.icon} />
        <Typography
          variant="bodySmall2"
          sx={subAgentSectionStyles.label}
        >
          {name}
        </Typography>
      </Box>
      <Divider sx={subAgentSectionStyles.divider} />
    </Box>
  );
});

SubAgentSection.displayName = 'SubAgentSection';

/** @type {MuiSx} */
const subAgentSectionStyles = {
  header: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  icon: {
    width: '1rem',
    height: '1rem',
    flexShrink: 0,
  },
  label: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  }),
  divider: ({ palette }) => ({
    width: '100%',
    borderColor: palette.border.lines,
  }),
};

export default SubAgentSection;
