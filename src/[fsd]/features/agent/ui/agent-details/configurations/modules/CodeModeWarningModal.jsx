import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import BaseModal from '@/[fsd]/shared/ui/modal/BaseModal';
import { useGetPlatformSettingsQuery } from '@/api/platformSettings';

const EMPTY_LIMITATIONS = [];

const CodeModeWarningModal = memo(props => {
  const { open, internalTools = [], onConfirm, onClose } = props;
  const projectId = useSelectedProjectId();
  const { data: platformSettings } = useGetPlatformSettingsQuery({ projectId }, { skip: !projectId });
  const limitations = platformSettings?.code_mode_limitations || EMPTY_LIMITATIONS;
  const isSwarmOn = internalTools.includes('swarm');

  const items = useMemo(
    () =>
      limitations.map(item =>
        item.key === 'swarm' && isSwarmOn
          ? { ...item, text: "Swarm is on, so Code Mode won't be used.", highlighted: true }
          : item,
      ),
    [limitations, isSwarmOn],
  );

  const styles = codeModeWarningModalStyles();

  return (
    <BaseModal
      variant={ModalConstants.MODAL_VARIANT.simple}
      titleIcon={ModalConstants.MODAL_ICON_TYPE.warning}
      title="Warning"
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      confirmButtonText="Enable"
      data-testid="agent-code-mode-warning"
      confirmButtonTestId="agent-code-mode-warning-confirm"
      content={
        <Box sx={styles.root}>
          <Typography variant="bodyMedium">Code Mode (beta) does not apply to:</Typography>
          {items.map(item => (
            <Typography
              key={item.key}
              variant="bodyMedium"
              sx={item.highlighted ? styles.highlighted : undefined}
              data-testid={`agent-code-mode-limitation-${item.key}`}
            >
              • {item.text}
            </Typography>
          ))}
        </Box>
      }
    />
  );
});

CodeModeWarningModal.displayName = 'CodeModeWarningModal';

/** @type {MuiSx} */
const codeModeWarningModalStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  highlighted: ({ palette }) => ({
    color: palette.warning.main,
    fontWeight: 500,
  }),
});

export default CodeModeWarningModal;
