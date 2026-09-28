import { useCallback, useMemo, useRef, useState } from 'react';

import {
  useCreateChatTemplateMutation,
  useDeleteChatTemplateMutation,
  useGetChatTemplatesQuery,
  useSetDefaultChatTemplateMutation,
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
  const unsavedDirtyRef = useRef(false);
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

  const isBusy = isCreating || isUpdating || isDeleting || isSettingDefault;

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
      if (unsavedDirtyRef.current) {
        setPendingSelectId(nextId);
        setShowUnsavedDialog(true);
        return;
      }
      setIsNewDraft(false);
      setSelectedId(nextId);
    },
    [resolvedSelectedId],
  );

  const handleNewTemplate = useCallback(() => {
    if (unsavedDirtyRef.current) {
      setPendingSelectId('__new__');
      setShowUnsavedDialog(true);
      return;
    }
    openNewDraft();
  }, [openNewDraft]);

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
        unsavedDirtyRef.current = false;
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
      openNewDraft();
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
  };
};
