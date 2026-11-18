import { memo, useCallback, useEffect, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { isPathInFolder, pathsOverlap } from '@/[fsd]/features/skill/lib/helpers';
import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Button, Input, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

const validatePath = (path, currentPath, isFolder, takenPaths) => {
  if (!path) return 'The path cannot be empty';
  if (path === currentPath) return 'The new path must differ from the current one';
  if (path.startsWith('/') || path.endsWith('/') || path.split('/').includes('..'))
    return 'Use a path inside the skill, such as references/guide.md';
  const otherPaths = takenPaths.filter(taken =>
    isFolder ? !isPathInFolder(taken, currentPath) : taken !== currentPath,
  );
  if (otherPaths.some(taken => pathsOverlap(path, taken)))
    return 'A file or folder with this path already exists';
  return '';
};

/** Rename a skill file or folder by editing its whole path, so it can also move between folders. */
const SkillFileRenameDialog = memo(props => {
  const { open, path, isFolder = false, takenPaths = [], isLoading = false, onClose, onConfirm } = props;
  const [value, setValue] = useState(path || '');
  const [error, setError] = useState('');
  const styles = skillFileRenameDialogStyles();

  useEffect(() => {
    if (!open) return;
    setValue(path || '');
    setError('');
  }, [open, path]);

  const onChange = useCallback(event => {
    setValue(event.target.value);
    setError('');
  }, []);

  const onSubmit = useCallback(() => {
    const newPath = value.trim().replace(/^(\.\/)+/, '');
    const problem = validatePath(newPath, path, isFolder, takenPaths);
    if (problem) {
      setError(problem);
      return;
    }
    onConfirm(newPath);
  }, [isFolder, onConfirm, path, takenPaths, value]);

  const onKeyDown = useCallback(
    event => {
      if (event.key === 'Enter' && !isLoading) onSubmit();
    },
    [isLoading, onSubmit],
  );

  return (
    <Modal.BaseModal
      open={open}
      variant={ModalConstants.MODAL_VARIANT.simple}
      title={isFolder ? 'Rename folder' : 'Rename file'}
      onClose={onClose}
      sx={styles.modal}
      data-testid="skill-file-rename-dialog"
      content={
        <Box sx={styles.content}>
          <Typography
            variant="bodyMedium"
            sx={styles.label}
          >
            {isFolder ? 'New folder path:' : 'New file path:'}
          </Typography>
          <Input.InputBase
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            autoFocus
            error={Boolean(error)}
            helperText={error}
            disabled={isLoading}
            fullWidth
            inputProps={{ 'data-testid': 'skill-file-rename-input' }}
          />
        </Box>
      }
      actions={
        <Box sx={styles.actions}>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.tertiary}
            color={BUTTON_COLORS.secondary}
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button.BaseBtn>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.primary}
            onClick={onSubmit}
            disabled={isLoading || !value.trim()}
            data-testid="skill-file-rename-confirm"
          >
            {isLoading ? 'Renaming...' : 'Rename'}
          </Button.BaseBtn>
        </Box>
      }
    />
  );
});

SkillFileRenameDialog.displayName = 'SkillFileRenameDialog';

/** @type {MuiSx} */
const skillFileRenameDialogStyles = () => ({
  modal: {
    width: '28rem',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  label: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.5rem',
    marginTop: '1rem',
  },
});

export default SkillFileRenameDialog;
