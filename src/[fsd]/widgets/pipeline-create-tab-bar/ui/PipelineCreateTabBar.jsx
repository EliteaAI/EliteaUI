import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

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
  const isYamlCodeDirty = useIsPipelineYamlCodeDirty();
  const { isLoading, create, error, isError } = useCreateApplication(formik);
  const { stateValidationErrors } = useSelector(selectActivePipeline);

  const hasStateErrors = useMemo(
    () => Boolean(stateValidationErrors && Object.keys(stateValidationErrors).length),
    [stateValidationErrors],
  );

  // The draft is savable as-is: the name is pre-filled and the description is optional
  const shouldDisableSave = useMemo(
    () => isLoading || !formik.isValid || !formik.values.name?.trim() || hasStateErrors,
    [formik.isValid, formik.values.name, hasStateErrors, isLoading],
  );

  const blockOptions = useMemo(
    () => ({ blockCondition: (!!formik.dirty || isYamlCodeDirty) && !wantToCancel }),
    [formik.dirty, isYamlCodeDirty, wantToCancel],
  );
  useNavBlocker(blockOptions);

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
