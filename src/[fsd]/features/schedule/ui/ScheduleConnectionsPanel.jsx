import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import BannerMessage from '@/[fsd]/shared/ui/banner-message/BannerMessage';
import BaseBtn from '@/[fsd]/shared/ui/button/BaseBtn';

import { CONNECTIONS_CHECK_STATUS } from '../lib/constants';
import { allConnectionsOk } from '../lib/helpers';
import ScheduleConnectionRow from './ScheduleConnectionRow';

const WEBHOOK_NOTE = 'A webhook runs with no one signed in. Every connection must be OK to save.';
const SCHEDULE_NOTE =
  'With "Pause and ask me", a run waits for you to sign in. Sign in here so runs do not have to wait.';

// The Connections panel of the webhook and schedule form; a webhook saves only when every row is OK
const ScheduleConnectionsPanel = memo(props => {
  const { connections, isWebhook } = props;
  const { status, rows, recheck } = connections;
  const styles = scheduleConnectionsPanelStyles();

  if (
    status === CONNECTIONS_CHECK_STATUS.IDLE ||
    (!rows.length && status !== CONNECTIONS_CHECK_STATUS.FAILED)
  )
    return null;
  const ready = allConnectionsOk(rows);

  return (
    <Box
      sx={styles.root}
      data-testid="schedule-connections-panel"
    >
      <Typography variant="labelMedium">Connections</Typography>
      {!ready && rows.length > 0 && (
        <BannerMessage variant={isWebhook ? 'error' : 'warning'}>
          <Typography variant="bodySmall">{isWebhook ? WEBHOOK_NOTE : SCHEDULE_NOTE}</Typography>
        </BannerMessage>
      )}
      {rows.map(row => (
        <ScheduleConnectionRow
          key={`${row.toolkit}:${row.toolkit_type}:${row.credential_uuid ?? row.credential_title ?? ''}`}
          row={row}
          onLoginChange={recheck}
        />
      ))}
      {status === CONNECTIONS_CHECK_STATUS.FAILED && (
        <BannerMessage variant="warning">
          <Box sx={styles.failed}>
            <Typography variant="bodySmall">The connections could not be checked. Try again.</Typography>
            <BaseBtn
              onClick={recheck}
              data-testid="schedule-connections-retry"
            >
              Try again
            </BaseBtn>
          </Box>
        </BannerMessage>
      )}
    </Box>
  );
});

ScheduleConnectionsPanel.displayName = 'ScheduleConnectionsPanel';

/** @type {MuiSx} */
const scheduleConnectionsPanelStyles = () => ({
  root: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  failed: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' },
});

export default ScheduleConnectionsPanel;
