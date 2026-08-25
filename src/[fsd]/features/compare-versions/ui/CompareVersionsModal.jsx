import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Alert, Box, CircularProgress, Typography } from '@mui/material';

import { useLazySkillDetailsQuery, useSkillUpdateMutation } from '@/[fsd]/features/skill/api';
import { ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Modal } from '@/[fsd]/shared/ui';
import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import {
  useLazyGetApplicationVersionDetailQuery,
  useUpdateApplicationVersionMutation,
} from '@/api/applications';
import useToast from '@/hooks/useToast';

import { AGENT_COMPARE_STEPS, SKILL_COMPARE_STEPS } from '../lib/constants/compareVersions.constants';
import { extractAgentCompareData, extractSkillCompareData } from '../lib/helpers/compareVersions.helpers';
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

  const { toastSuccess, toastError } = useToast();

  const [phase, setPhase] = useState(PHASES.SELECTION);
  const [rightVersionId, setRightVersionId] = useState(null);
  const [leftData, setLeftData] = useState(null);
  const [leftVersionDetails, setLeftVersionDetails] = useState(null);
  const [rightData, setRightData] = useState(null);
  const [leftVersionMeta, setLeftVersionMeta] = useState(null);
  const [rightVersionMeta, setRightVersionMeta] = useState(null);
  const [rightVersionDetails, setRightVersionDetails] = useState(null);
  const [leftEdits, setLeftEdits] = useState({});
  const [rightEdits, setRightEdits] = useState({});
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [loadError, setLoadError] = useState(null);
  const [savingLeftKeys, setSavingLeftKeys] = useState({});
  const [savingRightKeys, setSavingRightKeys] = useState({});
  const [discardTarget, setDiscardTarget] = useState(null);

  const [fetchAgentVersion] = useLazyGetApplicationVersionDetailQuery();
  const [fetchSkillVersion] = useLazySkillDetailsQuery();
  const [updateAgentVersion] = useUpdateApplicationVersionMutation();
  const [updateSkillVersion] = useSkillUpdateMutation();

  const isAgent = entityType === 'agent';
  const steps = isAgent ? AGENT_COMPARE_STEPS : SKILL_COMPARE_STEPS;
  const isLastStep = activeStepIndex === steps.length - 1;

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
      setSavingLeftKeys({});
      setSavingRightKeys({});
    }
  }, [open]);

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
        setLeftVersionDetails(leftDetail);
        setRightVersionDetails(rightDetail);
      } else {
        const [leftRes, rightRes] = await Promise.all([
          fetchSkillVersion({ projectId, skillId: entityId, versionId: leftVersionId }).unwrap(),
          fetchSkillVersion({ projectId, skillId: entityId, versionId: rightVersionId }).unwrap(),
        ]);
        leftDetail = leftRes;
        rightDetail = rightRes;
        setLeftData(extractSkillCompareData(leftDetail));
        setRightData(extractSkillCompareData(rightDetail));
        setLeftVersionDetails(leftDetail);
        setRightVersionDetails(rightDetail);
      }

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
      setActiveStepIndex(0);
      setPhase(PHASES.SELECTION);
      setLeftVersionMeta(null);
      setRightVersionMeta(null);
    }
  }, [discardTarget, onClose]);

  const handleSaveLeft = useCallback(
    async fieldPayload => {
      const keys = Object.keys(fieldPayload);
      setSavingLeftKeys(prev => {
        const next = { ...prev };
        keys.forEach(k => {
          next[k] = true;
        });
        return next;
      });
      try {
        const mergedData = { ...leftData, ...leftEdits, ...fieldPayload };

        if (isAgent) {
          await updateAgentVersion({
            ...leftVersionDetails,
            projectId,
            applicationId: entityId,
            versionId: leftVersionId,
            instructions: mergedData.instructions,
            welcome_message: mergedData.welcome_message,
            conversation_starters: mergedData.conversation_starters,
          }).unwrap();
        } else {
          await updateSkillVersion({
            ...leftVersionDetails,
            projectId,
            skillId: entityId,
            versionId: leftVersionId,
            instructions: mergedData.instructions,
          }).unwrap();
        }

        setLeftEdits(prev => {
          const next = { ...prev };
          Object.keys(fieldPayload).forEach(k => delete next[k]);
          return next;
        });
        setLeftData(prev => ({ ...prev, ...fieldPayload }));
        toastSuccess(`Version "${leftVersion?.name}" has been updated.`);
      } catch {
        toastError('Failed to save. Please try again.');
      } finally {
        setSavingLeftKeys(prev => {
          const next = { ...prev };
          keys.forEach(k => {
            delete next[k];
          });
          return next;
        });
      }
    },
    [
      leftData,
      leftEdits,
      isAgent,
      updateAgentVersion,
      updateSkillVersion,
      projectId,
      entityId,
      leftVersionId,
      leftVersion?.name,
      toastSuccess,
      toastError,
      leftVersionDetails,
    ],
  );

  const handleSaveRight = useCallback(
    async fieldPayload => {
      const keys = Object.keys(fieldPayload);
      setSavingRightKeys(prev => {
        const next = { ...prev };
        keys.forEach(k => {
          next[k] = true;
        });
        return next;
      });
      try {
        const mergedData = { ...rightData, ...rightEdits, ...fieldPayload };
        if (isAgent) {
          await updateAgentVersion({
            ...rightVersionDetails,
            projectId,
            applicationId: entityId,
            versionId: rightVersionId,
            instructions: mergedData.instructions,
            welcome_message: mergedData.welcome_message,
            conversation_starters: mergedData.conversation_starters,
          }).unwrap();
        } else {
          await updateSkillVersion({
            ...rightVersionDetails,
            projectId,
            skillId: entityId,
            versionId: rightVersionId,
            instructions: mergedData.instructions,
          }).unwrap();
        }

        setRightEdits(prev => {
          const next = { ...prev };
          Object.keys(fieldPayload).forEach(k => delete next[k]);
          return next;
        });
        setRightData(prev => ({ ...prev, ...fieldPayload }));
        toastSuccess(`Version "${rightVersion?.name}" has been updated.`);
      } catch {
        toastError('Failed to save. Please try again.');
      } finally {
        setSavingRightKeys(prev => {
          const next = { ...prev };
          keys.forEach(k => {
            delete next[k];
          });
          return next;
        });
      }
    },
    [
      rightData,
      rightEdits,
      isAgent,
      updateAgentVersion,
      updateSkillVersion,
      projectId,
      entityId,
      rightVersionId,
      rightVersion?.name,
      rightVersionDetails,
      toastSuccess,
      toastError,
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
      toastSuccess,
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
        <Box sx={styles.loadingContainer}>
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
        <Box sx={styles.wizardContainer}>
          <CompareVersionsStepIndicator
            steps={steps}
            activeStepIndex={activeStepIndex}
            onStepChange={setActiveStepIndex}
          />
          <Box sx={styles.stepContent}>{renderStep()}</Box>
        </Box>
      );
    }

    return (
      <Box sx={styles.selectionContainer}>
        <CompareVersionSelector
          leftVersion={leftVersion}
          rightVersionId={rightVersionId}
          availableVersions={availableVersions}
          onRightVersionChange={setRightVersionId}
        />
        {loadError && (
          <Alert
            severity="error"
            sx={styles.errorAlert}
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
      <Box sx={styles.wizardFooter}>
        <Box sx={{ flex: 1 }} />
        <Box sx={styles.wizardFooterRight}>
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
        dialogSx={styles.dialogContent}
        sx={phase === PHASES.WIZARD ? styles.dialogWizard : styles.dialog}
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
const styles = {
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
