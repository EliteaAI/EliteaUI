import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Alert, Box, CircularProgress, Typography } from '@mui/material';

import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Modal } from '@/[fsd]/shared/ui';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import { AGENT_COMPARE_STEPS, SKILL_COMPARE_STEPS } from '../lib/constants/compareVersions.constants';
import { extractAgentCompareData, extractSkillCompareData } from '../lib/helpers/compareVersions.helpers';
import { useCompareVersionsSave } from '../lib/hooks/useCompareVersionsSave.hooks';
import CompareVersionSelector from './CompareVersionSelector';
import CompareVersionsStepIndicator from './CompareVersionsStepIndicator';
import { CompareInstructionsStep, CompareToolsSkillsStep, CompareUserInteractionStep } from './steps';

const PHASES = {
  SELECTION: 'selection',
  LOADING: 'loading',
  WIZARD: 'wizard',
};

const CompareVersionsModal = memo(props => {
  const { open, onClose, entityType, entityId, projectId, leftVersionId, versions = [] } = props;

  const [phase, setPhase] = useState(PHASES.SELECTION);
  const [rightVersionId, setRightVersionId] = useState(null);
  const [leftData, setLeftData] = useState(null);
  const [rightData, setRightData] = useState(null);
  const [leftVersionDetails, setLeftVersionDetails] = useState(null);
  const [rightVersionDetails, setRightVersionDetails] = useState(null);
  const [leftVersionMeta, setLeftVersionMeta] = useState(null);
  const [rightVersionMeta, setRightVersionMeta] = useState(null);
  const [leftEdits, setLeftEdits] = useState({});
  const [rightEdits, setRightEdits] = useState({});
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [loadError, setLoadError] = useState(null);
  const [discardTarget, setDiscardTarget] = useState(null);

  const isAgent = entityType === 'agent';
  const steps = isAgent ? AGENT_COMPARE_STEPS : SKILL_COMPARE_STEPS;
  const isLastStep = activeStepIndex === steps.length - 1;

  const {
    fetchAgentVersion,
    fetchSkillVersion,
    savingLeftKeys,
    savingRightKeys,
    setSavingLeftKeys,
    setSavingRightKeys,
    resetSavingState,
    saveVersion,
  } = useCompareVersionsSave({ isAgent, projectId, entityId });

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
      setLeftVersionDetails(null);
      setRightVersionDetails(null);
      setLeftVersionMeta(null);
      setRightVersionMeta(null);
      setLeftEdits({});
      setRightEdits({});
      setActiveStepIndex(0);
      setLoadError(null);
      setDiscardTarget(null);
      resetSavingState();
    }
  }, [open, resetSavingState]);

  const handleCompare = useCallback(async () => {
    if (!rightVersionId) return;
    setPhase(PHASES.LOADING);
    setLoadError(null);

    try {
      let leftDetail, rightDetail;

      if (isAgent) {
        const [leftRes, rightRes] = await Promise.all([
          fetchAgentVersion({ projectId, applicationId: entityId, versionId: leftVersionId }).unwrap(),
          fetchAgentVersion({ projectId, applicationId: entityId, versionId: rightVersionId }).unwrap(),
        ]);
        leftDetail = leftRes;
        rightDetail = rightRes;
        setLeftData(extractAgentCompareData(leftDetail));
        setRightData(extractAgentCompareData(rightDetail));
      } else {
        const [leftRes, rightRes] = await Promise.all([
          fetchSkillVersion({ projectId, skillId: entityId, versionId: leftVersionId }).unwrap(),
          fetchSkillVersion({ projectId, skillId: entityId, versionId: rightVersionId }).unwrap(),
        ]);
        leftDetail = leftRes;
        rightDetail = rightRes;
        setLeftData(extractSkillCompareData(leftDetail));
        setRightData(extractSkillCompareData(rightDetail));
      }

      setLeftVersionDetails(leftDetail);
      setRightVersionDetails(rightDetail);

      const pickVersionMeta = d => {
        const vd = isAgent ? d : (d.version_details ?? d);
        return { id: vd.id, name: vd.name, created_at: vd.created_at, author: vd.author };
      };
      setLeftVersionMeta(pickVersionMeta(leftDetail));
      setRightVersionMeta(pickVersionMeta(rightDetail));

      setLeftEdits({});
      setRightEdits({});
      setPhase(PHASES.WIZARD);
    } catch {
      setLoadError('Failed to load version details. Please try again.');
      setPhase(PHASES.SELECTION);
    }
  }, [rightVersionId, isAgent, fetchAgentVersion, fetchSkillVersion, projectId, entityId, leftVersionId]);

  const isDirty = Object.keys(leftEdits).length > 0 || Object.keys(rightEdits).length > 0;

  const handleClose = useCallback(() => {
    if (isDirty) {
      setDiscardTarget('close');
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  const handleDiscardConfirm = useCallback(() => {
    const target = discardTarget;
    setDiscardTarget(null);
    if (target === 'close') {
      onClose();
    } else if (target === 'changeVersions') {
      setLeftEdits({});
      setRightEdits({});
      setActiveStepIndex(0);
      setPhase(PHASES.SELECTION);
      setLeftVersionMeta(null);
      setRightVersionMeta(null);
    }
  }, [discardTarget, onClose]);

  const handleSaveLeft = useCallback(
    fieldPayload =>
      saveVersion({
        fieldPayload,
        data: leftData,
        edits: leftEdits,
        versionDetails: leftVersionDetails,
        versionId: leftVersionId,
        versionName: leftVersion?.name,
        setSavingKeys: setSavingLeftKeys,
        setEdits: setLeftEdits,
        setData: setLeftData,
      }),
    [
      leftData,
      leftEdits,
      leftVersionDetails,
      leftVersionId,
      leftVersion?.name,
      saveVersion,
      setSavingLeftKeys,
    ],
  );

  const handleSaveRight = useCallback(
    fieldPayload =>
      saveVersion({
        fieldPayload,
        data: rightData,
        edits: rightEdits,
        versionDetails: rightVersionDetails,
        versionId: rightVersionId,
        versionName: rightVersion?.name,
        setSavingKeys: setSavingRightKeys,
        setEdits: setRightEdits,
        setData: setRightData,
      }),
    [
      rightData,
      rightEdits,
      rightVersionDetails,
      rightVersionId,
      rightVersion?.name,
      saveVersion,
      setSavingRightKeys,
    ],
  );

  const handlePrevious = useCallback(() => setActiveStepIndex(prev => Math.max(0, prev - 1)), []);
  const handleNext = useCallback(
    () => setActiveStepIndex(prev => Math.min(steps.length - 1, prev + 1)),
    [steps.length],
  );

  const handleChangeVersions = useCallback(() => {
    if (isDirty) {
      setDiscardTarget('changeVersions');
    } else {
      setActiveStepIndex(0);
      setPhase(PHASES.SELECTION);
      setLeftVersionMeta(null);
      setRightVersionMeta(null);
    }
  }, [isDirty]);

  const onLeftEdit = useCallback((field, val) => setLeftEdits(prev => ({ ...prev, [field]: val })), []);
  const onRightEdit = useCallback((field, val) => setRightEdits(prev => ({ ...prev, [field]: val })), []);

  const renderStep = () => {
    if (!leftData || !rightData) return null;
    const stepKey = steps[activeStepIndex]?.key;
    const stepProps = {
      leftVersion,
      rightVersion,
      leftData,
      rightData,
      leftEdits,
      rightEdits,
      onLeftEdit,
      onRightEdit,
      onSaveLeft: handleSaveLeft,
      onSaveRight: handleSaveRight,
      savingLeftKeys,
      savingRightKeys,
    };

    switch (stepKey) {
      case 'instructions':
        return <CompareInstructionsStep {...stepProps} />;
      case 'user-interaction':
        return <CompareUserInteractionStep {...stepProps} />;
      case 'tools-skills':
        return <CompareToolsSkillsStep {...stepProps} />;
      default:
        return null;
    }
  };

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
          <Box sx={compareVersionsModalStyles.stepContent}>{renderStep()}</Box>
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
