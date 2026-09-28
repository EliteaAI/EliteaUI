import { memo, useRef } from 'react';

import { Box, Typography } from '@mui/material';

import { useIsMidturnInjectionAvailable } from '@/[fsd]/features/chat/lib/hooks';
import { useChatTemplates } from '@/[fsd]/features/settings/lib/hooks';
import SettingsFormProvider from '@/[fsd]/features/settings/ui/shared/SettingsFormProvider';
import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { useProjectType } from '@/[fsd]/shared/lib/hooks/useProjectType.hooks';
import { Modal } from '@/[fsd]/shared/ui';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

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

  const nameFieldRef = useRef(null);

  const {
    templates,
    isLoading,
    selectedTemplate,
    resolvedSelectedId,
    isBusy,
    unsavedDirtyRef,
    showUnsavedDialog,
    pendingNewId,
    setPendingNewId,
    draftKey,
    handleSelectTemplate,
    handleNewTemplate,
    handleSave,
    handleDelete,
    handleSetDefault,
    handleUnsavedDiscard,
    handleUnsavedCancel,
  } = useChatTemplates(projectId);

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
        selectedId={resolvedSelectedId}
        onSelect={handleSelectTemplate}
        onNewTemplate={handleNewTemplate}
        isTeamProject={isTeam}
      />

      {selectedTemplate && (
        <ChatTemplateEditor
          key={selectedTemplate.id ?? `new-${draftKey}`}
          template={selectedTemplate}
          allTemplates={templates}
          isTeamProject={isTeam}
          onSave={canEdit ? handleSave : undefined}
          onDelete={canEdit ? handleDelete : undefined}
          onSetDefault={canEdit ? handleSetDefault : undefined}
          isSaving={isBusy}
          nameFieldRef={nameFieldRef}
          onMounted={handleEditorMounted}
          unsavedDirtyRef={unsavedDirtyRef}
        />
      )}

      {isMidturnAvailable && <SettingsFormProvider FormContent={MidturnInjection} />}

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
