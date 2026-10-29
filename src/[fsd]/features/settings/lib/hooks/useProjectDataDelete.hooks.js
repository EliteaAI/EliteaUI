import { useCallback, useMemo } from 'react';

import { useSelector } from 'react-redux';

import { useDeleteProjectDataMutation, useProjectDataSummaryQuery } from '@/[fsd]/features/settings/api';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { PERMISSIONS } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import useCheckPermission from '@/hooks/useCheckPermission';

export const useCanDeleteProjectData = () => {
  const projectId = useSelectedProjectId();
  const personalProjectId = useSelector(state => state.user?.personal_project_id);
  const { checkPermission } = useCheckPermission();

  // A private project makes its owner an editor, not an admin; owning it stands in for the permission
  const isPersonalProject = Boolean(personalProjectId) && String(projectId) === String(personalProjectId);

  return checkPermission(PERMISSIONS.projectData.delete) || isPersonalProject;
};

export const useProjectDataDelete = () => {
  const projectId = useSelectedProjectId();
  const { toastError, toastInfo, toastWarning } = useToast();

  const { data: summary, isFetching: isCountsLoading } = useProjectDataSummaryQuery(
    { projectId },
    { skip: !projectId, refetchOnMountOrArgChange: true },
  );
  const [deleteProjectData, { isLoading: isDeleting }] = useDeleteProjectDataMutation();

  // type -> { count, blocked }, or null when the backend could not count it
  const counts = useMemo(() => summary?.types || {}, [summary]);

  const doDelete = useCallback(
    async types => {
      if (!projectId || !types?.length) return false;

      try {
        const result = await deleteProjectData({ projectId, types }).unwrap();
        const totals = Object.values(result.types || {}).reduce(
          (acc, item) => ({
            deleted: acc.deleted + (item.deleted || 0),
            failed: acc.failed + (item.failed || 0),
            skipped: acc.skipped + (item.skipped || 0),
          }),
          { deleted: 0, failed: 0, skipped: 0 },
        );
        const skippedNote = totals.skipped
          ? ` ${totals.skipped} item(s) were skipped (published, or created by ELITEA).`
          : '';
        if (result.status === 'incomplete') {
          // The run hit its time limit: what is left stays, running again finishes it
          toastWarning(
            `Deleted ${totals.deleted} item(s), but the deletion did not finish in time. Run it again to delete the rest.${skippedNote}`,
          );
        } else if (result.status === 'success' && !totals.skipped) {
          toastInfo(`Deleted ${totals.deleted} item(s).`);
        } else if (result.status === 'success') {
          toastWarning(`Deleted ${totals.deleted} item(s).${skippedNote}`);
        } else if (result.status === 'partial') {
          toastWarning(
            `Deleted ${totals.deleted} item(s); ${totals.failed} could not be deleted.${skippedNote}`,
          );
        } else {
          toastError(`Nothing was deleted; ${totals.failed} item(s) failed.${skippedNote}`);
        }
        return true;
      } catch (error) {
        toastError(buildErrorMessage(error) || 'Failed to delete project data.');
        return false;
      }
    },
    [deleteProjectData, projectId, toastError, toastInfo, toastWarning],
  );

  return { counts, isCountsLoading, isDeleting, doDelete };
};
