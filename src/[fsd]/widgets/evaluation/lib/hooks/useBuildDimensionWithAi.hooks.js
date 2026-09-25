import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useCreateEvalDimensionMutation, useGenerateEvalDimensionsMutation } from '../../api';
import { BUILD_DIMENSION_STEPS } from '../constants';
import {
  buildDimensionApiBody,
  getDimensionFormFieldErrors,
  mapGeneratedDimensionToForm,
  parseEvalError,
} from '../helpers';

const hasFieldErrors = form => Object.keys(getDimensionFormFieldErrors(form)).length > 0;

export const useBuildDimensionWithAi = ({ open, onClose, onSaved, projectId, applicationId = null }) => {
  const [step, setStep] = useState(BUILD_DIMENSION_STEPS.input);
  const [prompt, setPrompt] = useState('');
  const [drafts, setDrafts] = useState([]);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState(null);
  const [showValidation, setShowValidation] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const generatePromiseRef = useRef(null);

  const [generateDimensions] = useGenerateEvalDimensionsMutation();
  const [createDimension] = useCreateEvalDimensionMutation();

  useEffect(() => {
    if (open) {
      setStep(BUILD_DIMENSION_STEPS.input);
      setPrompt('');
      setDrafts([]);
      setSelectedIds(new Set());
      setEditingId(null);
      setEditingForm(null);
      setShowValidation(false);
      setGenerateError(null);
      setSaveError('');
      setIsSaving(false);
    }
  }, [open]);

  const closeModal = useCallback(() => {
    if (generatePromiseRef.current) {
      generatePromiseRef.current.abort();
      generatePromiseRef.current = null;
    }
    onClose();
  }, [onClose]);

  // Creation requests cannot be cancelled, so the modal stays open until they settle. Letting it
  // close mid-save would let the late results land in (or close) a freshly reopened session.
  const handleClose = useCallback(() => {
    if (isSaving) return;
    closeModal();
  }, [isSaving, closeModal]);

  const handlePromptChange = useCallback(event => {
    setPrompt(event.target.value);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    setStep(BUILD_DIMENSION_STEPS.loading);
    setGenerateError(null);

    try {
      const promise = generateDimensions({
        projectId,
        body: {
          custom_instructions: prompt.trim(),
          application_id: applicationId,
        },
      });
      generatePromiseRef.current = promise;
      const result = await promise.unwrap();
      generatePromiseRef.current = null;

      const dims = result?.dimensions ?? (Array.isArray(result) ? result : [result]);
      setDrafts(
        dims.filter(Boolean).map((dim, index) => ({ id: index, form: mapGeneratedDimensionToForm(dim) })),
      );
      setSelectedIds(new Set());
      setSaveError('');
      setStep(BUILD_DIMENSION_STEPS.select);
    } catch (err) {
      generatePromiseRef.current = null;
      // An abort comes from closing the modal mid-generation; there is nothing to report.
      if (err?.name === 'AbortError') return;
      setGenerateError(err);
      setStep(BUILD_DIMENSION_STEPS.input);
    }
  }, [prompt, generateDimensions, projectId, applicationId]);

  const handleRefinePrompt = useCallback(() => {
    setStep(BUILD_DIMENSION_STEPS.input);
    setGenerateError(null);
    setSaveError('');
  }, []);

  const handleToggleSelect = useCallback(
    id => {
      if (isSaving) return;
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [isSaving],
  );

  const isAllSelected = drafts.length > 0 && drafts.every(draft => selectedIds.has(draft.id));
  const isIndeterminate = selectedIds.size > 0 && !isAllSelected;

  const handleToggleSelectAll = useCallback(() => {
    if (isSaving) return;
    setSelectedIds(isAllSelected ? new Set() : new Set(drafts.map(draft => draft.id)));
  }, [isSaving, isAllSelected, drafts]);

  const openDraft = useCallback(
    (id, withValidation = false) => {
      const draft = drafts.find(item => item.id === id);
      if (!draft) return;
      setEditingId(id);
      setEditingForm(draft.form);
      setShowValidation(withValidation);
      setStep(BUILD_DIMENSION_STEPS.review);
    },
    [drafts],
  );

  const handleOpenDraft = useCallback(
    id => {
      if (isSaving) return;
      openDraft(id);
    },
    [isSaving, openDraft],
  );

  const fieldErrors = useMemo(
    () => (editingForm ? getDimensionFormFieldErrors(editingForm) : {}),
    [editingForm],
  );
  const hasEditingErrors = Object.keys(fieldErrors).length > 0;

  // Selection is deliberately left alone here: going into a draft and back must not change it.
  const handleSaveDraftAndBack = useCallback(() => {
    if (hasEditingErrors) {
      setShowValidation(true);
      return;
    }
    setDrafts(prev => prev.map(draft => (draft.id === editingId ? { ...draft, form: editingForm } : draft)));
    setEditingId(null);
    setEditingForm(null);
    setShowValidation(false);
    setStep(BUILD_DIMENSION_STEPS.select);
  }, [hasEditingErrors, editingId, editingForm]);

  // Leaves the draft exactly as it was before it was opened; like saving, it keeps the selection.
  const handleBackToList = useCallback(() => {
    setEditingId(null);
    setEditingForm(null);
    setShowValidation(false);
    setStep(BUILD_DIMENSION_STEPS.select);
  }, []);

  const handleSaveSelected = useCallback(async () => {
    const selectedDrafts = drafts.filter(draft => selectedIds.has(draft.id));
    if (!selectedDrafts.length) return;

    // A draft the model left incomplete (e.g. no target) is opened so the author can see why it
    // cannot be created, rather than failing the whole batch on the server.
    const invalidDraft = selectedDrafts.find(draft => hasFieldErrors(draft.form));
    if (invalidDraft) {
      openDraft(invalidDraft.id, true);
      return;
    }

    setSaveError('');
    setIsSaving(true);

    const results = await Promise.allSettled(
      selectedDrafts.map(draft =>
        createDimension({ projectId, body: buildDimensionApiBody(draft.form, applicationId) }).unwrap(),
      ),
    );

    setIsSaving(false);

    const createdIds = new Set();
    const created = [];
    results.forEach((result, index) => {
      if (result.status !== 'fulfilled') return;
      const { id, form } = selectedDrafts[index];
      createdIds.add(id);
      created.push({ dimension: result.value, evidenceScope: form.evaluationTarget, engine: form.evaluator });
    });

    if (created.length) onSaved?.(created);

    const firstFailure = results.find(result => result.status === 'rejected');
    if (!firstFailure) {
      closeModal();
      return;
    }

    // Keep only what still needs attention so a retry does not create duplicates.
    setDrafts(prev => prev.filter(draft => !createdIds.has(draft.id)));
    setSelectedIds(prev => new Set([...prev].filter(id => !createdIds.has(id))));
    setSaveError(parseEvalError(firstFailure.reason, 'Failed to create dimension.'));
  }, [drafts, selectedIds, openDraft, createDimension, projectId, applicationId, onSaved, closeModal]);

  return {
    step,
    prompt,
    drafts,
    selectedIds,
    selectedCount: selectedIds.size,
    isAllSelected,
    isIndeterminate,
    editingForm,
    setEditingForm,
    fieldErrors,
    showValidation,
    hasEditingErrors,
    generateError,
    saveError,
    isSaving,
    handleClose,
    handlePromptChange,
    handleGenerate,
    handleRefinePrompt,
    handleToggleSelect,
    handleToggleSelectAll,
    handleOpenDraft,
    handleSaveDraftAndBack,
    handleBackToList,
    handleSaveSelected,
  };
};
