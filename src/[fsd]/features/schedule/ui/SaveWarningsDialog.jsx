import { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { Box, List, ListItem, Typography } from '@mui/material';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Button, Modal } from '@/[fsd]/shared/ui';
import { BannerMessage } from '@/[fsd]/shared/ui/banner-message';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import { toWarningItems } from '../lib/helpers';

// Shown after a save that succeeded with warnings or with a changed approval rule;
// `warnings` is the raw list the schedule API returns, `note` an extra line above them
const SaveWarningsDialog = memo(props => {
  const { open, warnings, note, onClose } = props;
  const items = useMemo(() => toWarningItems(warnings), [warnings]);
  const closed = useRef(false);
  const styles = saveWarningsDialogStyles();

  useEffect(() => {
    closed.current = false;
  }, [open]);

  // OK, Escape and the backdrop all land here; the caller sees one close
  const handleClose = useCallback(() => {
    if (closed.current) return;
    closed.current = true;
    onClose();
  }, [onClose]);

  return (
    <Modal.BaseModal
      open={open}
      variant={ModalConstants.MODAL_VARIANT.simple}
      title="Saved with warnings"
      titleIcon={ModalConstants.MODAL_ICON_TYPE.warning}
      onClose={handleClose}
      sx={styles.modal}
      content={
        <Box sx={styles.content}>
          {note && <Typography variant="bodyMedium">{note}</Typography>}
          {items.length > 0 && (
            <List sx={styles.list}>
              {items.map(({ label, text, target }, index) => (
                <ListItem
                  key={index}
                  disablePadding
                  data-testid="save-warning-item"
                >
                  <BannerMessage variant="warning">
                    <Box sx={styles.itemText}>
                      <Typography variant="labelMedium">{label}</Typography>
                      <Typography variant="bodyMedium">{text}</Typography>
                      {target && <Typography variant="bodySmall">{target}</Typography>}
                    </Box>
                  </BannerMessage>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      }
      actions={
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          color={BUTTON_COLORS.primary}
          onClick={handleClose}
          autoFocus
        >
          OK
        </Button.BaseBtn>
      }
    />
  );
});

SaveWarningsDialog.displayName = 'SaveWarningsDialog';

/** @type {MuiSx} */
const saveWarningsDialogStyles = () => ({
  modal: { width: '30rem' },
  content: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  list: { padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  itemText: { display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 },
});

export default SaveWarningsDialog;
