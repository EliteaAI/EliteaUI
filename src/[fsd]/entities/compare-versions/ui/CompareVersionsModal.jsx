import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Alert, Box, CircularProgress, Typography } from '@mui/material';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Banner, Modal } from '@/[fsd]/shared/ui';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import {
  COMPARE_ENTITY_TYPES,
  COMPARE_MESSAGES,
  COMPARE_STEPS_BY_ENTITY,
  SKILL_COMPARE_STEPS,
} from '../lib/constants/compareVersions.constants';
import CompareVersionSelector from './CompareVersionSelector';
import CompareVersionsStepIndicator from './CompareVersionsStepIndicator';
import {
  CompareInstructionsStep,
  ComparePipelineYamlStep,
  CompareRunSettingsSchedulesStep,
  CompareRunSettingsStep,
  CompareToolsSkillsStep,
  CompareUserInteractionStep,
} from './steps';

const DISCARD_TARGETS = {
  close: 'close',
  changeVersions: 'changeVersions',
  navigate: 'navigate',
};

const PHASES = {
  SELECTION: 'selection',
  LOADING: 'loading',
  WIZARD: 'wizard',
};

const CompareVersionsModal = memo(props => {
  const {
    open,
    onClose,
    entityType,
    leftVersionId,
    versions = [],
    onLoadVersions,
    savingLeftKeys,
    savingRightKeys,
    onSaveLeft,
    onSaveRight,
    resetSavingState,
    // Pipelines: the editor has unsaved changes, so the open version can't be saved from here
    isEditorDirty = false,
    entityId,
    canListSchedules = false,
    isScheduleAdmin = false,
    // Called after the dialog closes, to open a schedule (pipelines)
    onOpenSchedule,
  } = props;

  const [phase, setPhase] = useState(PHASES.SELECTION);
  const [rightVersionId, setRightVersionId] = useState(null);
  const [leftData, setLeftData] = useState(null);
  const [rightData, setRightData] = useState(null);
  const [leftVersionMeta, setLeftVersionMeta] = useState(null);
  const [rightVersionMeta, setRightVersionMeta] = useState(null);
  const [leftEdits, setLeftEdits] = useState({});
  const [rightEdits, setRightEdits] = useState({});
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [loadError, setLoadError] = useState(null);
  const [discardTarget, setDiscardTarget] = useState(null);
  // The schedule Open schedule asks for while the discard confirm is shown: { scheduleId, versionId }
  const [pendingSchedule, setPendingSchedule] = useState(null);

  const steps = COMPARE_STEPS_BY_ENTITY[entityType] ?? SKILL_COMPARE_STEPS;
  const isPipeline = entityType === COMPARE_ENTITY_TYPES.pipeline;
  const isLastStep = activeStepIndex === steps.length - 1;
  const leftSaveDisabledReason = isEditorDirty ? COMPARE_MESSAGES.editorDirtySave : undefined;

  const leftVersion = useMemo(
    () => leftVersionMeta ?? versions.find(v => v.id === leftVersionId),
    [leftVersionMeta, versions, leftVersionId],
  );
  const rightVersion = useMemo(
    () => rightVersionMeta ?? versions.find(v => v.id === rightVersionId),
    [rightVersionMeta, versions, rightVersionId],
  );
  const availableVersions = useMemo(
    () => versions.filter(v => v.id !== leftVersionId),
    [versions, leftVersionId],
  );

  useEffect(() => {
    if (open) {
      const sorted = [...availableVersions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setRightVersionId(sorted[0]?.id ?? null);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) {
      setPhase(PHASES.SELECTION);
      setRightVersionId(null);
      setLeftData(null);
      setRightData(null);
      setLeftVersionMeta(null);
      setRightVersionMeta(null);
      setLeftEdits({});
      setRightEdits({});
      setActiveStepIndex(0);
      setLoadError(null);
      setDiscardTarget(null);
      setPendingSchedule(null);
      resetSavingState?.();
    }
  }, [open, resetSavingState]);

  const handleCompare = useCallback(async () => {
    if (!rightVersionId) return;
    setPhase(PHASES.LOADING);
    setLoadError(null);

    try {
      const result = await onLoadVersions(leftVersionId, rightVersionId);
      setLeftData(result.leftData);
      setRightData(result.rightData);
      setLeftVersionMeta(result.leftVersionMeta);
      setRightVersionMeta(result.rightVersionMeta);
      setLeftEdits({});
      setRightEdits({});
      setPhase(PHASES.WIZARD);
    } catch {
      setLoadError('Failed to load version details. Please try again.');
      setPhase(PHASES.SELECTION);
    }
  }, [rightVersionId, leftVersionId, onLoadVersions]);

  const isDirty = Object.keys(leftEdits).length > 0 || Object.keys(rightEdits).length > 0;

  const handleClose = useCallback(() => {
    if (isDirty) {
      setDiscardTarget(DISCARD_TARGETS.close);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  const openSchedule = useCallback(
    (scheduleId, versionId) => {
      onClose();
      onOpenSchedule?.(scheduleId, versionId);
    },
    [onClose, onOpenSchedule],
  );

  const handleOpenSchedule = useCallback(
    (scheduleId, versionId) => {
      if (isDirty) {
        setPendingSchedule({ scheduleId, versionId });
        setDiscardTarget(DISCARD_TARGETS.navigate);
      } else {
        openSchedule(scheduleId, versionId);
      }
    },
    [isDirty, openSchedule],
  );

  const handleDiscardConfirm = useCallback(() => {
    const target = discardTarget;
    setDiscardTarget(null);
    if (target === DISCARD_TARGETS.close) {
      onClose();
    } else if (target === DISCARD_TARGETS.navigate) {
      openSchedule(pendingSchedule?.scheduleId, pendingSchedule?.versionId);
    } else if (target === DISCARD_TARGETS.changeVersions) {
      setLeftEdits({});
      setRightEdits({});
      setActiveStepIndex(0);
      setPhase(PHASES.SELECTION);
      setLeftVersionMeta(null);
      setRightVersionMeta(null);
    }
  }, [discardTarget, onClose, openSchedule, pendingSchedule]);

  const handleSaveLeftField = useCallback(
    fieldPayload =>
      onSaveLeft?.({
        fieldPayload,
        data: leftData,
        edits: leftEdits,
        versionId: leftVersionId,
        versionName: leftVersion?.name,
        setEdits: setLeftEdits,
        setData: setLeftData,
      }),
    [leftData, leftEdits, leftVersionId, leftVersion?.name, onSaveLeft],
  );

  const handleSaveRightField = useCallback(
    fieldPayload =>
      onSaveRight?.({
        fieldPayload,
        data: rightData,
        edits: rightEdits,
        versionId: rightVersionId,
        versionName: rightVersion?.name,
        setEdits: setRightEdits,
        setData: setRightData,
      }),
    [rightData, rightEdits, rightVersionId, rightVersion?.name, onSaveRight],
  );

  const handlePrevious = useCallback(() => setActiveStepIndex(prev => Math.max(0, prev - 1)), []);
  const handleNext = useCallback(
    () => setActiveStepIndex(prev => Math.min(steps.length - 1, prev + 1)),
    [steps.length],
  );

  const handleChangeVersions = useCallback(() => {
    if (isDirty) {
      setDiscardTarget(DISCARD_TARGETS.changeVersions);
    } else {
      setActiveStepIndex(0);
      setPhase(PHASES.SELECTION);
      setLeftVersionMeta(null);
      setRightVersionMeta(null);
    }
  }, [isDirty]);

  const onLeftEdit = useCallback((field, val) => setLeftEdits(prev => ({ ...prev, [field]: val })), []);
  const onRightEdit = useCallback((field, val) => setRightEdits(prev => ({ ...prev, [field]: val })), []);

  const renderStep = stepKey => {
    if (!leftData || !rightData) return null;
    const stepProps = {
      leftVersion,
      rightVersion,
      leftData,
      rightData,
      leftEdits,
      rightEdits,
      onLeftEdit,
      onRightEdit,
      onSaveLeft: handleSaveLeftField,
      onSaveRight: handleSaveRightField,
      savingLeftKeys: savingLeftKeys ?? {},
      savingRightKeys: savingRightKeys ?? {},
      leftSaveDisabledReason,
    };

    switch (stepKey) {
      case 'instructions':
        return (
          <CompareInstructionsStep
            {...stepProps}
            instructionsRequired={entityType === 'skill'}
          />
        );
      case 'user-interaction':
        return <CompareUserInteractionStep {...stepProps} />;
      case 'tools-skills':
        return <CompareToolsSkillsStep {...stepProps} />;
      case 'run-settings':
        return <CompareRunSettingsStep {...stepProps} />;
      case 'pipeline-yaml':
        return <ComparePipelineYamlStep {...stepProps} />;
      case 'tools':
        return (
          <CompareToolsSkillsStep
            {...stepProps}
            emptyText={COMPARE_MESSAGES.noPipelineTools}
          />
        );
      case 'run-settings-schedules':
        return (
          <CompareRunSettingsSchedulesStep
            {...stepProps}
            entityId={entityId}
            canListSchedules={canListSchedules}
            isScheduleAdmin={isScheduleAdmin}
            onOpenSchedule={handleOpenSchedule}
          />
        );
      default:
        return null;
    }
  };

  const activeStepKey = steps[activeStepIndex]?.key;
  // The YAML editors stay mounted while other steps show, so expanded blocks and scroll survive a step change
  const keepsYamlMounted = isPipeline && phase === PHASES.WIZARD;

  const renderContent = () => {
    if (phase === PHASES.LOADING) {
      return (
        <Box sx={compareVersionsModalStyles.loadingContainer}>
          <CircularProgress size={24} />
          <Typography
            color="text.secondary"
            sx={{ fontSize: '0.875rem' }}
          >
            Loading version details...
          </Typography>
        </Box>
      );
    }

    if (phase === PHASES.WIZARD) {
      return (
        <Box sx={compareVersionsModalStyles.wizardContainer}>
          <CompareVersionsStepIndicator
            steps={steps}
            activeStepIndex={activeStepIndex}
            onStepChange={setActiveStepIndex}
          />
          {keepsYamlMounted && (
            <Box
              sx={[
                compareVersionsModalStyles.stepContent,
                activeStepKey !== 'pipeline-yaml' && compareVersionsModalStyles.hiddenStep,
              ]}
            >
              {renderStep('pipeline-yaml')}
            </Box>
          )}
          {activeStepKey !== 'pipeline-yaml' && (
            <Box sx={compareVersionsModalStyles.stepContent}>{renderStep(activeStepKey)}</Box>
          )}
        </Box>
      );
    }

    return (
      <Box sx={compareVersionsModalStyles.selectionContainer}>
        <CompareVersionSelector
          leftVersion={leftVersion}
          rightVersionId={rightVersionId}
          availableVersions={availableVersions}
          onRightVersionChange={setRightVersionId}
        />
        {isEditorDirty && (
          <Box
            sx={compareVersionsModalStyles.errorAlert}
            data-testid="compare-editor-dirty-banner"
          >
            <Banner.BannerMessage
              variant="info"
              message={COMPARE_MESSAGES.editorDirty}
            />
          </Box>
        )}
        {loadError && (
          <Alert
            severity="error"
            sx={compareVersionsModalStyles.errorAlert}
          >
            {loadError}
          </Alert>
        )}
      </Box>
    );
  };

  const renderActions = () => {
    if (phase !== PHASES.SELECTION) return null;

    return (
      <>
        <Box sx={{ flex: 1 }} />
        <BaseBtn
          variant={BUTTON_VARIANTS.secondary}
          size="small"
          onClick={onClose}
        >
          Cancel
        </BaseBtn>
        <BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          size="small"
          disabled={!rightVersionId}
          onClick={handleCompare}
          sx={{ margin: '0 !important' }}
        >
          Compare
        </BaseBtn>
      </>
    );
  };

  const renderWizardFooter = () => {
    if (phase !== PHASES.WIZARD) return null;

    return (
      <Box sx={compareVersionsModalStyles.wizardFooter}>
        <Box sx={{ flex: 1 }} />
        <Box sx={compareVersionsModalStyles.wizardFooterRight}>
          <BaseBtn
            variant={BUTTON_VARIANTS.secondary}
            size="small"
            onClick={handleChangeVersions}
          >
            Change versions
          </BaseBtn>
          {activeStepIndex > 0 && (
            <BaseBtn
              variant={BUTTON_VARIANTS.secondary}
              size="small"
              onClick={handlePrevious}
            >
              Previous
            </BaseBtn>
          )}
          {!isLastStep && (
            <BaseBtn
              variant={BUTTON_VARIANTS.elitea}
              size="small"
              onClick={handleNext}
            >
              Next
            </BaseBtn>
          )}
          {isLastStep && (
            <BaseBtn
              variant={BUTTON_VARIANTS.elitea}
              size="small"
              onClick={handleClose}
            >
              Finish
            </BaseBtn>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <>
      <Modal.BaseModal
        open={open}
        title="Compare versions"
        onClose={handleClose}
        content={renderContent()}
        actions={renderActions()}
        footer={renderWizardFooter()}
        dialogSx={compareVersionsModalStyles.dialogContent}
        sx={
          phase === PHASES.WIZARD
            ? compareVersionsModalStyles.dialogWizard
            : compareVersionsModalStyles.dialog
        }
      />
      <Modal.BaseModal
        open={discardTarget !== null}
        variant={ModalConstants.MODAL_VARIANT.simple}
        titleIcon={ModalConstants.MODAL_ICON_TYPE.warning}
        title="Discard unsaved changes?"
        content="You have unsaved changes in the compared versions. This action will discard them."
        onClose={() => setDiscardTarget(null)}
        onConfirm={handleDiscardConfirm}
        cancelButtonText="Keep editing"
        confirmButtonText="Discard and continue"
        alarm
      />
    </>
  );
});

CompareVersionsModal.displayName = 'CompareVersionsModal';

/** @type {MuiSx} */
const compareVersionsModalStyles = {
  dialog: () => ({
    width: '45rem !important',
    maxWidth: '90vw !important',
  }),
  dialogWizard: () => ({
    width: 'calc(100vw - 6rem) !important',
    maxWidth: '90vw !important',
    height: 'calc(100vh - 6rem) !important',
    maxHeight: '90vh !important',
  }),
  dialogContent: {
    flex: 1,
    minHeight: 0,
    maxHeight: 'none',
    padding: '0 !important',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    overflowY: 'hidden',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    padding: '2rem 0',
    minHeight: '16rem',
  },
  selectionContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  errorAlert: {
    mx: '1.5rem',
    mb: '1rem',
  },
  wizardContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    flex: 1,
    minHeight: 0,
  },
  stepContent: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  hiddenStep: {
    display: 'none',
  },
  wizardFooter: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    flexShrink: 0,
    boxSizing: 'border-box',
    padding: '0.75rem 1.5rem',
    borderTop: `0.0625rem solid ${palette.border.lines}`,
  }),
  wizardFooterRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
};

export default CompareVersionsModal;
