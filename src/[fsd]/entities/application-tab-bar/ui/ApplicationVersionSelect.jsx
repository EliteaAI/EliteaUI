import { memo, useCallback, useEffect, useMemo } from 'react';

import { useFormikContext } from 'formik';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import { buildVersionOption } from '@/[fsd]/entities/version/lib/helpers';
import { useSetDefaultVersion } from '@/[fsd]/entities/version/lib/hooks';
import { VersionSelect } from '@/[fsd]/entities/version/ui';
import { eliteaApi } from '@/api/eliteaApi';
import { useLazyGetApplicationVersionDetailQuery } from '@/api/applications';
import { PUBLIC_PROJECT_ID, ViewMode } from '@/common/constants';
import { replaceVersionInPath } from '@/common/utils';
import { useToolsValidationInfo } from '@/hooks/application/useValidateApplicationVersion';
import { useViewModeFromUrl } from '@/hooks/useSearchParamValue';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const ApplicationVersionSelect = memo(props => {
  const { disabled, onSuccess, enableVersionListAvatar = false, isFromPipeline = false } = props;

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { agentId, version } = useParams();
  const [searchParams] = useSearchParams();
  const { pathname, search } = useLocation();

  const selectedProjectId = useSelectedProjectId();

  const viewMode = useViewModeFromUrl();

  const formik = useFormikContext();
  const { values: { version_details: { id: versionIdFromDetail } = {}, versions = [] } = {} } = formik;

  const { handleSetDefaultVersion, setDefaultVersionDialog } = useSetDefaultVersion(onSuccess);

  const [getVersionDetail] = useLazyGetApplicationVersionDetailQuery();

  const isFromCreation = useMemo(() => searchParams.get('isFromCreation') === 'true', [searchParams]);
  const applicationId = useMemo(() => parseInt(agentId, 10), [agentId]);

  const projectId = useMemo(
    () => (viewMode === ViewMode.Owner ? selectedProjectId : PUBLIC_PROJECT_ID),
    [selectedProjectId, viewMode],
  );

  const formikVersionData = useMemo(
    () => ({
      version_details: formik.values?.version_details,
      versions: formik.values?.versions || [],
    }),
    [formik.values],
  );

  const defaultVersionID = useMemo(() => {
    const defaultIDFromFormik = formik?.values?.meta?.default_version_id;
    if (defaultIDFromFormik) return defaultIDFromFormik;

    return formik?.values?.versions?.find(v => v.name === LATEST_VERSION_NAME)?.id ?? null;
  }, [formik?.values?.meta?.default_version_id, formik?.values?.versions]);

  const versionId = formik.values?.version_details?.id;
  const tools = formik.values?.version_details?.tools;

  const { totalValidationInfo } = useToolsValidationInfo({
    applicationId,
    projectId,
    versionId,
    tools,
  });

  const errorVersionName = useMemo(() => {
    if (totalValidationInfo.length === 0) return '';
    return formik.values?.version_details?.name || '';
  }, [totalValidationInfo.length, formik.values?.version_details?.name]);

  const currentVersionId = useMemo(() => {
    if (isFromCreation) return version;

    // If we have a URL version parameter, validate it exists in versions array
    if (version && versions.length > 0) {
      const foundVersion = versions.find(v => String(v.id) === String(version));

      if (foundVersion) return foundVersion.id;
    }

    // If version from detail exists in versions array, use it
    if (versionIdFromDetail && versions.length > 0) {
      const foundVersion = versions.find(v => String(v.id) === String(versionIdFromDetail));
      if (foundVersion) return foundVersion.id;
    }

    // Default to LATEST_VERSION_NAME version if it exists
    if (versions.length > 0) {
      const latestVersion = versions.find(v => v.name === LATEST_VERSION_NAME);

      if (latestVersion) return latestVersion.id;

      // Fallback to first version if no LATEST_VERSION_NAME
      return versions[0].id;
    }

    return null;
  }, [isFromCreation, version, versionIdFromDetail, versions]);

  // Fix: Use currentVersionId directly as the value for the dropdown
  const currentVersion = useMemo(() => {
    // Don't try to set a value if there are no versions yet
    if (!versions.length || !currentVersionId) return null;

    // Ensure the currentVersionId exists in the versionSelectOptions
    const hasMatchingOption = [...versions]
      .map(buildVersionOption({ enableVersionListAvatar, defaultVersionID }))
      .some(option => String(option.value) === String(currentVersionId));
    return hasMatchingOption ? currentVersionId : null;
  }, [currentVersionId, defaultVersionID, enableVersionListAvatar, versions]);

  const handleVersionChange = useCallback(
    async newVersionId => {
      // Custom logic for Applications version change
      const result = await getVersionDetail({
        projectId: formik.values?.owner_id,
        applicationId,
        versionId: newVersionId,
      });

      dispatch(
        eliteaApi.util.updateQueryData(
          viewMode === ViewMode.Public ? 'publicApplicationDetails' : 'applicationDetails',
          { applicationId, projectId: formik.values?.owner_id },
          details => {
            details.version_details = result.data;
          },
        ),
      );
    },
    [getVersionDetail, dispatch, viewMode, applicationId, formik.values?.owner_id],
  );

  const getDetail = useCallback(
    async vId => {
      const result = await getVersionDetail({ projectId, applicationId, versionId: vId });

      dispatch(
        eliteaApi.util.updateQueryData(
          viewMode === ViewMode.Public ? 'publicApplicationDetails' : 'applicationDetails',
          { applicationId, projectId },
          details => {
            details.version_details = result.data;

            if (isFromCreation && !details.versions.find(item => item.id == vId)) {
              details.versions = [
                ...details.versions,
                {
                  id: result.data.id,
                  name: result.data.name,
                  status: result.data.status,
                  created_at: result.data.created_at,
                  meta: { ...(result.data.meta || {}) },
                },
              ];
            }
          },
        ),
      );
    },
    [applicationId, dispatch, getVersionDetail, isFromCreation, projectId, viewMode],
  );

  useEffect(() => {
    // If URL has a version parameter, validate it exists
    if (version) {
      const versionExists = versions.find(item => String(item.id) === String(version));

      if (versionExists || isFromCreation) {
        getDetail(version);
      } else if (versions.length > 0) {
        // Version in URL doesn't exist, redirect to LATEST_VERSION_NAME
        const latestVersion = versions.find(item => item.name === LATEST_VERSION_NAME);
        const defaultVersion = versions.find(item => item.id === defaultVersionID);
        const redirectVersion = defaultVersion || latestVersion || versions[0];
        const newPath = replaceVersionInPath(redirectVersion.id, pathname, version, applicationId);

        navigate({ pathname: newPath, search }, { replace: true });
      }

      return;
    }

    if (versions.length > 0) {
      // No version in URL, load LATEST_VERSION_NAME
      const latestVersion = versions.find(item => item.name === LATEST_VERSION_NAME);
      const defaultVersion = versions.find(item => item.id === defaultVersionID);
      const targetVersion = defaultVersion || latestVersion || versions[0];

      if (String(currentVersion) !== String(targetVersion.id)) getDetail(targetVersion.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, versions, isFromCreation, defaultVersionID]);

  return (
    <>
      <VersionSelect
        useFormikVersions
        entityType="application"
        enableVersionListAvatar={enableVersionListAvatar}
        isFromPipeline={isFromPipeline}
        disabled={disabled}
        getVersionDetailQuery={getVersionDetail}
        entityId={applicationId}
        formikVersionData={formikVersionData}
        onVersionChange={handleVersionChange}
        defaultVersionID={defaultVersionID}
        handleSetDefaultVersion={handleSetDefaultVersion}
        errorVersionName={errorVersionName}
      />
      {setDefaultVersionDialog}
    </>
  );
});

ApplicationVersionSelect.displayName = 'ApplicationVersionSelect';

export default ApplicationVersionSelect;
