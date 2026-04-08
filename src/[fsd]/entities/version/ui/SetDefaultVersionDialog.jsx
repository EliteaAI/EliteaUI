import { memo } from 'react';

import { Box, Button, Typography } from '@mui/material';

import BaseModal from '@/[fsd]/shared/ui/modal/BaseModal';
import AttentionIcon from '@/components/Icons/AttentionIcon';

const SetDefaultVersionDialog = memo(props => {
  const { open, onClose, onConfirm, confirming = false, versionName } = props;

  return (
    <BaseModal
      open={open}
      title="Set as default?"
      onClose={onClose}
      content={
        <Box sx={styles.warningBanner}>
          <Box
            component={AttentionIcon}
            sx={styles.warningIcon}
          />
          <Typography
            variant="bodySmall"
            sx={styles.warningText}
          >
            Once set as default,{' '}
            <Box
              component="span"
              sx={styles.versionName}
            >
              {versionName}
            </Box>{' '}
            will be automatically used whenever this agent is added to new or existing conversations, other
            agents or pipelines as a toolkit, or as an MCP toolkit.
          </Typography>
        </Box>
      }
      actions={
        <>
          <Button
            variant="elitea"
            color="secondary"
            onClick={onClose}
            autoFocus
            disableRipple
          >
            Cancel
          </Button>
          <Button
            disableRipple
            variant="elitea"
            color="primary"
            onClick={onConfirm}
            disabled={confirming}
          >
            Set as a default
          </Button>
        </>
      }
      sx={styles.dialog}
    />
  );
});

SetDefaultVersionDialog.displayName = 'SetDefaultVersionDialog';

/** @type {MuiSx} */
const styles = {
  dialog: {
    '& .MuiDialog-paper': {
      width: '31.25rem !important',
      maxWidth: '31.25rem !important',
    },
  },
  warningBanner: ({ palette, spacing }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: spacing(1.5),
    padding: spacing(2),
    borderRadius: '0.5rem',
    backgroundColor: palette.background.warning8,
    border: `0.0625rem solid ${palette.background.warning40}`,
  }),
  warningIcon: ({ palette }) => ({
    flexShrink: 0,
    width: '1rem',
    height: '1rem',
    fill: palette.background.warning,
  }),
  warningText: ({ palette }) => ({
    flex: 1,
    color: palette.text.attention,
  }),
  versionName: ({ palette }) => ({
    fontWeight: 600,
    color: palette.text.attention,
  }),
};

export default SetDefaultVersionDialog;
