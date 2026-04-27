import { useCallback, useEffect, useMemo } from 'react';

import { useFormikContext } from 'formik';
import { useNavigate, useParams } from 'react-router-dom';

import { useToolkitDeleteMutation } from '@/api/toolkits';
import { buildErrorMessage } from '@/common/utils';
import DeleteEntityButton from '@/components/DeleteEntityButton';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';
import { useTheme } from '@emotion/react';

const useDeleteToolkit = (setBlockNav, isMCP) => {
  const projectId = useSelectedProjectId();
  const { toolkitId, mcpId } = useParams();
  const { values: { name, toolkit_name, settings } = {} } = useFormikContext();
  const navigate = useNavigate();
  const [deleteToolkit, { isLoading, error, isError, isSuccess, reset }] = useToolkitDeleteMutation();

  const onCloseToast = useCallback(() => {
    if (isError) {
      reset();
    } else if (isSuccess) {
      setBlockNav(false);
      setTimeout(() => {
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          navigate(
            (!isMCP ? RouteDefinitions.ToolkitsWithTab : RouteDefinitions.MCPsWithTab).replace(':tab', 'all'),
            {
              replace: true,
            },
          );
        }
      }, 0);
    }
  }, [isError, isMCP, isSuccess, navigate, reset, setBlockNav]);

  const toastProps = useMemo(() => ({ onCloseToast }), [onCloseToast]);
  const { toastInfo, toastError } = useToast(toastProps);
  const onDelete = useCallback(async () => {
    await deleteToolkit({ projectId, toolkitId: !isMCP ? toolkitId : mcpId });
  }, [deleteToolkit, isMCP, mcpId, projectId, toolkitId]);

  useEffect(() => {
    if (isError) {
      toastError(buildErrorMessage(error));
      reset();
    } else if (isSuccess) {
      toastInfo('Deleted the toolkit successfully');
    }
  }, [error, isError, isSuccess, reset, toastError, toastInfo]);

  return {
    name: name || toolkit_name || settings?.alita_title || settings?.configuration_title || 'Toolkit',
    onDelete,
    isLoading,
  };
};

export const useDeleteToolkitMenu = (setBlockNav, disabled, isMCP) => {
  const theme = useTheme();
  const { name, onDelete, isLoading } = useDeleteToolkit(setBlockNav, isMCP);
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
    deleteToolkitMenuItem: menuItem,
  };
};

export default function DeleteToolkitButton({ setBlockNav, isMCP }) {
  const { name, onDelete, isLoading } = useDeleteToolkit(setBlockNav, isMCP);
  return (
    <DeleteEntityButton
      name={name}
      entity_name={'toolkits'}
      onDelete={onDelete}
      title={'Delete toolkit'}
      isLoading={isLoading}
    />
  );
}
