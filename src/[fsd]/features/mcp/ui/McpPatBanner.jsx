import { memo, useCallback } from 'react';

import PropTypes from 'prop-types';

import { Alert, Box, Typography } from '@mui/material';

import { PAT_GATE_COPY } from '@/[fsd]/features/mcp/lib/constants';
import { useInternalMcpPatStatus } from '@/[fsd]/features/mcp/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import RouteDefinitions, { getBasename } from '@/routes';

// Warns when the caller's PAT is missing/expired for an internal MCP toolkit.
const McpPatBanner = memo(({ projectId, toolkitType }) => {
  const { patState } = useInternalMcpPatStatus({ projectId, toolkitType });
  const copy = PAT_GATE_COPY[patState];

  const handleAction = useCallback(() => {
    window.open(`${getBasename()}${RouteDefinitions.CreatePersonalToken}`, '_blank', 'noopener,noreferrer');
  }, []);

  if (!copy) {
    return null;
  }

  return (
    <Alert
      severity="warning"
      sx={{ mb: '0.75rem' }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
        <Typography variant="bodySmall">{copy.content}</Typography>
        <Button.BaseBtn
          variant="elitea"
          color="primary"
          onClick={handleAction}
        >
          <Typography variant="labelSmall">{copy.label}</Typography>
        </Button.BaseBtn>
      </Box>
    </Alert>
  );
});

McpPatBanner.propTypes = {
  projectId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  toolkitType: PropTypes.string,
};

McpPatBanner.displayName = 'McpPatBanner';

export default McpPatBanner;
