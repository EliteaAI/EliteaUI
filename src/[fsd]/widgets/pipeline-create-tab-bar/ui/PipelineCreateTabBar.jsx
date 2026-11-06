import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFormikContext } from 'formik';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { useAttachSkills } from '@/[fsd]/features/pipelines/ai-edit-pipeline';
import { useToast } from '@/[fsd]/shared/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { buildErrorMessage } from '@/common/utils.jsx';
import useCreateApplication from '@/hooks/application/useCreateApplication';
import useNavBlocker from '@/hooks/useNavBlocker';
import { TabBarItems } from '@/pages/Common/Components';
import useIsPipelineYamlCodeDirty from '@/pages/Pipelines/useIsPipelineYamlCodeDirty';
import { selectActivePipeline } from '@/slices/pipeline';

const PipelineCreateTabBar = memo(() => {
  const formik = useFormikContext();
  const navigate = useNavigate();
  const { toastError } = useToast();
  const [wantToCancel, setWantToCancel] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const isYamlCodeDirty = useIsPipelineYamlCodeDirty();
  const { stateValidationErrors } = useSelector(selectActivePipeline);

  const blockOptions = useMemo(
    () => ({ blockCondition: (!!formik.dirty || isYamlCodeDirty) && !wantToCancel && !isSaved }),
    [formik.dirty, isYamlCodeDirty, wantToCancel, isSaved],
  );
  const { setBlockNav } = useNavBlocker(blockOptions);

  // The redirect after save is deferred; until it lands, the post-save pipeline reset can re-sync the
  // YAML (attachments state, flow editor re-dump) and flip it dirty again, so a saved draft stays unblocked
  const resetBlockNav = useCallback(() => {
    setIsSaved(true);
    setBlockNav(false);
  }, [setBlockNav]);
  // The create payload has no skills field, so skills an AI draft suggested are attached once the version
  // exists; read before Save because the form is reset to the server response on success
  const attachPendingSkills = useAttachSkills();
  const pendingSkillsRef = useRef([]);
  const onCreated = useCallback(
    data => attachPendingSkills(pendingSkillsRef.current, data?.version_details?.id),
    [attachPendingSkills],
  );
  const {
    isLoading,
    create: createPipeline,
    error,
    isError,
  } = useCreateApplication(formik, resetBlockNav, { onSuccess: onCreated });
  const create = useCallback(() => {
    pendingSkillsRef.current = formik.values?.pending_skills || [];
    return createPipeline();
  }, [createPipeline, formik.values?.pending_skills]);

  const hasStateErrors = useMemo(
    () => Boolean(stateValidationErrors && Object.keys(stateValidationErrors).length),
    [stateValidationErrors],
  );

  // The draft is savable as-is: the name is pre-filled and the description is optional
  const shouldDisableSave = useMemo(
    () => isLoading || !formik.isValid || !formik.values.name?.trim() || hasStateErrors,
    [formik.isValid, formik.values.name, hasStateErrors, isLoading],
  );

  const onCancel = useCallback(() => {
    setWantToCancel(true);
  }, []);

  useEffect(() => {
    if (wantToCancel) {
      navigate(-1);
    }
  }, [navigate, wantToCancel]);

  useEffect(() => {
    if (isError) {
      toastError(buildErrorMessage(error));
    }
  }, [error, isError, toastError]);

  return (
    <TabBarItems>
      <Button.BaseBtn
        variant={BUTTON_VARIANTS.elitea}
        color={BUTTON_COLORS.primary}
        disabled={shouldDisableSave}
        loading={isLoading}
        onClick={create}
        data-testid="agent-save-button"
      >
        Save
      </Button.BaseBtn>
      <Button.DiscardButton
        title="Cancel"
        disabled={isLoading || (!formik.dirty && !isYamlCodeDirty)}
        onDiscard={onCancel}
      />
    </TabBarItems>
  );
});

PipelineCreateTabBar.displayName = 'PipelineCreateTabBar';

export default PipelineCreateTabBar;
