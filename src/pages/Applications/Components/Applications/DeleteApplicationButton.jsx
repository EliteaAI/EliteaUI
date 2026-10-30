import { useCallback, useEffect, useMemo } from 'react';

import { useFormikContext } from 'formik';
import { useNavigate, useParams } from 'react-router-dom';

import { useIsFromPipelineDetail, useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { useDeleteApplicationMutation } from '@/api/applications';
import { PrivateApplicationTabs } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import DeleteEntityButton from '@/components/DeleteEntityButton';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import RouteDefinitions from '@/routes';
import { useTheme } from '@emotion/react';

const useDeleteApplication = setBlockNav => {
  const isFromPipeline = useIsFromPipelineDetail();
  const projectId = useSelectedProjectId();
  const { agentId: applicationId, tab } = useParams();
  const { values: { name } = {} } = useFormikContext();
  const navigate = useNavigate();
  const [deleteApplication, { isLoading, error, isError, isSuccess, reset }] = useDeleteApplicationMutation();

  const onCloseToast = useCallback(() => {
    if (isError) {
      reset();
    } else if (isSuccess && !isFromPipeline) {
      setBlockNav(false);
      setTimeout(() => {
        navigate(-1);
      }, 0);
    }
  }, [isError, isFromPipeline, isSuccess, navigate, reset, setBlockNav]);

  const toastProps = useMemo(() => ({ onCloseToast }), [onCloseToast]);
  const { toastSuccess, toastError } = useToast(toastProps);
  const onDelete = useCallback(async () => {
    const entityType = !isFromPipeline ? 'agent' : 'pipeline';
    await deleteApplication({ projectId, applicationId, entityType });
  }, [deleteApplication, projectId, applicationId, isFromPipeline]);

  useEffect(() => {
    if (isError) {
      toastError(buildErrorMessage(error));
      reset();
    } else if (isSuccess) {
      const entityType = !isFromPipeline ? 'agent' : 'pipeline';
      toastSuccess(`The ${name || entityType} ${entityType} has been successfully deleted.`);
      if (isFromPipeline) {
        // The deleted pipeline has no page to stay on; the toast close callback is not reliable for this
        setBlockNav(false);
        setTimeout(() => {
          navigate(`${RouteDefinitions.Pipelines}/${tab || PrivateApplicationTabs[0]}`, { replace: true });
        }, 0);
      }
    }
  }, [
    error,
    isError,
    isFromPipeline,
    isSuccess,
    name,
    navigate,
    reset,
    setBlockNav,
    tab,
    toastError,
    toastSuccess,
  ]);

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
      key: 'delete-agent',
      label: 'Delete',
      icon: (
        <DeleteIcon
          sx={{ fontSize: '16px' }}
          fill={isLoading ? theme.palette.icon.disabled : theme.palette.icon.default}
        />
      ),
      confirmText: `Are you sure you want to delete ${name}?`,
      alarm: true,
      disabled,
      entityName: name,
      onConfirm: onDelete,
    }),
    [disabled, isLoading, name, onDelete, theme.palette.icon.disabled, theme.palette.icon.default],
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
