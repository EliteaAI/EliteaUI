import * as React from 'react';

import { useTrackEvent } from '@/GA';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { useLazyApplicationDetailsQuery } from '@/api/applications';
import { useLazyDatasourceExportQuery } from '@/api/datasources';
import { useLazyToolkitExportQuery } from '@/api/toolkits';
import {
  CollectionStatus,
  DEV,
  PUBLIC_PROJECT_ID,
  VITE_DEV_TOKEN,
  VITE_SERVER_URL,
} from '@/common/constants';
import { buildErrorMessage, downloadJSONFile } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

/**
 * Export formats supported
 * Note: Applications/Pipelines only support MD format
 * Datasources and Toolkits use JSON format
 */
export const ExportFormat = {
  JSON: 'json',
  MD: 'md',
};

export const useExport = ({ id, name, entity_name, owner_id, toastError, versions, currentVersionId }) => {
  const trackEvent = useTrackEvent();
  const [
    exportDatasource,
    { isError: isExportDatasourceError, error: exportDatasourceError, isFetching: isFetchingDatasource },
  ] = useLazyDatasourceExportQuery();
  const [
    exportToolkit,
    { isError: isExportToolkitError, error: exportToolkitError, isFetching: isFetchingToolkit },
  ] = useLazyToolkitExportQuery();
  const selectedProjectId = useSelectedProjectId();
  const projectId = React.useMemo(
    () => (selectedProjectId != owner_id && owner_id ? owner_id : selectedProjectId),
    [owner_id, selectedProjectId],
  );
  const isPublicApplication = React.useMemo(
    () => (entity_name === 'applications' || entity_name === 'pipelines') && projectId == PUBLIC_PROJECT_ID,
    [entity_name, projectId],
  );
  const [getApplicationDetail, { isFetching: isFetchingApplication }] = useLazyApplicationDetailsQuery();

  /**
   * Export entity
   * Applications/Pipelines export as MD format
   * Datasources/Toolkits export as JSON format
   */
  const doExport = React.useCallback(
    () => async () => {
      let data;
      switch (entity_name) {
        case 'datasources':
          // Datasources use JSON export
          data = await exportDatasource({ projectId, id });
          if (data?.error) return;
          downloadJSONFile(data, name);
          trackEvent(GA_EVENT_NAMES.ENTITY_EXPORTED, {
            [GA_EVENT_PARAMS.ENTITY_ID]: id || 'unknown',
            [GA_EVENT_PARAMS.ENTITY_NAME]: name || 'unknown',
            [GA_EVENT_PARAMS.ENTITY_TYPE]: 'datasources',
            [GA_EVENT_PARAMS.EXPORT_FORMAT]: 'json',
            [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
          });
          break;

        case 'applications':
        case 'pipelines': {
          // Applications/Pipelines use MD export only
          let applicationVersions = versions;
          if (isPublicApplication && !applicationVersions) {
            const entityDetails = await getApplicationDetail({ projectId, applicationId: id });
            applicationVersions = entityDetails?.data?.versions || [];
          }

          const params = new URLSearchParams();
          params.append('format', 'md');
          if (isPublicApplication && applicationVersions) {
            // For public applications (Agent Studio), export only published versions
            const publishedVersionIds =
              applicationVersions
                ?.filter(version => version.status === CollectionStatus.Published)
                .map(version => version.id) || [];
            if (publishedVersionIds.length) {
              params.append('follow_version_ids', publishedVersionIds.join(','));
            }
          } else if (currentVersionId) {
            // For non-public applications, export only the currently selected version
            params.append('follow_version_ids', currentVersionId.toString());
          }
          // Use programmatic download to avoid triggering beforeunload event (issue #3184)
          const exportUrl = `${VITE_SERVER_URL}/elitea_core/export_import/prompt_lib/${projectId}/${id}?${params.toString()}`;
          try {
            const headers = new Headers();
            if (DEV && VITE_DEV_TOKEN) {
              headers.set('Authorization', `Bearer ${VITE_DEV_TOKEN}`);
            }
            const response = await fetch(exportUrl, { headers });
            if (!response.ok) {
              throw new Error(`Export failed: ${response.status}`);
            }
            const blob = await response.blob();
            // Extract filename from Content-Disposition header or use default
            const contentDisposition = response.headers.get('Content-Disposition');
            const filenameMatch = contentDisposition?.match(/filename="?([^";\n]+)"?/);
            const filename = filenameMatch ? filenameMatch[1] : `${name}.md`;

            const blobUrl = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = blobUrl;
            anchor.download = filename;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(blobUrl);
            trackEvent(GA_EVENT_NAMES.ENTITY_EXPORTED, {
              [GA_EVENT_PARAMS.ENTITY_ID]: id || 'unknown',
              [GA_EVENT_PARAMS.ENTITY_NAME]: name || 'unknown',
              [GA_EVENT_PARAMS.ENTITY_TYPE]: entity_name,
              [GA_EVENT_PARAMS.EXPORT_FORMAT]: 'md',
              [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
            });
          } catch (error) {
            toastError(buildErrorMessage(error));
          }
          break;
        }

        case 'toolkits':
          // Toolkits use JSON export
          data = await exportToolkit({ projectId, id });
          if (data?.error) return;
          downloadJSONFile(data, name);
          trackEvent(GA_EVENT_NAMES.ENTITY_EXPORTED, {
            [GA_EVENT_PARAMS.ENTITY_ID]: id || 'unknown',
            [GA_EVENT_PARAMS.ENTITY_NAME]: name || 'unknown',
            [GA_EVENT_PARAMS.ENTITY_TYPE]: 'toolkits',
            [GA_EVENT_PARAMS.EXPORT_FORMAT]: 'json',
            [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
          });
          break;

        default:
          break;
      }
    },
    [
      currentVersionId,
      entity_name,
      exportDatasource,
      exportToolkit,
      getApplicationDetail,
      id,
      isPublicApplication,
      name,
      projectId,
      toastError,
      trackEvent,
      versions,
    ],
  );

  React.useEffect(() => {
    const hasError = isExportDatasourceError || isExportToolkitError;
    if (hasError) {
      toastError(buildErrorMessage(exportDatasourceError || exportToolkitError));
    }
  }, [exportToolkitError, exportDatasourceError, isExportToolkitError, isExportDatasourceError, toastError]);

  return {
    doExport,
    isExporting: isFetchingDatasource || isFetchingToolkit || isFetchingApplication,
  };
};
