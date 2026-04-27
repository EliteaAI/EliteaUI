import { useCallback, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';
import { useDispatch } from 'react-redux';

import { SetDefaultVersionDialog } from '@/[fsd]/entities/version/ui';
import { alitaApi } from '@/api/alitaApi';
import { useSetApplicationDefaultVersionMutation } from '@/api/applications';
import { ViewMode } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import { useViewModeFromUrl } from '@/hooks/useSearchParamValue';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

export const useSetDefaultVersion = onSuccess => {
  const dispatch = useDispatch();
  const projectId = useSelectedProjectId();
  const { toastSuccess, toastError } = useToast();
  const viewMode = useViewModeFromUrl();

  const formikContext = useFormikContext();
  const { values: { id: applicationId, owner_id, versions = [] } = {} } = formikContext;

  const [setDefaultVersion, { isLoading: isSettingDefaultVersion, reset }] =
    useSetApplicationDefaultVersionMutation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingVersionId, setPendingVersionId] = useState(null);

  const pendingVersionName = useMemo(() => {
    if (!pendingVersionId) return '';

    const version = versions.find(v => v.id === pendingVersionId);
    return version?.name || '';
  }, [pendingVersionId, versions]);

  const handleOpenConfirmDialog = useCallback(versionId => {
    setPendingVersionId(versionId);
    setIsDialogOpen(true);
  }, []);

  const handleCloseConfirmDialog = useCallback(() => {
    setIsDialogOpen(false);
    setPendingVersionId(null);
  }, []);

  const handleConfirmSetDefaultVersion = useCallback(async () => {
    if (!pendingVersionId) return;

    const { error } = await setDefaultVersion({
      projectId: owner_id || projectId,
      applicationId,
      version_id: pendingVersionId,
    });

    if (!error) {
      toastSuccess('Default version has been set successfully');

      dispatch(
        alitaApi.util.updateQueryData(
          viewMode === ViewMode.Public ? 'publicApplicationDetails' : 'applicationDetails',
          { applicationId, projectId: owner_id || projectId },
          details => {
            if (!details.meta) details.meta = {};

            details.meta.default_version_id = pendingVersionId;
          },
        ),
      );

      handleCloseConfirmDialog();
      onSuccess?.();
      setTimeout(() => {
        reset();
      }, 0);
    } else {
      toastError(buildErrorMessage(error));
      setTimeout(() => {
        reset();
      }, 0);
    }
  }, [
    applicationId,
    dispatch,
    handleCloseConfirmDialog,
    onSuccess,
    owner_id,
    pendingVersionId,
    projectId,
    reset,
    setDefaultVersion,
    toastError,
    toastSuccess,
    viewMode,
  ]);

  const setDefaultVersionDialog = (
    <SetDefaultVersionDialog
      open={isDialogOpen}
      onClose={handleCloseConfirmDialog}
      onConfirm={handleConfirmSetDefaultVersion}
      confirming={isSettingDefaultVersion}
      versionName={pendingVersionName}
    />
  );

  return {
    handleSetDefaultVersion: handleOpenConfirmDialog,
    isSettingDefaultVersion,
    setDefaultVersionDialog,
  };
};
