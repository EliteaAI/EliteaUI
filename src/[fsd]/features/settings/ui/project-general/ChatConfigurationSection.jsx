import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { useIsMidturnInjectionAvailable } from '@/[fsd]/features/chat/lib/hooks';
import {
  useCreateChatTemplateMutation,
  useDeleteChatTemplateMutation,
  useGetChatTemplatesQuery,
  useSetDefaultChatTemplateMutation,
  useUpdateChatTemplateMutation,
} from '@/[fsd]/features/settings/api/projectInfoApi';
import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { useProjectType } from '@/[fsd]/shared/lib/hooks/useProjectType.hooks';
import { Modal } from '@/[fsd]/shared/ui';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

import SettingsFormProvider from '../shared/SettingsFormProvider';
import ChatTemplateEditor from './ChatTemplateEditor';
import ChatTemplateList from './ChatTemplateList';
import MidturnInjection from './MidturnInjection';

const ChatConfigurationSection = memo(() => {
  const styles = chatConfigurationSectionStyles();

  const projectId = useSelectedProjectId();
  const { projectType } = useProjectType();
  const isMidturnAvailable = useIsMidturnInjectionAvailable();
  const { checkPermission } = useCheckPermission();
  const canEdit = checkPermission(PERMISSIONS.configuration.update);
  const { toastError, toastSuccess } = useToast();

  const nameFieldRef = useRef(null);

  const { data: templates = [], isLoading } = useGetChatTemplatesQuery({ projectId }, { skip: !projectId });

  const defaultTemplate = useMemo(() => templates.find(t => t.is_default), [templates]);

  const [selectedId, setSelectedId] = useState(null);
  const [pendingNewId, setPendingNewId] = useState(null);
  const unsavedDirtyRef = useRef(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingSelectId, setPendingSelectId] = useState(null);

  // Resolve which template is actually selected
  const resolvedSelectedId = useMemo(() => {
    if (selectedId !== null && templates.some(t => t.id === selectedId)) return selectedId;
    if (defaultTemplate) return defaultTemplate.id;
    return templates[0]?.id ?? null;
  }, [selectedId, templates, defaultTemplate]);

  const selectedTemplate = useMemo(
    () => templates.find(t => t.id === resolvedSelectedId) ?? null,
    [templates, resolvedSelectedId],
  );

  const [createTemplate, { isLoading: isCreating }] = useCreateChatTemplateMutation();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateChatTemplateMutation();
  const [deleteTemplate, { isLoading: isDeleting }] = useDeleteChatTemplateMutation();
  const [setDefaultTemplate, { isLoading: isSettingDefault }] = useSetDefaultChatTemplateMutation();

  const isBusy = isCreating || isUpdating || isDeleting || isSettingDefault;

  const getNextTemplateName = useCallback(() => {
    const names = new Set(templates.map(t => t.name.toLowerCase()));
    for (let i = 1; i <= 10; i++) {
      const candidate = `Template ${i}`;
      if (!names.has(candidate.toLowerCase())) return candidate;
    }
    return `Template ${templates.length + 1}`;
  }, [templates]);

  const handleSelectTemplate = useCallback(
    id => {
      if (id === resolvedSelectedId) return;
      if (unsavedDirtyRef.current) {
        setPendingSelectId(id);
        setShowUnsavedDialog(true);
        return;
      }
      setSelectedId(id);
    },
    [resolvedSelectedId],
  );

  const handleNewTemplate = useCallback(async () => {
    if (unsavedDirtyRef.current) {
      setPendingSelectId('__new__');
      setShowUnsavedDialog(true);
      return;
    }
    const name = getNextTemplateName();
    try {
      const result = await createTemplate({ projectId, name, participants: [] }).unwrap();
      const newId = result?.id ?? result?.template?.id ?? null;
      setSelectedId(newId);
      setPendingNewId(newId);
    } catch {
      toastError('Failed to create template');
    }
  }, [unsavedDirtyRef, getNextTemplateName, createTemplate, projectId, toastError]);

  // Focus name field after new template is created
  const handleEditorMounted = useCallback(() => {
    if (pendingNewId && nameFieldRef.current) {
      nameFieldRef.current.focus();
      nameFieldRef.current.select?.();
      setPendingNewId(null);
    }
  }, [pendingNewId]);

  const handleSave = useCallback(
    async ({ id, name, participants }) => {
      try {
        await updateTemplate({ projectId, templateId: id, name, participants }).unwrap();
        unsavedDirtyRef.current = false;
        toastSuccess('Template saved');
      } catch {
        toastError('Failed to save template');
      }
    },
    [projectId, updateTemplate, toastSuccess, toastError],
  );

  const handleDelete = useCallback(
    async id => {
      try {
        await deleteTemplate({ projectId, templateId: id }).unwrap();
        // After delete, fall back to default
        setSelectedId(null);
        toastSuccess('Template deleted');
      } catch {
        toastError('Failed to delete template');
      }
    },
    [projectId, deleteTemplate, toastSuccess, toastError],
  );

  const handleSetDefault = useCallback(
    async id => {
      try {
        await setDefaultTemplate({ projectId, templateId: id }).unwrap();
        toastSuccess('Default template updated');
      } catch {
        toastError('Failed to set default template');
      }
    },
    [projectId, setDefaultTemplate, toastSuccess, toastError],
  );

  const handleUnsavedDiscard = useCallback(() => {
    unsavedDirtyRef.current = false;
    setShowUnsavedDialog(false);
    if (pendingSelectId === '__new__') {
      setPendingSelectId(null);
      handleNewTemplate();
    } else if (pendingSelectId !== null) {
      setSelectedId(pendingSelectId);
      setPendingSelectId(null);
    }
  }, [pendingSelectId, handleNewTemplate]);

  const handleUnsavedCancel = useCallback(() => {
    setShowUnsavedDialog(false);
    setPendingSelectId(null);
  }, []);

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
        projectType={projectType}
      />

      {/* Template editor */}
      {selectedTemplate && (
        <ChatTemplateEditor
          key={selectedTemplate.id}
          template={selectedTemplate}
          allTemplates={templates}
          projectType={projectType}
          onSave={canEdit ? handleSave : undefined}
          onDelete={canEdit ? handleDelete : undefined}
          onSetDefault={canEdit ? handleSetDefault : undefined}
          isSaving={isBusy}
          nameFieldRef={nameFieldRef}
          onMounted={handleEditorMounted}
        />
      )}

      {/* Mid-turn input */}
      {isMidturnAvailable && <SettingsFormProvider FormContent={MidturnInjection} />}

      {/* Unsaved-changes confirmation */}
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
    padding: '1rem',
  },
  loading: {
    padding: '1rem',
  },
});

export default ChatConfigurationSection;
