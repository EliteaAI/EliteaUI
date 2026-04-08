import { useCallback, useEffect, useMemo } from 'react';

import { useFormikContext } from 'formik';
import { useNavigate, useParams } from 'react-router-dom';

import { useDeleteApplicationMutation } from '@/api/applications';
import { buildErrorMessage } from '@/common/utils';
import DeleteEntityButton from '@/components/DeleteEntityButton';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import { useIsFromPipelineDetail } from '@/hooks/useIsFromSpecificPageHooks';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import { useTheme } from '@emotion/react';

const useDeleteEntity = (entityType, setBlockNav) => {
  const projectId = useSelectedProjectId();
  const navigate = useNavigate();

  const isFromPipeline = useIsFromPipelineDetail();
  const { agentId: applicationId } = useParams();
  const { values: { name } = {} } = useFormikContext();
  const [deleteApplication, { isLoading, error, isError, isSuccess, reset }] = useDeleteApplicationMutation();

  const onCloseToast = useCallback(() => {
    if (isError) {
      reset();
    } else if (isSuccess) {
      setBlockNav?.(false);
      setTimeout(() => {
        navigate(-1);
      }, 0);
    }
  }, [isError, isSuccess, navigate, reset, setBlockNav]);

  const toastProps = useMemo(() => ({ onCloseToast }), [onCloseToast]);
  const { toastInfo, toastError } = useToast(toastProps);

  const onDelete = useCallback(async () => {
    await deleteApplication({ projectId, applicationId });
  }, [deleteApplication, projectId, applicationId]);

  useEffect(() => {
    if (isError) {
      toastError(buildErrorMessage(error));
      reset();
    } else if (isSuccess) {
      toastInfo(`Deleted the ${!isFromPipeline ? 'agent' : 'pipeline'} successfully`);
    }
  }, [error, isError, isFromPipeline, isSuccess, reset, toastError, toastInfo]);

  return {
    name,
    onDelete,
    isLoading,
    canDelete: true, // Applications can always be deleted
    entityDisplayName: !isFromPipeline ? 'agent' : 'pipeline',
  };
};

export const useDeleteEntityMenu = (entityType, setBlockNav, disabled) => {
  const theme = useTheme();
  const { name, onDelete, isLoading } = useDeleteEntity(entityType, setBlockNav);

  const menuItem = useMemo(
    () => ({
      label: 'Delete',
      icon: (
        <DeleteIcon
          sx={{ fontSize: '16px' }}
          fill={isLoading ? theme.palette.icon.fill.disabled : theme.palette.icon.fill.default}
        />
      ),
      confirmText: `Are you sure you want to delete ${name}?`,
      alarm: true,
      disabled,
      entityName: name,
      onConfirm: onDelete,
    }),
    [disabled, isLoading, name, onDelete, theme.palette.icon.fill.disabled, theme.palette.icon.fill.default],
  );

  return {
    deleteMenuItem: menuItem,
  };
};

/**
 * Common DeleteButton component used by both Prompts and Applications
 * @param {Object} props
 * @param {string} props.entityType - 'prompts' or 'applications'
 * @param {function} props.setBlockNav - For applications to handle navigation blocking
 */
export default function DeleteButton({ entityType = 'applications', setBlockNav }) {
  const { name, onDelete, isLoading, canDelete, entityDisplayName } = useDeleteEntity(
    entityType,
    setBlockNav,
  );

  if (!canDelete) {
    return null;
  }

  return (
    <DeleteEntityButton
      name={name}
      entity_name={entityType}
      onDelete={onDelete}
      title={`Delete ${entityDisplayName}`}
      isLoading={isLoading}
    />
  );
}
