import { memo, useCallback, useMemo, useRef } from 'react';

import { useNavigate } from 'react-router-dom';

import {
  useDeleteConfirmationDisabled,
  useProjectType,
  useSelectedProjectId,
  useToast,
} from '@/[fsd]/shared/lib/hooks';
import { Controls } from '@/[fsd]/shared/ui';
import { useToolkitDeleteMutation } from '@/api/toolkits';
import { PERMISSIONS } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import useCheckPermission from '@/hooks/useCheckPermission';
import RouteDefinitions from '@/routes';

const AppDetailActions = memo(props => {
  const { appId, appName } = props;
  const projectId = useSelectedProjectId();
  const { isPrivate } = useProjectType();
  const { checkPermission } = useCheckPermission();
  const { toastError, toastSuccess } = useToast();
  const navigate = useNavigate();
  const [deleteToolkit, { isLoading }] = useToolkitDeleteMutation();
  const skipDeleteConfirmation = useDeleteConfirmationDisabled();
  const deletionInProgress = useRef(false);

  const canDelete = isPrivate || checkPermission(PERMISSIONS.toolkits.delete);
  const displayName = appName || 'Application';

  const onDelete = useCallback(async () => {
    if (!projectId || !appId || !canDelete || deletionInProgress.current) return;
    deletionInProgress.current = true;

    try {
      await deleteToolkit({ projectId, toolkitId: appId }).unwrap();
    } catch (error) {
      toastError(buildErrorMessage(error));
      return;
    } finally {
      deletionInProgress.current = false;
    }

    toastSuccess(`The ${displayName} application has been successfully deleted.`);
    navigate(RouteDefinitions.AppsApplications, { replace: true });
  }, [appId, canDelete, deleteToolkit, displayName, navigate, projectId, toastError, toastSuccess]);

  const menuItems = useMemo(
    () => [
      {
        key: 'app-detail-delete-application',
        label: 'Delete application',
        icon: <DeleteIcon fontSize="inherit" />,
        alarm: true,
        disabled: isLoading || !projectId || !appId,
        entityName: displayName,
        shouldRequestInputName: true,
        ...(skipDeleteConfirmation ? { onClick: onDelete } : { onConfirm: onDelete }),
      },
    ],
    [appId, displayName, isLoading, projectId, onDelete, skipDeleteConfirmation],
  );

  if (!appId || !canDelete) return null;

  return (
    <Controls.ControlsDropdown
      id="app-detail-actions"
      menuItems={menuItems}
    />
  );
});

AppDetailActions.displayName = 'AppDetailActions';

export default AppDetailActions;
