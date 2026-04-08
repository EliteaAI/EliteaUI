import { useCallback, useMemo, useState } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { useDeleteConfigurationMutation, useMakeConfigurationDefaultMutation } from '@/api/configurations';
import { ViewMode } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';

export const useCredentialActions = ({ integration, refetch }) => {
  const navigate = useNavigate();
  const { state: locationState } = useLocation();
  const { routeStack = [] } = useMemo(() => locationState || { routeStack: [] }, [locationState]);

  const projectId = useSelectedProjectId();
  const [deleteConfiguration] = useDeleteConfigurationMutation();
  const [makeDefaultConfiguration] = useMakeConfigurationDefaultMutation();

  const [showActions, setShowActions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);

  const { toastError, toastSuccess, toastInfo } = useToast();

  const shouldDisableActions = useMemo(
    () => integration.project_id === null && integration.is_default,
    [integration.is_default, integration.project_id],
  );

  const onClickDelete = useCallback(event => {
    event.stopPropagation();
    setShowActions(false);
    setOpenAlert(true);
  }, []);

  const onCloseAlert = useCallback(event => {
    event.stopPropagation();
    setOpenAlert(false);
  }, []);

  const onConfirmAlert = useCallback(
    async event => {
      onCloseAlert(event);
      if (!isProcessing) {
        setIsProcessing(true);
        const { error } = await deleteConfiguration({
          projectId,
          configId: integration.originalId || integration.id || integration.uuid,
          section: integration.section,
        });
        if (!error) {
          await refetch();
          toastInfo('The credential has been deleted');
        } else {
          toastError(error?.status === 403 ? 'The action is not allowed' : buildErrorMessage(error));
        }
        setIsProcessing(false);
      }
    },
    [
      onCloseAlert,
      isProcessing,
      deleteConfiguration,
      projectId,
      integration.originalId,
      integration.id,
      integration.uuid,
      integration.section,
      refetch,
      toastInfo,
      toastError,
    ],
  );

  const onClickActions = useCallback(() => {
    if (!shouldDisableActions) {
      setShowActions(true);
    }
  }, [shouldDisableActions]);

  const onCloseMenu = useCallback(() => {
    setShowActions(false);
  }, []);

  const onEditAction = useCallback(() => {
    setShowActions(false);
    const newRouteStack = [...routeStack];

    if (newRouteStack.length) {
      newRouteStack[newRouteStack.length - 1].pagePath = RouteDefinitions.CredentialsWithTab.replace(
        ':tab',
        'all',
      );
    }
    const pagePath = `${RouteDefinitions.EditCredentialFromMain.replace(':uid', integration.uuid || integration.uid)}`;
    newRouteStack.push({
      breadCrumb: integration?.settings?.title || integration?.title || integration?.config?.name || '',
      viewMode: ViewMode.Owner,
      pagePath,
    });
    navigate(
      {
        pathname: pagePath,
      },
      { state: { routeStack: newRouteStack } },
    );
  }, [
    integration?.config?.name,
    integration?.settings?.title,
    integration?.title,
    integration.uuid,
    integration.uid,
    navigate,
    routeStack,
  ]);

  const onMakeItDefaultAction = useCallback(async () => {
    setShowActions(false);
    if (!isProcessing) {
      setIsProcessing(true);
      const { error } = await makeDefaultConfiguration({
        projectId,
        configId: integration.originalId || integration.id || integration.uuid,
        is_shared: integration.config?.is_shared || integration.shared,
      });

      if (!error) {
        await refetch();
        toastSuccess('The credential has been set as default');
      } else {
        toastError(buildErrorMessage(error));
      }
      setIsProcessing(false);
    }
  }, [
    integration.config,
    integration.shared,
    integration.originalId,
    integration.id,
    integration.uuid,
    isProcessing,
    makeDefaultConfiguration,
    projectId,
    refetch,
    toastError,
    toastSuccess,
  ]);

  return {
    isProcessing,
    showActions,
    openAlert,
    onClickActions,
    onCloseMenu,
    onEditAction,
    onClickDelete,
    onCloseAlert,
    onConfirmAlert,
    onMakeItDefaultAction,
    shouldDisableActions,
  };
};
