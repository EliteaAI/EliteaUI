import { memo, useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Box } from '@mui/material';

import { CredentialNameHelpers } from '@/[fsd]/features/credentials/lib/helpers';
import { Controls } from '@/[fsd]/shared/ui';
import { PinEntityType } from '@/[fsd]/widgets/PinToggler/lib/constants';
import { usePin, usePinMenu } from '@/[fsd]/widgets/PinToggler/lib/hooks';
import { TAG_MODELS, useDeleteConfigurationMutation } from '@/api';
import { eliteaApi } from '@/api/eliteaApi';
import { PERMISSIONS } from '@/common/constants';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import useCheckPermission from '@/hooks/useCheckPermission';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';

const CredentialsControls = memo(props => {
  const { credentialDetails } = props;

  const { toastSuccess, toastError } = useToast();

  const dispatch = useDispatch();
  const formik = useFormikContext();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { checkPermission } = useCheckPermission();

  const {
    isPinned,
    togglePin,
    isLoading: isPinLoading,
  } = usePin({
    entityId: credentialDetails?.id || credentialDetails?.uuid,
    entityType: PinEntityType.Configuration,
    formikContext: formik,
    шnitialPinned: !!credentialDetails?.is_pinned,
  });

  const [deleteCredential, { isLoading: isDeleting }] = useDeleteConfigurationMutation();

  const { pinMenuItem } = usePinMenu({
    isPinned,
    onTogglePin: togglePin,
    isLoading: isPinLoading,
  });

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

  const onDelete = useCallback(async () => {
    const { error: deleteError } = await deleteCredential({
      projectId: credentialDetails?.project_id,
      configId: credentialDetails?.id || credentialDetails?.uuid,
      section: credentialDetails?.section,
    });
    if (!deleteError) {
      toastSuccess('The credential has been deleted');

      if (credentialDetails?.type === 'llm_model') dispatch(eliteaApi.util.invalidateTags([TAG_MODELS]));

      navigateBack(true);
    } else {
      toastError('Failed to delete credential');
    }
  }, [
    deleteCredential,
    credentialDetails?.project_id,
    credentialDetails?.id,
    credentialDetails?.uuid,
    credentialDetails?.section,
    credentialDetails?.type,
    toastSuccess,
    dispatch,
    navigateBack,
    toastError,
  ]);

  const styles = credentialsControlsStyles();

  const items = useMemo(
    () => [
      {
        ...pinMenuItem,
        disabled: !(credentialDetails?.id && credentialDetails?.uuid),
      },
      {
        key: 'delete-credentials',
        label: 'Delete',
        icon: <DeleteIcon sx={styles.deleteIcon} />,
        onConfirm: onDelete,
        entityName:
          formik.values?.settings?.label ||
          credentialDetails?.label ||
          credentialDetails?.settings?.elitea_title ||
          credentialDetails?.elitea_title ||
          CredentialNameHelpers.extraCredentialName(credentialDetails?.name || ''),
        shouldRequestInputName: true,
        disabled: isDeleting || !credentialDetails?.id || !checkPermission(PERMISSIONS.configuration.delete),
      },
    ],
    [
      checkPermission,
      credentialDetails?.elitea_title,
      credentialDetails?.id,
      credentialDetails?.label,
      credentialDetails?.name,
      credentialDetails?.settings?.elitea_title,
      credentialDetails?.uuid,
      formik.values?.settings?.label,
      isDeleting,
      onDelete,
      pinMenuItem,
      styles,
    ],
  );

  return (
    <Box sx={styles.wrapper}>
      <Controls.ControlsDropdown menuItems={items} />
    </Box>
  );
});

CredentialsControls.displayName = 'CredentialsControls';

/** @type {MuiSx} */
const credentialsControlsStyles = () => ({
  wrapper: {
    display: 'flex',
    position: 'relative',
    alignItems: 'center',
    paddingLeft: '0.5rem',

    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: '0.25rem',
      bottom: '0.25rem',
      borderLeft: ({ palette }) => `1px solid ${palette.border.lines}`,
    },
  },
  deleteIcon: {
    fontSize: '1rem',
  },
});

export default CredentialsControls;
