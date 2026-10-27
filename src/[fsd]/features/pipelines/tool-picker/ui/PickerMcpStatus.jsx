import { memo, useCallback } from 'react';

import { Box, Tooltip } from '@mui/material';

import { McpAuthHelpers } from '@/[fsd]/features/mcp/lib/helpers';
import { useMcpTokenChange } from '@/[fsd]/features/mcp/lib/hooks';
import { McpLogInButton } from '@/[fsd]/features/mcp/ui';
import OfflineIcon from '@/assets/offline-icon.svg?react';

/** Connection state of an MCP with an inline "Log in", the same as the tool card shows */
const PickerMcpStatus = memo(props => {
  const { mcp, 'data-testid': testId } = props;

  const isPrebuildMcp = McpAuthHelpers.isPrebuildMcpType(mcp?.type);
  const serverUrl = mcp?.settings?.url || '';
  const { isLoggedIn } = useMcpTokenChange(
    mcp?.type === 'mcp' ? serverUrl : isPrebuildMcp ? { toolkitType: mcp?.type } : null,
  );

  // Logging in from a menu row must not pick the row
  const stopPropagation = useCallback(event => event.stopPropagation(), []);

  if (mcp?.online || isLoggedIn) return null;

  const styles = pickerMcpStatusStyles();

  return (
    <Box
      sx={styles.root}
      onClick={stopPropagation}
      onMouseDown={stopPropagation}
      onKeyDown={stopPropagation}
      data-testid={testId}
    >
      <Tooltip
        title={`The ${mcp?.name || 'MCP'} server is disconnected. Log in to use it.`}
        placement="top"
      >
        <Box sx={styles.offline}>
          <OfflineIcon />
        </Box>
      </Tooltip>
      <McpLogInButton
        values={mcp}
        autoVerifyConfiguredHeaders
        sx={styles.login}
      />
    </Box>
  );
});

PickerMcpStatus.displayName = 'PickerMcpStatus';

/** @type {MuiSx} */
const pickerMcpStatusStyles = () => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    flexShrink: 0,
  },
  offline: ({ palette }) => ({
    display: 'flex',
    color: palette.icon.attention,
    '& svg': { width: '1rem', height: '1rem' },
  }),
  login: {
    minWidth: 0,
    padding: '0 0.25rem',
  },
});

export default PickerMcpStatus;
