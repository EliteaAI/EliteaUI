import { memo, useMemo } from 'react';

import { useParams, useSearchParams } from 'react-router-dom';

import { RunHistoryApi } from '@/[fsd]/entities/run-history/api';
import {
  RUN_ANALYTICS_TIMESTAMP_FORMAT,
  formatRunTimestamp,
  toRunISOString,
} from '@/[fsd]/entities/run-history/lib/helpers';
import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import { AnalyticCommonHelpers, AnalyticsExportHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { RunAnalyticsView } from '@/[fsd]/features/settings/ui/analytics';
import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';
import Breadcrumbs from '@/[fsd]/shared/ui/breadcrumbs';
import { useApplicationDetailsQuery } from '@/api/applications';
import { SearchParams } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const { ParticipantEntityTypes } = ParticipantEntityConstants;
const { RUN_SCOPE_TYPE, RUN_NO_DATA_MESSAGE } = AnalyticsCommonConstants;

/**
 * Agent/Pipeline Run History → Analytics (#6816): one run, identified by `history_run_id`.
 */
const RunAnalyticsContainer = memo(props => {
  const { source } = props;

  const { agentId } = useParams();
  const [searchParams] = useSearchParams();
  const runId = searchParams.get(SearchParams.HistoryRunId);
  const projectId = useSelectedProjectId();

  const { data: entityDetails } = useApplicationDetailsQuery(
    { projectId, applicationId: agentId },
    { skip: !projectId || !agentId },
  );
  const { data: runDetails, isLoading: isRunLoading } = RunHistoryApi.useGetRunHistoryDetailsQuery(
    { projectId, conversationId: runId },
    { skip: !projectId || !runId },
  );

  // `history_run_id` is the numeric conversation id Run History selects by; analytics is keyed by its UUID
  const runScope = useMemo(
    () => AnalyticCommonHelpers.buildRunScope(RUN_SCOPE_TYPE.run, runDetails?.uuid),
    [runDetails?.uuid],
  );

  // The version the run executed with, not the one currently open in the editor
  const { date, version, createdAt } = useMemo(() => {
    const versionId = runDetails?.meta?.single_participant?.entity_settings?.version_id;

    return {
      createdAt: runDetails?.created_at,
      date: runDetails ? formatRunTimestamp(runDetails.created_at, RUN_ANALYTICS_TIMESTAMP_FORMAT) : '—',
      version: entityDetails?.versions?.find(v => v.id === versionId)?.name ?? '—',
    };
  }, [runDetails, entityDetails?.versions]);

  const infoLines = useMemo(() => [`Run: ${date} · Version: ${version}`], [date, version]);

  const exportMeta = useMemo(
    () => ({
      entityName: entityDetails?.name ?? '',
      fileSuffix: `run-${runId}`,
      scopeRows: [
        [source === ParticipantEntityTypes.Pipeline ? 'Pipeline' : 'Agent', entityDetails?.name ?? ''],
        ['Run ID', runId],
        ['Run Date/Time', AnalyticsExportHelpers.fmtRunDateTime(toRunISOString(createdAt))],
        ['Version', version],
      ],
    }),
    [entityDetails?.name, runId, source, createdAt, version],
  );

  return (
    <RunAnalyticsView
      runScope={runScope}
      breadcrumbs={<Breadcrumbs />}
      infoLines={infoLines}
      exportMeta={exportMeta}
      missingRunMessage={RUN_NO_DATA_MESSAGE}
      isRunLoading={isRunLoading}
    />
  );
});

RunAnalyticsContainer.displayName = 'RunAnalyticsContainer';

export default RunAnalyticsContainer;
