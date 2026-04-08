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

const useDeleteApplication = setBlockNav => {
  const isFromPipeline = useIsFromPipelineDetail();
  const projectId = useSelectedProjectId();
  const { agentId: applicationId } = useParams();
  const { values: { name } = {} } = useFormikContext();
  const navigate = useNavigate();
  const [deleteApplication, { isLoading, error, isError, isSuccess, reset }] = useDeleteApplicationMutation();

  const onCloseToast = useCallback(() => {
    if (isError) {
      reset();
    } else if (isSuccess) {
      setBlockNav(false);
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
    isFromPipeline,
    isLoading,
  };
};

export const useDeleteApplicationMenu = (setBlockNav, disabled) => {
  const theme = useTheme();
  const { name, onDelete, isLoading } = useDeleteApplication(setBlockNav);
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
    deleteApplicationMenuItem: menuItem,
  };
};

export default function DeleteApplicationButton({ setBlockNav }) {
  const { name, onDelete, isFromPipeline, isLoading } = useDeleteApplication(setBlockNav);
  return (
    <DeleteEntityButton
      name={name}
      entity_name={'applications'}
      onDelete={onDelete}
      title={`Delete ${!isFromPipeline ? 'agent' : 'pipeline'}`}
      isLoading={isLoading}
    />
  );
}
