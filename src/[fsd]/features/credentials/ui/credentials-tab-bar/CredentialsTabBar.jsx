import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Box, Button as MuiButton } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { useTrackEvent } from '@/GA';
import { CredentialErrorHelpers } from '@/[fsd]/features/credentials/lib/helpers';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { useFormDirtyExcluding, useProjectType } from '@/[fsd]/shared/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import { useDeleteConfigurationMutation } from '@/api/configurations';
import { PERMISSIONS } from '@/common/constants';
import { ICON_SIZES } from '@/common/designTokens';
import { buildErrorMessage } from '@/common/utils.jsx';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import { useCreateCredential } from '@/hooks/credentials/useCreateCredential';
import { useUpdateCredential } from '@/hooks/credentials/useUpdateCredential.jsx';
import useCheckPermission from '@/hooks/useCheckPermission';
import useNavBlocker from '@/hooks/useNavBlocker';
import useToast from '@/hooks/useToast.jsx';
import { TabBarItems } from '@/pages/Common/Components';
import RouteDefinitions from '@/routes.js';

const CredentialTabBar = memo(props => {
  const {
    credentialDetails,
    onClearCredentialDetails,
    configurationsAsSchema,
    onEnableEditTitle = () => {},
    hasErrors,
    setShowValidation,
    setApiError,
    setValidationErrorMessages,
  } = props;

  const trackEvent = useTrackEvent();

  const formik = useFormikContext();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const { credential_uid } = useParams();
  const { toastSuccess, toastError } = useToast();

  const { checkPermission } = useCheckPermission();
  const { projectType } = useProjectType();

  const isEditing = !!credential_uid;

  const [wantToCancel, setWantToCancel] = useState(false);

  const [{ isLoading: isDeleting }] = useDeleteConfigurationMutation();

  // Check if we came from Model Configuration Settings (handle both new and legacy parameter names)
  const isFromModelConfiguration = searchParams.get('from') === 'model-configuration';

  const navigateBack = useCallback(
    (replace = false) => {
      if (isFromModelConfiguration)
        navigate(
          {
            pathname: RouteDefinitions.SettingsWithTab.replace(':tab', 'model-configuration'),
          },
          {
            replace,
          },
        );
      else
        navigate(
          {
            pathname: RouteDefinitions.CredentialsWithTab.replace(':tab', 'all'),
          },
          {
            replace,
          },
        );
    },
    [isFromModelConfiguration, navigate],
  );

  const toolType = useMemo(() => credentialDetails?.type || '', [credentialDetails?.type]);

  const { configurationKeys, schemaProperties } = useMemo(() => {
    const configSchema = (configurationsAsSchema || []).find(item => item.type === toolType);

    return {
      configurationKeys: Object.keys(configSchema?.config_schema?.properties?.data?.properties || {}),
      schemaProperties: configSchema?.config_schema?.properties?.data?.properties || {},
    };
  }, [configurationsAsSchema, toolType]);

  const {
    create,
    isLoading: isCreateLoading,
    error: createError,
    isError: isCreateError,
  } = useCreateCredential(formik, credentialDetails, configurationKeys);

  const {
    update,
    isLoading: isUpdateLoading,
    error: updateError,
    isError: isUpdateError,
  } = useUpdateCredential(formik, credentialDetails, configurationKeys);

  const isFormDirtyExcluding = useFormDirtyExcluding();

  const isLoading = useMemo(() => isCreateLoading || isUpdateLoading, [isCreateLoading, isUpdateLoading]);
  const error = useMemo(() => createError || updateError, [createError, updateError]);
  const isError = useMemo(() => isCreateError || isUpdateError, [isCreateError, isUpdateError]);
  const shouldDisableSave = useMemo(
    () => isLoading || !isFormDirtyExcluding,
    [isLoading, isFormDirtyExcluding],
  );

  const blockOptions = useMemo(
    () => ({
      blockCondition: !!isFormDirtyExcluding && !wantToCancel,
    }),
    [isFormDirtyExcluding, wantToCancel],
  );

  const onSaveRef = React.useRef(create);
  const onUpdateRef = React.useRef(update);

  useEffect(() => {
    onSaveRef.current = create;
  }, [create]);

  useEffect(() => {
    onUpdateRef.current = update;
  }, [update]);

  useNavBlocker(blockOptions);

  const doSave = useCallback(async () => {
    try {
      const result = await (isEditing ? onUpdateRef : onSaveRef).current();

      if (!result.error) {
        if (!isEditing) {
          trackEvent(GA_EVENT_NAMES.CREDENTIALS_CREATED, {
            [GA_EVENT_PARAMS.CREDENTIALS_TYPE]: projectType === 'private' ? 'private' : 'project',
            [GA_EVENT_PARAMS.TOOLKIT_TYPE]: toolType || 'unknown',
            [GA_EVENT_PARAMS.PROJECT_TYPE]: projectType || 'unknown',
          });
        }

        formik.resetForm();

        toastSuccess(`The credential has been ${isEditing ? 'updated' : 'created'} successfully`);
        setTimeout(() => {
          navigateBack(true);
        }, 100);
      } else {
        if (typeof result.error?.data?.error === 'string' && result?.error?.data?.field === 'elitea_title')
          onEnableEditTitle?.();

        const { newErrors } = CredentialErrorHelpers.extractInformationFromCredentialError({
          error,
          schemaProperties,
          settings: credentialDetails?.settings || {},
        });

        if (Object.keys(newErrors).length > 0) {
          setValidationErrorMessages?.(newErrors);
          setShowValidation?.(true);
          setApiError?.('');
        } else {
          setApiError?.(buildErrorMessage(error));
        }
        setApiError(buildErrorMessage(result.error) || 'Failed to save credential');
      }
    } catch {
      setApiError('An unexpected error occurred');
    }
  }, [
    isEditing,
    formik,
    toastSuccess,
    trackEvent,
    projectType,
    toolType,
    navigateBack,
    onEnableEditTitle,
    error,
    schemaProperties,
    credentialDetails?.settings,
    setApiError,
    setValidationErrorMessages,
    setShowValidation,
  ]);

  const onClickSave = useCallback(() => {
    if (hasErrors) setShowValidation(true);
    else doSave();
  }, [hasErrors, setShowValidation, doSave]);

  const onCancel = useCallback(() => {
    setWantToCancel(true);
  }, [setWantToCancel]);

  useEffect(() => {
    if (wantToCancel) {
      onClearCredentialDetails();
      formik.resetForm();
      setWantToCancel(false);
    }
  }, [onClearCredentialDetails, wantToCancel, formik, navigateBack]);

  useEffect(() => {
    if (isError) toastError(buildErrorMessage(error));
  }, [error, isError, toastError]);

  return (
    <>
      <TabBarItems>
        <Tooltip
          title="Save credential"
          placement="top"
        >
          <Box component="span">
            <MuiButton
              variant="elitea"
              color="primary"
              disabled={
                hasErrors ||
                shouldDisableSave ||
                isDeleting ||
                !checkPermission(PERMISSIONS.configuration.update)
              }
              onClick={onClickSave}
            >
              Save
              {isLoading && <StyledCircleProgress size={ICON_SIZES.XL} />}
            </MuiButton>
          </Box>
        </Tooltip>
        <Button.DiscardButton
          title={isEditing ? 'Discard' : 'Cancel'}
          disabled={isLoading || isDeleting || !isFormDirtyExcluding}
          onDiscard={onCancel}
        />
      </TabBarItems>
    </>
  );
});

CredentialTabBar.displayName = 'CredentialTabBar';

export default CredentialTabBar;
