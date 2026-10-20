import { memo, useMemo } from 'react';

import { Box, Typography, useTheme } from '@mui/material';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Button, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import { toWarningItems } from '../lib/helpers';

const WarningIcon = ModalConstants.MODAL_ICONS[ModalConstants.MODAL_ICON_TYPE.warning];

// Shown after a save that succeeded with warnings; `warnings` is the raw list the schedule API returns
const SaveWarningsDialog = memo(({ open, warnings, onClose }) => {
  const { palette } = useTheme();
  const items = useMemo(() => toWarningItems(warnings), [warnings]);
  const styles = saveWarningsDialogStyles();

  return (
    <Modal.BaseModal
      open={open}
      variant={ModalConstants.MODAL_VARIANT.simple}
      title="Saved with warnings"
      titleIcon={ModalConstants.MODAL_ICON_TYPE.warning}
      onClose={onClose}
      sx={styles.modal}
      content={
        <Box sx={styles.list}>
          {items.map(({ label, text, target }, index) => (
            <Box
              key={`${label}-${target}-${index}`}
              data-testid="save-warning-item"
              sx={styles.item}
            >
              <WarningIcon style={styles.icon(palette.icon.warning)} />
              <Box sx={styles.itemText}>
                <Typography variant="labelMedium">{label}</Typography>
                <Typography
                  variant="bodyMedium"
                  color="text.secondary"
                >
                  {text}
                </Typography>
                {target && (
                  <Typography
                    variant="bodySmall"
                    color="text.secondary"
                  >
                    {target}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      }
      actions={
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          color={BUTTON_COLORS.primary}
          onClick={onClose}
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
  list: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  item: { display: 'flex', alignItems: 'flex-start', gap: '0.75rem' },
  // SVGR icon: plain style object, not sx.
  icon: color => ({ ...ModalConstants.MODAL_ICON_SIZE, flexShrink: 0, color }),
  itemText: { display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 },
});

export default SaveWarningsDialog;
