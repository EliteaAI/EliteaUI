import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Button as MuiButton } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { buildErrorMessage } from '@/common/utils.jsx';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import useCreateApplication from '@/hooks/application/useCreateApplication';
import useNavBlocker from '@/hooks/useNavBlocker';
import useToast from '@/hooks/useToast.jsx';
import { TabBarItems } from '@/pages/Common/Components';
import useIsPipelineYamlCodeDirty from '@/pages/Pipelines/useIsPipelineYamlCodeDirty';

const CreateApplicationTabBar = memo(({ isEditingTool }) => {
  const formik = useFormikContext();
  const [wantToCancel, setWantToCancel] = useState(false);
  const isYamlCodeDirty = useIsPipelineYamlCodeDirty();
  const navigate = useNavigate();
  const { isLoading, create, error, isError } = useCreateApplication(formik);

  const stateValidationErrors = useSelector(state => state.pipeline?.stateValidationErrors);

  const hasStateErrors = useMemo(() => {
    return stateValidationErrors && Object.keys(stateValidationErrors).length > 0;
  }, [stateValidationErrors]);

  const shouldDisableSave = useMemo(
    () =>
      isLoading ||
      !formik.values.name ||
      !formik.values.description ||
      !formik.dirty ||
      isEditingTool ||
      hasStateErrors,
    [formik.dirty, formik.values.description, formik.values.name, isLoading, isEditingTool, hasStateErrors],
  );

  const blockOptions = useMemo(() => {
    return {
      blockCondition: (!!formik?.dirty || isYamlCodeDirty) && !wantToCancel,
    };
  }, [formik?.dirty, isYamlCodeDirty, wantToCancel]);
  useNavBlocker(blockOptions);

  const onCancel = useCallback(() => {
    setWantToCancel(true);
  }, []);

  useEffect(() => {
    if (wantToCancel) {
      navigate(-1);
    }
  }, [navigate, wantToCancel]);

  const { toastError } = useToast();
  useEffect(() => {
    if (isError) {
      toastError(buildErrorMessage(error));
    }
  }, [error, isError, toastError]);

  return (
    <>
      <TabBarItems>
        <MuiButton
          variant="elitea"
          color="primary"
          disabled={shouldDisableSave}
          onClick={create}
        >
          Save
          {isLoading && <StyledCircleProgress size={20} />}
        </MuiButton>
        <Button.DiscardButton
          title="Cancel"
          disabled={isLoading || (!formik.dirty && !isYamlCodeDirty) || isEditingTool}
          onDiscard={onCancel}
        />
      </TabBarItems>
    </>
  );
});

CreateApplicationTabBar.displayName = 'CreateApplicationTabBar';

export default CreateApplicationTabBar;
