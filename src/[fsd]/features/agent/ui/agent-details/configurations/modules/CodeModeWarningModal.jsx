import { memo, useMemo } from 'react';

import { Box, List, ListItem, Typography } from '@mui/material';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { Modal } from '@/[fsd]/shared/ui';
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
    <Modal.BaseModal
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
          <List
            disablePadding
            sx={styles.list}
          >
            {items.map(item => (
              <ListItem
                key={item.key}
                disableGutters
                sx={item.highlighted ? styles.highlighted : styles.item}
                data-testid={`agent-code-mode-limitation-${item.key}`}
              >
                <Typography
                  variant="bodyMedium"
                  color="inherit"
                >
                  {item.text}
                </Typography>
              </ListItem>
            ))}
          </List>
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
  list: {
    listStyleType: 'disc',
    paddingLeft: '1.25rem',
  },
  item: {
    display: 'list-item',
    padding: 0,
  },
  highlighted: ({ palette }) => ({
    display: 'list-item',
    padding: 0,
    color: palette.text.warning,
    fontWeight: 500,
  }),
});

export default CodeModeWarningModal;
