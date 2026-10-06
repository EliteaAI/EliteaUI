import { useCallback, useMemo, useState } from 'react';

import {
  useCreateChatTemplateMutation,
  useDeleteChatTemplateMutation,
  useGetChatTemplatesQuery,
  useSetDefaultChatTemplateMutation,
  useUnsetDefaultChatTemplateMutation,
  useUpdateChatTemplateMutation,
} from '@/[fsd]/features/settings/api';
import useToast from '@/hooks/useToast';

export const useChatTemplates = projectId => {
  const { data: templates = [], isLoading } = useGetChatTemplatesQuery({ projectId }, { skip: !projectId });

  const [selectedId, setSelectedId] = useState(null);
  const [isNewDraft, setIsNewDraft] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftKey, setDraftKey] = useState(0);
  const [pendingNewId, setPendingNewId] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingSelectId, setPendingSelectId] = useState(null);

  const resolvedSelectedId = useMemo(() => {
    if (isNewDraft) return null;
    if (selectedId !== null && templates.some(t => t.id === selectedId)) return selectedId;
    return null;
  }, [isNewDraft, selectedId, templates]);

  const getNextTemplateName = useCallback(() => {
    const names = new Set(templates.map(t => t.name.toLowerCase()));
    for (let i = 1; i <= 10; i++) {
      const candidate = `Template ${i}`;
      if (!names.has(candidate.toLowerCase())) return candidate;
    }
    return `Template ${templates.length + 1}`;
  }, [templates]);

  const newDraftTemplate = useMemo(
    () => (isNewDraft ? { id: null, name: draftName, participants: [] } : null),
    [isNewDraft, draftName],
  );

  const selectedTemplate = useMemo(() => {
    if (isNewDraft) return newDraftTemplate;
    if (resolvedSelectedId !== null) return templates.find(t => t.id === resolvedSelectedId) ?? null;
    return null;
  }, [isNewDraft, newDraftTemplate, resolvedSelectedId, templates]);

  const [createTemplate, { isLoading: isCreating }] = useCreateChatTemplateMutation();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateChatTemplateMutation();
  const [deleteTemplate, { isLoading: isDeleting }] = useDeleteChatTemplateMutation();
  const [setDefaultTemplate, { isLoading: isSettingDefault }] = useSetDefaultChatTemplateMutation();
  const [unsetDefaultTemplate, { isLoading: isUnsettingDefault }] = useUnsetDefaultChatTemplateMutation();

  const isBusy = isCreating || isUpdating || isDeleting || isSettingDefault || isUnsettingDefault;

  const { toastError, toastSuccess } = useToast();

  const openNewDraft = useCallback(() => {
    setDraftName(getNextTemplateName());
    setDraftKey(k => k + 1);
    setIsNewDraft(true);
    setSelectedId(null);
    setPendingNewId('__new__');
  }, [getNextTemplateName]);

  const handleSelectTemplate = useCallback(
    id => {
      if (isDirty) {
        setPendingSelectId(id);
        setShowUnsavedDialog(true);
        return;
      }
      setIsNewDraft(false);
      setSelectedId(id);
    },
    [isDirty],
  );

  const handleNewTemplate = useCallback(() => {
    if (isDirty) {
      setPendingSelectId('__new__');
      setShowUnsavedDialog(true);
      return;
    }
    openNewDraft();
  }, [openNewDraft, isDirty]);

  const handleClose = useCallback(() => {
    if (isDirty) {
      setPendingSelectId('__close__');
      setShowUnsavedDialog(true);
      return;
    }
    setIsNewDraft(false);
    setSelectedId(null);
  }, [isDirty]);

  const closeEditor = useCallback(() => {
    setIsDirty(false);
    setIsNewDraft(false);
    setSelectedId(null);
  }, []);

  const handleSave = useCallback(
    async ({ id, name, participants, isDefault }) => {
      let templateId = id;
      const wasDefault = templates.find(t => t.id === id)?.is_default ?? false;
      try {
        if (id === null) {
          const result = await createTemplate({ projectId, name, participants }).unwrap();
          templateId = result?.id ?? result?.template?.id ?? null;
        } else {
          await updateTemplate({ projectId, templateId: id, name, participants }).unwrap();
        }
      } catch {
        toastError('Failed to save template');
        return;
      }

      // The template itself is already persisted at this point, so the editor closes even if the
      // default flag fails to update — re-saving a created draft would otherwise duplicate it.
      closeEditor();
      const defaultFailedMessage = 'Template saved, but failed to update the default template';
      if (!!isDefault === wasDefault) {
        toastSuccess('Template saved');
        return;
      }
      // An unexpected create response without an id leaves nothing to mark as default
      if (templateId === null) {
        toastError(defaultFailedMessage);
        return;
      }
      try {
        const toggleDefault = isDefault ? setDefaultTemplate : unsetDefaultTemplate;
        await toggleDefault({ projectId, templateId }).unwrap();
        toastSuccess('Template saved');
      } catch {
        toastError(defaultFailedMessage);
      }
    },
    [
      projectId,
      templates,
      createTemplate,
      updateTemplate,
      setDefaultTemplate,
      unsetDefaultTemplate,
      closeEditor,
      toastSuccess,
      toastError,
    ],
  );

  const handleDelete = useCallback(
    async id => {
      try {
        await deleteTemplate({ projectId, templateId: id }).unwrap();
        closeEditor();
        toastSuccess('Template deleted');
      } catch {
        toastError('Failed to delete template');
      }
    },
    [projectId, deleteTemplate, closeEditor, toastSuccess, toastError],
  );

  const handleUnsavedDiscard = useCallback(() => {
    setIsDirty(false);
    setShowUnsavedDialog(false);
    if (pendingSelectId === '__new__') {
      setPendingSelectId(null);
      openNewDraft();
    } else if (pendingSelectId === '__close__') {
      setPendingSelectId(null);
      setIsNewDraft(false);
      setSelectedId(null);
    } else if (pendingSelectId !== null) {
      setIsNewDraft(false);
      setSelectedId(pendingSelectId);
      setPendingSelectId(null);
    }
  }, [pendingSelectId, openNewDraft]);

  const handleUnsavedCancel = useCallback(() => {
    setShowUnsavedDialog(false);
    setPendingSelectId(null);
  }, []);

  return {
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
  };
};
