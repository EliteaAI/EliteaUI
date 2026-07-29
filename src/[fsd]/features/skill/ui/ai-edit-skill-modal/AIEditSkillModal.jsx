import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { useFormikContext } from 'formik';
import { flushSync } from 'react-dom';

import {
  EditEntityGeneralStep,
  EditEntityInstructionsStep,
  EditEntityModal,
} from '@/[fsd]/entities/edit-entity-with-ai';
import { useGenerateSkillDraftMutation, useSkillUpdateMutation } from '@/[fsd]/features/skill/api';
import { EDIT_STEP_KEYS, SKILL_NAME_MAX_LENGTH } from '@/[fsd]/features/skill/lib/constants';
import { SkillAIEditionStepsHelpers } from '@/[fsd]/features/skill/lib/helpers';
import { useSaveSkill, useSaveSkillVersion } from '@/[fsd]/features/skill/lib/hooks';
import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Input, Modal } from '@/[fsd]/shared/ui';
import { MAX_INSTRUCTIONS_LENGTH } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

import { SummaryStep } from './steps';

const DEFAULT_FIELD_FLAGS = { name: true, description: true, instructions: true };

const AIEditSkillModal = memo(props => {
  const { open, onClose } = props;

  const currentDataRef = useRef(null);
  const pendingDraftDataRef = useRef(null);
  const saveSkillRef = useRef(null);
  const onCreateNewVersionRef = useRef(null);

  const formik = useFormikContext();
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();

  const [generateDraft, { error: generateError, reset: resetGenerate }] = useGenerateSkillDraftMutation();
  const [updateSkill] = useSkillUpdateMutation();
  // Save hooks close over formik values, so a handler must call the ref (refreshed each
  // render), not its own captured closure, to see values applied via flushSync.
  const { onSave: saveSkill } = useSaveSkill();
  const { onCreateNewVersion } = useSaveSkillVersion();
  saveSkillRef.current = saveSkill;
  onCreateNewVersionRef.current = onCreateNewVersion;

  const [steps, setSteps] = useState([]);
  const [fieldApplyFlags, setFieldApplyFlags] = useState(DEFAULT_FIELD_FLAGS);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionName, setVersionName] = useState('');
  const [isSavingAsVersion, setIsSavingAsVersion] = useState(false);

  useEffect(() => {
    if (!open) {
      setSteps([]);
      setFieldApplyFlags(DEFAULT_FIELD_FLAGS);
      setShowVersionModal(false);
      setVersionName('');
      setIsSavingAsVersion(false);
      currentDataRef.current = null;
      pendingDraftDataRef.current = null;
    }
  }, [open]);

  const handleGenerate = useCallback(
    description => {
      currentDataRef.current = structuredClone(formik.values);

      return generateDraft({
        projectId,
        user_description: description,
        skill_id: formik.values.id ?? undefined,
        version_id: formik.values.version_details?.id ?? undefined,
      });
    },
    [generateDraft, projectId, formik.values],
  );

  const handleDraftGenerated = useCallback(draftData => {
    setSteps(SkillAIEditionStepsHelpers.computeVisibleSteps(currentDataRef.current, draftData));
    setFieldApplyFlags({ ...DEFAULT_FIELD_FLAGS });
    return draftData;
  }, []);

  const handleToggleField = useCallback(field => {
    setFieldApplyFlags(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const applyFieldChanges = useCallback(
    draftData => {
      if (fieldApplyFlags.name) formik.setFieldValue('name', (draftData.name || '').trim());
      if (fieldApplyFlags.description) formik.setFieldValue('description', draftData.description || '');
      if (fieldApplyFlags.instructions)
        formik.setFieldValue('version_details.instructions', draftData.instructions || '');
    },
    [fieldApplyFlags, formik],
  );

  const handleSave = useCallback(
    async draftData => {
      if (!draftData) return;
      flushSync(() => {
        applyFieldChanges(draftData);
      });
      const ok = await saveSkillRef.current();
      if (!ok) throw new Error('Skill save failed');
    },
    [applyFieldChanges],
  );

  const handleSaveAsVersionClick = useCallback(draftData => {
    pendingDraftDataRef.current = draftData;
    setShowVersionModal(true);
  }, []);

  const handleConfirmVersion = useCallback(async () => {
    const trimmedName = versionName.trim();
    if (!trimmedName) return;

    const versions = formik.values.versions || [];
    if (versions.find(v => v.name === trimmedName)) {
      toastError('A version with that name already exists. Please pick a unique name.');
      return;
    }

    const draftData = pendingDraftDataRef.current;
    if (!draftData) return;

    setIsSavingAsVersion(true);

    try {
      // Name/description are skill-level; persist them directly, not via useSaveSkill, which
      // would also overwrite the current version's instructions.
      if (fieldApplyFlags.name || fieldApplyFlags.description) {
        try {
          await updateSkill({
            projectId,
            skillId: formik.values.id,
            name: (fieldApplyFlags.name ? draftData.name || '' : formik.values.name || '').trim(),
            description: fieldApplyFlags.description
              ? draftData.description || ''
              : formik.values.description || '',
          }).unwrap();
        } catch (e) {
          toastError(buildErrorMessage(e));
          setIsSavingAsVersion(false);
          return;
        }
      }

      flushSync(() => {
        if (fieldApplyFlags.instructions)
          formik.setFieldValue('version_details.instructions', draftData.instructions || '');
      });

      const created = await onCreateNewVersionRef.current(trimmedName);

      if (created) {
        setShowVersionModal(false);
        setVersionName('');
        pendingDraftDataRef.current = null;
        onClose();
      } else {
        setIsSavingAsVersion(false);
      }
    } catch {
      setIsSavingAsVersion(false);
    }
  }, [versionName, formik, toastError, fieldApplyFlags, onClose, projectId, updateSkill]);

  const handleCancelVersion = useCallback(() => {
    setShowVersionModal(false);
    setVersionName('');
    pendingDraftDataRef.current = null;
  }, []);

  const handleVersionKeyDown = useCallback(
    e => {
      if (e.key === 'Enter' && versionName.trim()) {
        e.preventDefault();
        handleConfirmVersion();
      }
    },
    [versionName, handleConfirmVersion],
  );

  const currentData = currentDataRef.current || formik.values;

  const renderStep = useCallback(
    (stepKey, draftData, setDraftData) => {
      const stepProps = {
        currentData,
        draftData,
        onDraftChange: newDraft => setDraftData(newDraft),
        fieldApplyFlags,
        onToggleField: handleToggleField,
      };

      switch (stepKey) {
        case EDIT_STEP_KEYS.GENERAL:
          return (
            <EditEntityGeneralStep
              {...stepProps}
              nameMaxLength={SKILL_NAME_MAX_LENGTH}
            />
          );
        case EDIT_STEP_KEYS.INSTRUCTIONS:
          return (
            <EditEntityInstructionsStep
              {...stepProps}
              maxLength={MAX_INSTRUCTIONS_LENGTH}
            />
          );
        case EDIT_STEP_KEYS.SUMMARY:
          return <SummaryStep {...stepProps} />;
        default:
          return null;
      }
    },
    [currentData, fieldApplyFlags, handleToggleField],
  );

  return (
    <>
      <EditEntityModal
        open={open}
        onClose={onClose}
        entityLabel="skill"
        placeholder="Describe the changes you'd like to make to the skill. AI can help update its name, description, and instructions."
        onGenerate={handleGenerate}
        generateError={generateError}
        resetGenerate={resetGenerate}
        onDraftGenerated={handleDraftGenerated}
        steps={steps}
        renderStep={renderStep}
        onSave={handleSave}
        onSaveAsVersion={handleSaveAsVersionClick}
        isSavingAsVersion={isSavingAsVersion}
        saveLabel="Save"
        savingLabel="Saving..."
        modalTestId="ai-edit-skill-modal"
        closeButtonTestId="ai-edit-skill-close-button"
        promptInputTestId="ai-edit-skill-prompt-input"
        errorAlertTestId="ai-edit-skill-error-alert"
        loadingIndicatorTestId="ai-edit-skill-loading-indicator"
        generateButtonTestId="ai-edit-skill-generate-button"
        cancelButtonTestId="ai-edit-skill-cancel-button"
      />
      <Modal.BaseModal
        open={showVersionModal}
        variant={ModalConstants.MODAL_VARIANT.simple}
        titleIcon={ModalConstants.MODAL_ICON_TYPE.success}
        title="Create version"
        onClose={isSavingAsVersion ? undefined : handleCancelVersion}
        onConfirm={handleConfirmVersion}
        confirmButtonText="Save"
        confirming={!versionName.trim() || isSavingAsVersion}
        onKeyDown={handleVersionKeyDown}
        closeButtonTestId="ai-edit-skill-version-dialog-close-button"
        cancelButtonTestId="ai-edit-skill-version-dialog-cancel-button"
        confirmButtonTestId="ai-edit-skill-version-dialog-save-button"
        content={
          <Input.InputBase
            label="Name"
            value={versionName}
            onChange={e => setVersionName(e.target.value)}
            inputProps={{ maxLength: 255, 'data-testid': 'ai-edit-skill-version-dialog-name-input' }}
            autoFocus
          />
        }
      />
    </>
  );
});

AIEditSkillModal.displayName = 'AIEditSkillModal';

export default AIEditSkillModal;
