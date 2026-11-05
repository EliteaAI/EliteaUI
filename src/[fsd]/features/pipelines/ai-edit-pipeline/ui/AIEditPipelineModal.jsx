import { memo, useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { Alert, Box } from '@mui/material';

import { EditEntityModal } from '@/[fsd]/entities/edit-entity-with-ai';
import { AiEditPipelineConstants } from '@/[fsd]/features/pipelines/ai-edit-pipeline/lib/constants';
import { useAIEditPipelineModal } from '@/[fsd]/features/pipelines/ai-edit-pipeline/lib/hooks';
import { Input, Modal } from '@/[fsd]/shared/ui';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import PipelineRunSettingsDiffStep from './PipelineRunSettingsDiffStep';
import PipelineSummaryStep from './PipelineSummaryStep';
import PipelineToolsDiffStep from './PipelineToolsDiffStep';
import PipelineYamlDiffStep from './PipelineYamlDiffStep';

const { AI_EDIT_PIPELINE_STEPS } = AiEditPipelineConstants;

const AIEditPipelineModal = memo(props => {
  const { open, onClose, isCreateMode = false } = props;

  const formik = useFormikContext();

  const {
    generateError,
    resetGenerate,
    currentTools,
    addToolkitIds,
    addMcpIds,
    addAgentIds,
    addPipelineIds,
    addSkillIds,
    removeToolRecordIds,
    handleToggleAddToolkit,
    handleToggleAddMcp,
    handleToggleAddAgent,
    handleToggleAddPipeline,
    handleToggleAddSkill,
    handleToggleRemoveTool,
    handleGenerate,
    handleDraftGenerated,
    handleSave,
    handleSaveAsVersion,
    showVersionModal,
    setShowVersionModal,
    versionName,
    setVersionName,
    isSavingAsVersion,
    handleConfirmSaveAsVersion,
  } = useAIEditPipelineModal({ isCreateMode, onClose });

  const styles = useMemo(() => aiEditPipelineModalStyles(), []);

  const renderStep = useCallback(
    (stepKey, draftData, setDraftData, onValidationChange) => {
      const warnings = draftData?.validation_result?.warnings ?? [];
      const warningBanner =
        warnings.length > 0 ? (
          <Alert
            severity="warning"
            sx={styles.warningBanner}
          >
            {warnings.map((w, i) => (
              <Box
                key={i}
                component="span"
                sx={styles.warningItem}
              >
                {w.node_id ? `[${w.node_id}] ` : ''}
                {w.message}
              </Box>
            ))}
          </Alert>
        ) : null;

      if (stepKey === 'yaml') {
        return (
          <Box sx={styles.stepRoot}>
            {warningBanner}
            <PipelineYamlDiffStep
              originalYaml={formik.values?.version_details?.instructions ?? ''}
              proposedYaml={draftData?.pipeline_yaml ?? ''}
            />
          </Box>
        );
      }

      if (stepKey === 'run-settings') {
        return (
          <Box sx={styles.stepRoot}>
            {warningBanner}
            <PipelineRunSettingsDiffStep
              currentName={formik.values?.name ?? ''}
              currentDescription={formik.values?.description ?? ''}
              proposedName={draftData?.name ?? ''}
              proposedDescription={draftData?.description ?? ''}
            />
          </Box>
        );
      }

      if (stepKey === 'tools-skills') {
        return (
          <Box sx={styles.stepRoot}>
            {warningBanner}
            <PipelineToolsDiffStep
              currentTools={currentTools}
              draftData={draftData}
              addToolkitIds={addToolkitIds}
              onToggleAddToolkit={handleToggleAddToolkit}
              addMcpIds={addMcpIds}
              onToggleAddMcp={handleToggleAddMcp}
              addAgentIds={addAgentIds}
              onToggleAddAgent={handleToggleAddAgent}
              addPipelineIds={addPipelineIds}
              onToggleAddPipeline={handleToggleAddPipeline}
              addSkillIds={addSkillIds}
              onToggleAddSkill={handleToggleAddSkill}
              removeToolRecordIds={removeToolRecordIds}
              onToggleRemoveTool={handleToggleRemoveTool}
            />
          </Box>
        );
      }

      if (stepKey === 'summary') {
        return (
          <PipelineSummaryStep
            currentTools={currentTools}
            draftData={draftData}
            onDraftChange={setDraftData}
            addToolkitIds={addToolkitIds}
            addMcpIds={addMcpIds}
            addAgentIds={addAgentIds}
            addPipelineIds={addPipelineIds}
            addSkillIds={addSkillIds}
            removeToolRecordIds={removeToolRecordIds}
            onValidationChange={onValidationChange}
          />
        );
      }

      return null;
    },
    [
      styles,
      formik.values,
      currentTools,
      addToolkitIds,
      handleToggleAddToolkit,
      addMcpIds,
      handleToggleAddMcp,
      addAgentIds,
      handleToggleAddAgent,
      addPipelineIds,
      handleToggleAddPipeline,
      addSkillIds,
      handleToggleAddSkill,
      removeToolRecordIds,
      handleToggleRemoveTool,
    ],
  );

  return (
    <>
      <EditEntityModal
        open={open}
        onClose={onClose}
        title={isCreateMode ? 'Create Pipeline with AI' : 'Edit Pipeline with AI'}
        entityLabel="pipeline"
        placeholder="Describe the changes you want to make to this pipeline."
        onGenerate={handleGenerate}
        generateError={generateError}
        resetGenerate={resetGenerate}
        onDraftGenerated={handleDraftGenerated}
        steps={AI_EDIT_PIPELINE_STEPS}
        renderStep={renderStep}
        onSave={handleSave}
        onSaveAsVersion={isCreateMode ? undefined : handleSaveAsVersion}
        isSavingAsVersion={isSavingAsVersion}
        saveLabel="Apply to Editor"
        savingLabel="Applying..."
        modalTestId="ai-edit-pipeline-modal"
        closeButtonTestId="ai-edit-pipeline-close-button"
        promptInputTestId="ai-edit-pipeline-prompt-input"
        errorAlertTestId="ai-edit-pipeline-error-alert"
        loadingIndicatorTestId="ai-edit-pipeline-loading-indicator"
        generateButtonTestId="ai-edit-pipeline-submit-button"
        cancelButtonTestId="ai-edit-pipeline-cancel-button"
        loadingText={isCreateMode ? 'Building pipeline...' : 'Generating pipeline changes...'}
      />

      {showVersionModal && (
        <Modal.BaseModal
          open={showVersionModal}
          title="Save as New Version"
          onClose={() => setShowVersionModal(false)}
          content={
            <Box sx={styles.versionModalContent}>
              <Input.InputBase
                label="Version name"
                fullWidth
                size="small"
                value={versionName}
                onChange={e => setVersionName(e.target.value)}
                autoFocus
                inputProps={{ 'data-testid': 'ai-edit-pipeline-version-name-input' }}
              />
            </Box>
          }
          actions={
            <>
              <Box sx={styles.versionModalSpacer} />
              <BaseBtn
                variant={BUTTON_VARIANTS.secondary}
                size="small"
                onClick={() => setShowVersionModal(false)}
                disabled={isSavingAsVersion}
              >
                Cancel
              </BaseBtn>
              <BaseBtn
                variant={BUTTON_VARIANTS.elitea}
                size="small"
                onClick={handleConfirmSaveAsVersion}
                disabled={isSavingAsVersion || !versionName.trim()}
                data-testid="ai-edit-pipeline-save-version-button"
              >
                {isSavingAsVersion ? 'Saving...' : 'Save Version'}
              </BaseBtn>
            </>
          }
        />
      )}
    </>
  );
});

AIEditPipelineModal.displayName = 'AIEditPipelineModal';

/** @type {MuiSx} */
const aiEditPipelineModalStyles = () => ({
  stepRoot: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
  },
  warningBanner: {
    mx: '1.5rem',
    mt: '0.5rem',
    flexShrink: 0,
  },
  warningItem: {
    display: 'block',
    fontSize: '0.8125rem',
  },
  versionModalContent: {
    padding: '1rem 1.5rem',
  },
  versionModalSpacer: {
    flex: 1,
  },
});

export default AIEditPipelineModal;
