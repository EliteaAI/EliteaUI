import { memo } from 'react';

import { Box } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import BaseModal from '@/[fsd]/shared/ui/modal/BaseModal';
import AttentionIcon from '@/components/Icons/AttentionIcon';

import DuplicateDialogContent from './DuplicateDialogContent';

const DuplicateResolutionDialog = memo(props => {
  const { open, duplicateFilenames, onCancel, onSkip, onReplace, onKeepBoth } = props;
  const styles = duplicateResolutionDialogStyles();

  return (
    <BaseModal
      open={open}
      onClose={onCancel}
      title="Resolve duplicates"
      hideSections
      sx={styles.modal}
      dialogSx={styles.content}
      titleIcon={
        <Box sx={styles.titleIcon}>
          <AttentionIcon
            fill="currentColor"
            width="1.5rem"
            height="1.5rem"
          />
        </Box>
      }
      content={<DuplicateDialogContent duplicateFilenames={duplicateFilenames} />}
      actions={
        <Box sx={styles.actions}>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.secondary}
            onClick={onCancel}
          >
            Cancel
          </Button.BaseBtn>
          <Box sx={styles.primaryActions}>
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.secondary}
              onClick={onSkip}
            >
              Skip
            </Button.BaseBtn>
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.secondary}
              onClick={onReplace}
            >
              Replace
            </Button.BaseBtn>
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.contained}
              onClick={onKeepBoth}
            >
              Keep both
            </Button.BaseBtn>
          </Box>
        </Box>
      }
    />
  );
});

DuplicateResolutionDialog.displayName = 'DuplicateResolutionDialog';

export default DuplicateResolutionDialog;

/** @type {MuiSx} */
const duplicateResolutionDialogStyles = () => ({
  modal: {
    '& .MuiDialog-paper': {
      width: '31.25rem !important',
      maxWidth: '31.25rem !important',
      maxHeight: 'calc(100dvh - 9rem) !important',
    },
    '& .MuiDialogActions-root': {
      width: '100%',
      alignSelf: 'stretch',
      justifyContent: 'flex-start',
    },
  },
  content: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    maxHeight: 'none !important',
    padding: '0.5rem 1.75rem !important',
    marginBottom: '0.75rem',
  },
  actions: {
    display: 'flex',
    width: '100%',
    gap: '0.75rem',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '0.5rem',
  },
  primaryActions: {
    display: 'flex',
    gap: '0.75rem',
    marginLeft: 'auto',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  titleIcon: ({ palette }) => ({
    color: palette.icon.fill.warning,
    fontSize: '2.5rem',
  }),
});
