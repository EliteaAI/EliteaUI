import { useCallback, useMemo } from 'react';

import {
  COMPARE_MESSAGES,
  extractAgentCompareDataForPublic,
  extractPublicAgentCompareData,
  findPublicParentApplicationId,
  loadNestedAgents,
  matchNestedAgents,
  resolveLinkedPublicVersionName,
} from '@/[fsd]/entities/compare-versions';
import {
  useLazyGetApplicationVersionDetailQuery,
  useLazyPublicApplicationDetailsQuery,
  usePublicApplicationDetailsQuery,
} from '@/api/applications';
import { CollectionStatus, PUBLIC_PROJECT_ID } from '@/common/constants';

const PREFER_CACHED_RESULT = true;

const pickMeta = detail => ({
  id: detail.id,
  name: detail.name,
  created_at: detail.created_at,
  author: detail.author,
  author_name: detail.author_name,
  author_email: detail.author_email,
});

const getPublicVersionDetail = response => response?.version_details ?? response;

/**
 * Compare a version of a forked agent with a published version of the public agent it was forked from.
 *
 * Everything is read, nothing is saved. The public side is read from the catalog endpoint, which also serves the
 * copies of its sub-agents (they live in the public project and are not listed in the catalog) and keeps its toolkits
 * as definitions in the version meta.
 *
 * @param {object} options
 * @param {number|string} options.projectId the project of the forked agent
 * @param {number|string} options.applicationId the forked agent
 * @param {object} options.versionMeta the meta of the open version: it says which public agent it was forked from
 * @param {object[]} options.versions the versions of the forked agent
 * @param {boolean} options.open the dialog is open: the public versions are only requested then
 */
export const useComparePublicAgentVersions = ({ projectId, applicationId, versionMeta, versions, open }) => {
  const publicApplicationId = useMemo(
    () => findPublicParentApplicationId({ versionMeta, versions, publicProjectId: PUBLIC_PROJECT_ID }),
    [versionMeta, versions],
  );

  const [fetchLocalVersion] = useLazyGetApplicationVersionDetailQuery();
  const [fetchPublicApplication] = useLazyPublicApplicationDetailsQuery();

  const {
    data: publicApplication,
    error: publicError,
    isFetching: isLoadingPublicVersions,
  } = usePublicApplicationDetailsQuery(
    { applicationId: publicApplicationId },
    { skip: !open || !publicApplicationId },
  );

  // Embedded versions are the copies of sub-agents: only the versions published for the catalog are offered
  const publicVersions = useMemo(
    () =>
      (publicApplication?.versions ?? []).filter(version => version.status === CollectionStatus.Published),
    [publicApplication?.versions],
  );

  const loadVersions = useCallback(
    async (leftId, rightId) => {
      const publicVersion = publicVersions.find(version => version.id === rightId);
      if (!publicVersion) throw new Error('The public version is not available');

      const [leftDetail, publicResponse] = await Promise.all([
        fetchLocalVersion({ projectId, applicationId, versionId: leftId }, PREFER_CACHED_RESULT).unwrap(),
        fetchPublicApplication(
          { applicationId: publicApplicationId, versionName: publicVersion.name },
          PREFER_CACHED_RESULT,
        ).unwrap(),
      ]);
      const rightDetail = getPublicVersionDetail(publicResponse);

      const fetchLocalChild = async tool => {
        const detail = await fetchLocalVersion(
          {
            projectId,
            applicationId: tool.settings.application_id,
            versionId: tool.settings.application_version_id,
          },
          PREFER_CACHED_RESULT,
        ).unwrap();
        return { data: extractAgentCompareDataForPublic(detail), tools: detail.tools };
      };

      // A sub-agent of the public version is a copy in the public project: it is read there, by its application.
      // The endpoint answers with the copy's newest version unless it is asked for one by name, so the version the
      // public version links to is found in that first answer and read when it is another one.
      const fetchPublicChild = async tool => {
        const copyApplicationId = tool.settings.application_id;
        let response = await fetchPublicApplication(
          { applicationId: copyApplicationId },
          PREFER_CACHED_RESULT,
        ).unwrap();
        const linkedVersionName = resolveLinkedPublicVersionName(
          response,
          tool.settings.application_version_id,
        );
        if (linkedVersionName) {
          response = await fetchPublicApplication(
            { applicationId: copyApplicationId, versionName: linkedVersionName },
            PREFER_CACHED_RESULT,
          ).unwrap();
        }
        const detail = getPublicVersionDetail(response);
        return { data: extractPublicAgentCompareData(detail), tools: detail.tools };
      };

      // A branch that cannot be read is kept as unavailable by the loader, so the rest still compares
      const [leftNested, rightNested] = await Promise.all([
        loadNestedAgents({ tools: leftDetail.tools, fetchChild: fetchLocalChild }),
        loadNestedAgents({ tools: rightDetail.tools, fetchChild: fetchPublicChild }),
      ]);

      return {
        leftData: extractAgentCompareDataForPublic(leftDetail),
        rightData: extractPublicAgentCompareData(rightDetail),
        leftVersionMeta: pickMeta(leftDetail),
        rightVersionMeta: pickMeta(rightDetail),
        nestedRows: matchNestedAgents(leftNested, rightNested),
      };
    },
    [
      applicationId,
      fetchLocalVersion,
      fetchPublicApplication,
      projectId,
      publicApplicationId,
      publicVersions,
    ],
  );

  return {
    publicApplicationId,
    publicVersions,
    isLoadingPublicVersions,
    publicLoadError: publicError ? COMPARE_MESSAGES.publicLoadFailed : '',
    loadVersions,
  };
};
