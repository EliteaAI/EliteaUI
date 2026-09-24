import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, Typography, useTheme } from '@mui/material';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Button, Input, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { INPUT_VARIANTS } from '@/[fsd]/shared/ui/input';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import StarIcon from '@/components/Icons/StarIcon';

import ChatInfoPopover from './ChatInfoPopover';
import ChatParticipantPicker from './ChatParticipantPicker';

const ChatTemplateEditor = memo(props => {
  const {
    template,
    allTemplates = [],
    projectType,
    onSave,
    onDelete,
    onSetDefault,
    isSaving = false,
    nameFieldRef,
    onMounted,
  } = props;

  const theme = useTheme();
  const styles = chatTemplateEditorStyles();

  const [name, setName] = useState(template?.name ?? '');
  const [participants, setParticipants] = useState(template?.participants ?? []);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Reset local state when selected template changes (intentionally keyed on id only)
  useEffect(() => {
    setName(template?.name ?? '');
    setParticipants(template?.participants ?? []);
  }, [template?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify parent once after mount (used to focus the name field on new templates)
  useEffect(() => {
    onMounted?.();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const savedName = useMemo(() => template?.name ?? '', [template?.name]);
  const savedParticipants = useMemo(() => template?.participants ?? [], [template?.participants]);
  const isDefault = template?.is_default ?? false;

  const isTeamProject = projectType === 'team';

  const nameError = useMemo(() => {
    const trimmed = name.trim();
    if (!trimmed) return 'Enter a template name.';
    if (trimmed.length > 64) return 'Name must be 64 characters or fewer.';
    const isDuplicate = allTemplates.some(
      t => t.id !== template?.id && t.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (isDuplicate) return 'A template with this name already exists.';
    return null;
  }, [name, allTemplates, template?.id]);

  const isDirty = useMemo(() => {
    if (name.trim() !== savedName.trim()) return true;
    if (participants.length !== savedParticipants.length) return true;
    const savedKeys = new Set(savedParticipants.map(p => `${p.entity_name}:${p.id}`));
    return participants.some(p => !savedKeys.has(`${p.entity_name}:${p.id}`));
  }, [name, savedName, participants, savedParticipants]);

  const canSave = isDirty && !nameError;

  const handleSave = useCallback(() => {
    if (!canSave || isSaving) return;
    onSave?.({ id: template?.id, name: name.trim(), participants });
  }, [canSave, isSaving, onSave, template?.id, name, participants]);

  const handleCancel = useCallback(() => {
    setName(savedName);
    setParticipants(savedParticipants);
  }, [savedName, savedParticipants]);

  const handleSetDefault = useCallback(() => {
    onSetDefault?.(template?.id);
  }, [onSetDefault, template?.id]);

  const handleDeleteConfirm = useCallback(() => {
    setShowDeleteDialog(false);
    onDelete?.(template?.id);
  }, [onDelete, template?.id]);

  const handleDeleteCancel = useCallback(() => setShowDeleteDialog(false), []);

  if (!template) {
    return (
      <Typography
        variant="bodySmall"
        color="text.secondary"
        sx={styles.empty}
      >
        Select a template to edit it.
      </Typography>
    );
  }

  return (
    <Box sx={styles.root}>
      {/* Name + action row */}
      <Box sx={styles.nameRow}>
        <Box sx={styles.nameField}>
          <Input.InputBase
            inputRef={nameFieldRef}
            label="Template name"
            value={name}
            onChange={e => setName(e.target.value)}
            variant={INPUT_VARIANTS.standard}
            error={!!nameError && name !== savedName}
            helperText={name !== savedName && nameError ? nameError : undefined}
            disabled={isSaving}
            fullWidth
            inputProps={{ maxLength: 64 }}
          />
        </Box>

        <Box sx={styles.actions}>
          {!isDefault && (
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.secondary}
              onClick={handleSetDefault}
              disabled={isSaving}
              startIcon={<StarIcon fill={theme.palette.icon.default} />}
              title="Set as default"
            >
              Set as default
            </Button.BaseBtn>
          )}
          {!isDefault && (
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.tertiary}
              onClick={() => setShowDeleteDialog(true)}
              disabled={isSaving}
              aria-label="Delete template"
              title="Delete template"
            >
              <DeleteIcon fill={theme.palette.icon.default} />
            </Button.BaseBtn>
          )}
        </Box>
      </Box>

      {/* Participants */}
      <Box sx={styles.section}>
        <Box sx={styles.sectionHeader}>
          <Typography
            variant="labelSmall"
            color="text.secondary"
          >
            Pre-configured participants
          </Typography>
          <ChatInfoPopover
            type="participants"
            projectType={projectType}
          />
        </Box>

        <ChatParticipantPicker
          participants={participants}
          onChange={setParticipants}
          isTeamProject={isTeamProject}
          disabled={isSaving}
        />
      </Box>

      {/* Save / Cancel */}
      <Box sx={styles.saveRow}>
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.secondary}
          onClick={handleCancel}
          disabled={!isDirty || isSaving}
        >
          Cancel
        </Button.BaseBtn>
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          onClick={handleSave}
          disabled={!canSave}
          loading={isSaving}
        >
          Save
        </Button.BaseBtn>
      </Box>

      {/* Delete confirmation dialog */}
      <Modal.BaseModal
        open={showDeleteDialog}
        variant={ModalConstants.MODAL_VARIANT.simple}
        title="Delete template?"
        content={
          <Typography variant="bodySmall">
            &quot;{template.name}&quot; will be removed. Existing chats keep their participants. This
            can&apos;t be undone.
          </Typography>
        }
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        alarm
      />
    </Box>
  );
});

ChatTemplateEditor.displayName = 'ChatTemplateEditor';

/** @type {MuiSx} */
const chatTemplateEditorStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.75rem',
    backgroundColor: palette.background.default.secondary,
  }),
  empty: {
    padding: '1rem 0',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
  },
  nameField: {
    flex: 1,
    minWidth: 0,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    paddingTop: '1.5rem',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
  saveRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.5rem',
  },
});

export default ChatTemplateEditor;
