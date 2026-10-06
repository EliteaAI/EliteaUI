import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { useIsMidturnInjectionAvailable } from '@/[fsd]/features/chat/lib/hooks';
import { useChatTemplates } from '@/[fsd]/features/settings/lib/hooks';
import SettingsFormProvider from '@/[fsd]/features/settings/ui/shared/SettingsFormProvider';
import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { useProjectType } from '@/[fsd]/shared/lib/hooks/useProjectType.hooks';
import { Modal } from '@/[fsd]/shared/ui';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';
import useNavBlocker from '@/hooks/useNavBlocker';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import AutoRoutingSettings from './AutoRoutingSettings';
import ChatTemplateEditor from './ChatTemplateEditor';
import ChatTemplateList from './ChatTemplateList';
import MidturnInjection from './MidturnInjection';

const ChatConfigurationSection = memo(() => {
  const styles = chatConfigurationSectionStyles();

  const projectId = useSelectedProjectId();
  const { isTeam } = useProjectType();
  const isMidturnAvailable = useIsMidturnInjectionAvailable();
  const { checkPermission } = useCheckPermission();
  const canEdit = checkPermission(PERMISSIONS.configuration.update);

  const {
    templates,
    isLoading,
    selectedTemplate,
    isBusy,
    isDirty,
    setIsDirty,
    showUnsavedDialog,
    pendingNewId,
    setPendingNewId,
    draftKey,
    handleSelectTemplate,
    handleNewTemplate,
    handleClose,
    handleSave,
    handleDelete,
    handleUnsavedDiscard,
    handleUnsavedCancel,
  } = useChatTemplates(projectId);

  const blockOptions = useMemo(() => ({ blockCondition: isDirty }), [isDirty]);
  useNavBlocker(blockOptions);

  const nameFieldRef = useRef(null);

  const [templateToDelete, setTemplateToDelete] = useState(null);

  const handleDeleteCancel = useCallback(() => setTemplateToDelete(null), []);

  // Keep the dialog open while the request runs so its Delete button shows progress
  const handleDeleteConfirm = useCallback(async () => {
    const id = templateToDelete?.id;
    if (id == null) return;
    await handleDelete(id);
    setTemplateToDelete(null);
  }, [templateToDelete, handleDelete]);

  const handleEditorMounted = () => {
    if (pendingNewId && nameFieldRef.current) {
      nameFieldRef.current.focus();
      nameFieldRef.current.select?.();
      setPendingNewId(null);
    }
  };

  if (isLoading) {
    return (
      <Typography
        variant="bodySmall"
        color="text.secondary"
        sx={styles.loading}
      >
        Loading…
      </Typography>
    );
  }

  return (
    <Box sx={styles.root}>
      <ChatTemplateList
        templates={templates}
        canEdit={canEdit}
        onEdit={handleSelectTemplate}
        onDelete={canEdit ? setTemplateToDelete : undefined}
        onNewTemplate={canEdit ? handleNewTemplate : undefined}
        isTeamProject={isTeam}
      />

      {selectedTemplate && (
        <ChatTemplateEditor
          key={selectedTemplate.id ?? `new-${draftKey}`}
          template={selectedTemplate}
          allTemplates={templates}
          isTeamProject={isTeam}
          canEdit={canEdit}
          onSave={canEdit ? handleSave : undefined}
          onCancel={handleClose}
          onDirtyChange={setIsDirty}
          isSaving={isBusy}
          nameFieldRef={nameFieldRef}
          onMounted={handleEditorMounted}
        />
      )}

      {isMidturnAvailable && <SettingsFormProvider FormContent={MidturnInjection} />}

      <AutoRoutingSettings />

      <Modal.BaseModal
        open={!!templateToDelete}
        variant={ModalConstants.MODAL_VARIANT.simple}
        title="Delete template?"
        content={
          <Typography variant="bodySmall">
            &quot;{templateToDelete?.name}&quot; will be removed. Existing chats keep their participants.
            {templateToDelete?.is_default && ' New chats will start without a default template.'} This
            can&apos;t be undone.
          </Typography>
        }
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        confirming={isBusy}
        alarm
      />

      <Modal.BaseModal
        open={showUnsavedDialog}
        variant={ModalConstants.MODAL_VARIANT.simple}
        title="Unsaved changes"
        content={
          <Typography variant="bodySmall">
            You have unsaved changes in this template. Discard them?
          </Typography>
        }
        onClose={handleUnsavedCancel}
        onConfirm={handleUnsavedDiscard}
        confirmButtonText="Discard"
        cancelButtonText="Keep editing"
        alarm
      />
    </Box>
  );
});

ChatConfigurationSection.displayName = 'ChatConfigurationSection';

/** @type {MuiSx} */
const chatConfigurationSectionStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  loading: {
    padding: '1rem',
  },
});

export default ChatConfigurationSection;
