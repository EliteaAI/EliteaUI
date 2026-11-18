import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { StoredLoginHelpers } from '@/[fsd]/features/credentials/lib/helpers';
import { StoredLoginStatus } from '@/[fsd]/features/credentials/ui';

import { CONNECTION_STATUS } from '../lib/constants';
import { canSignInHere, connectionLabel, connectionReason } from '../lib/helpers';

// One row per toolkit of the version (#7401): OK, or a sign-in to a saved login the server can refresh
const ScheduleConnectionRow = memo(props => {
  const { row, onLoginChange } = props;
  const styles = scheduleConnectionRowStyles();
  const ok = row.status === CONNECTION_STATUS.OK;
  const login = canSignInHere(row) ? StoredLoginHelpers.getStoredLoginConfig(row.credential_type) : null;

  return (
    <Box
      sx={styles.row}
      data-testid="schedule-connection-row"
      data-status={row.status}
    >
      <Box sx={styles.rowText}>
        <Typography variant="labelMedium">{connectionLabel(row)}</Typography>
        {!ok && (
          <Typography
            variant="bodySmall"
            sx={styles.reason}
          >
            {connectionReason(row)}
          </Typography>
        )}
      </Box>
      {ok && (
        <Typography
          variant="labelSmall"
          sx={styles.ok}
          data-testid="schedule-connection-ok"
        >
          OK
        </Typography>
      )}
      {login && (
        <Box sx={styles.signIn}>
          <StoredLoginStatus
            compact
            {...login}
            credentialRef={{ elitea_title: row.credential_title, private: row.private }}
            loginExpired={row.login === 'expired'}
            onLoginChange={onLoginChange}
          />
        </Box>
      )}
    </Box>
  );
});

ScheduleConnectionRow.displayName = 'ScheduleConnectionRow';

/** @type {MuiSx} */
const scheduleConnectionRowStyles = () => ({
  row: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
  }),
  rowText: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  reason: ({ palette }) => ({ color: palette.text.secondary }),
  ok: ({ palette }) => ({ color: palette.icon.success }),
  signIn: { flexShrink: 0, minWidth: '14rem' },
});

export default ScheduleConnectionRow;
