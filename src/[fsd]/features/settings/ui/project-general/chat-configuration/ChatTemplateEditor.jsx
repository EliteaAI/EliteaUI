import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, FormControlLabel, Typography } from '@mui/material';

import { ChatParticipantHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { useDropdownAwareModalClose } from '@/[fsd]/shared/lib/hooks';
import { Button, Checkbox, Input, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { INPUT_VARIANTS } from '@/[fsd]/shared/ui/input';
import { InfoTooltip } from '@/[fsd]/shared/ui/tooltip';

import ChatParticipantPicker from './ChatParticipantPicker';

const ChatTemplateEditor = memo(props => {
  const {
    template,
    allTemplates = [],
    isTeamProject,
    canEdit = true,
    onSave,
    onDirtyChange,
    onCancel,
    isSaving = false,
    nameFieldRef,
    onMounted,
  } = props;

  const styles = chatTemplateEditorStyles();

  const savedName = template?.name ?? '';
  const savedParticipants = useMemo(() => template?.participants ?? [], [template?.participants]);
  const savedIsDefault = template?.is_default ?? false;
  // Unsaved drafts have no id yet
  const isSaved = template?.id != null;

  const [name, setName] = useState(savedName);
  const [participants, setParticipants] = useState(savedParticipants);
  const [isDefault, setIsDefault] = useState(savedIsDefault);

  // Notify parent once after mount (used to focus the name field on new templates)
  useEffect(() => {
    onMounted?.();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (isDefault !== savedIsDefault) return true;
    if (participants.length !== savedParticipants.length) return true;
    const savedKeys = new Set(savedParticipants.map(ChatParticipantHelpers.getTemplateParticipantKey));
    return participants.some(p => !savedKeys.has(ChatParticipantHelpers.getTemplateParticipantKey(p)));
  }, [name, savedName, isDefault, savedIsDefault, participants, savedParticipants]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
    return () => onDirtyChange?.(false);
  }, [isDirty, onDirtyChange]);

  const canSave = (isDirty || !isSaved) && !nameError;

  const handleNameChange = useCallback(event => setName(event.target.value), []);

  const handleDefaultChange = useCallback(event => setIsDefault(event.target.checked), []);

  const handleSave = useCallback(() => {
    if (!canSave || isSaving) return;
    onSave?.({ id: template?.id ?? null, name: name.trim(), participants, isDefault });
  }, [canSave, isSaving, onSave, template?.id, name, participants, isDefault]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const { handleClose, scopeRef } = useDropdownAwareModalClose(true, handleCancel);

  if (!template) return null;

  // Users without edit permission open the same modal read-only
  const editTitle = canEdit ? 'Edit Template' : 'View Template';

  const content = (
    <Box
      ref={scopeRef}
      sx={styles.content}
    >
      <Input.InputBase
        inputRef={nameFieldRef}
        label="Name"
        required
        value={name}
        onChange={handleNameChange}
        variant={INPUT_VARIANTS.standard}
        error={!!nameError && name !== savedName}
        helperText={name !== savedName && nameError ? nameError : undefined}
        disabled={isSaving || !canEdit}
        fullWidth
        inputProps={{ maxLength: 64, 'data-testid': 'chat-template-name-input' }}
      />

      <FormControlLabel
        label={
          <Typography
            variant="bodyMedium"
            color="text.secondary"
          >
            Set as default
          </Typography>
        }
        control={
          <Checkbox.BaseCheckbox
            checked={isDefault}
            onChange={handleDefaultChange}
            disabled={isSaving || !canEdit}
            data-testid="chat-template-default-checkbox"
          />
        }
        sx={styles.defaultCheckbox}
      />

      <Box sx={styles.section}>
        <Box sx={styles.sectionHeader}>
          <Typography
            variant="subtitle"
            color="text.primary"
          >
            Participants
          </Typography>
          <InfoTooltip
            infoTooltip={
              isTeamProject
                ? 'These participants join every new chat created from this template. You can add **agents, pipelines, toolkits, MCPs, skills, and teammates**. If you add exactly one, it becomes the **active participant**, so your messages go to it directly.'
                : 'These participants join every new chat created from this template. You can add **agents, pipelines, toolkits, MCPs, and skills**. If you add exactly one, it becomes the **active participant**, so your messages go to it directly.'
            }
          />
        </Box>

        <ChatParticipantPicker
          participants={participants}
          onChange={setParticipants}
          isTeamProject={isTeamProject}
          disabled={isSaving || !canEdit}
        />
      </Box>
    </Box>
  );

  const actions = (
    <>
      <Button.BaseBtn
        variant={BUTTON_VARIANTS.elitea}
        color={BUTTON_COLORS.secondary}
        onClick={handleCancel}
        disabled={isSaving}
      >
        {canEdit ? 'Cancel' : 'Close'}
      </Button.BaseBtn>
      {canEdit && (
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          color={BUTTON_COLORS.primary}
          onClick={handleSave}
          disabled={!canSave}
          loading={isSaving}
          data-testid="chat-template-save-button"
        >
          Save
        </Button.BaseBtn>
      )}
    </>
  );

  return (
    <Modal.BaseModal
      open
      title={isSaved ? editTitle : 'Create Template'}
      onClose={handleClose}
      content={content}
      actions={actions}
      dialogSx={styles.dialogContent}
      data-testid="chat-template-modal"
      closeButtonTestId="chat-template-close-button"
    />
  );
});

ChatTemplateEditor.displayName = 'ChatTemplateEditor';

/** @type {MuiSx} */
const chatTemplateEditorStyles = () => ({
  dialogContent: {
    padding: '0.5rem 1.5rem 1.5rem !important',
    // Avoid BaseModal's always-visible scrollbar; the participants dropdown renders in a popper
    overflowY: 'auto',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  defaultCheckbox: {
    height: '2.5rem',
    margin: 0,
    padding: '0.5rem 0.75rem',
    gap: '0.75rem',
    alignSelf: 'stretch',
    boxSizing: 'border-box',
    '& .MuiCheckbox-root': {
      padding: 0,
    },
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
    padding: '1rem 0.75rem 0',
  },
});

export default ChatTemplateEditor;
