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
      const nextId = id === resolvedSelectedId ? null : id;
      if (isDirty) {
        setPendingSelectId(nextId);
        setShowUnsavedDialog(true);
        return;
      }
      setIsNewDraft(false);
      setSelectedId(nextId);
    },
    [resolvedSelectedId, isDirty],
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

  const handleSave = useCallback(
    async ({ id, name, participants }) => {
      try {
        if (id === null) {
          const result = await createTemplate({ projectId, name, participants }).unwrap();
          const newId = result?.id ?? result?.template?.id ?? null;
          setIsNewDraft(false);
          setSelectedId(newId);
        } else {
          await updateTemplate({ projectId, templateId: id, name, participants }).unwrap();
        }
        setIsDirty(false);
        toastSuccess('Template saved');
      } catch {
        toastError('Failed to save template');
      }
    },
    [projectId, createTemplate, updateTemplate, toastSuccess, toastError],
  );

  const handleDelete = useCallback(
    async id => {
      try {
        await deleteTemplate({ projectId, templateId: id }).unwrap();
        setIsDirty(false);
        setIsNewDraft(false);
        const defaultTemplate = templates.find(t => t.is_default && t.id !== id);
        setSelectedId(defaultTemplate?.id ?? null);
        toastSuccess('Template deleted');
      } catch {
        toastError('Failed to delete template');
      }
    },
    [projectId, templates, deleteTemplate, toastSuccess, toastError],
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

  const handleUnsetDefault = useCallback(
    async id => {
      try {
        await unsetDefaultTemplate({ projectId, templateId: id }).unwrap();
        toastSuccess('Default template removed');
      } catch {
        toastError('Failed to unset default template');
      }
    },
    [projectId, unsetDefaultTemplate, toastSuccess, toastError],
  );

  // Discard unsaved draft/edits and close the editor; saved data is untouched
  const handleCancelEdit = useCallback(() => {
    unsavedDirtyRef.current = false;
    setIsNewDraft(false);
    setSelectedId(null);
  }, []);

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
    resolvedSelectedId,
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
    handleSetDefault,
    handleUnsetDefault,
    handleCancelEdit,
    handleUnsavedDiscard,
    handleUnsavedCancel,
  };
};
