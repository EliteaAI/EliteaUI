import { memo, useMemo } from 'react';

import { useParams, useSearchParams } from 'react-router-dom';

import { RunHistoryApi } from '@/[fsd]/entities/run-history/api';
import {
  RUN_ANALYTICS_TIMESTAMP_FORMAT,
  formatRunTimestamp,
  toRunISOString,
} from '@/[fsd]/entities/run-history/lib/helpers';
import { useAnalyticsRunDetailQuery } from '@/[fsd]/features/settings/api/analyticsApi';
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

const readSingleParticipantVersionId = runDetails =>
  runDetails?.meta?.single_participant?.entity_settings?.version_id;

/**
 * Agent/Pipeline Run History → Analytics (#6816): one run, identified by `history_run_id`.
 */
const RunAnalyticsContainer = memo(props => {
  const {
    source,
    entityDetails: providedEntityDetails,
    entityLabel,
    breadcrumbs = <Breadcrumbs />,
    readRunVersionId = readSingleParticipantVersionId,
    rootEntity,
  } = props;
  const isEntityScoped = Boolean(rootEntity);

  const { agentId } = useParams();
  const [searchParams] = useSearchParams();
  const runId = searchParams.get(SearchParams.HistoryRunId);
  const projectId = useSelectedProjectId();

  const { data: applicationDetails } = useApplicationDetailsQuery(
    { projectId, applicationId: agentId },
    { skip: Boolean(providedEntityDetails) || !projectId || !agentId },
  );
  const entityDetails = providedEntityDetails ?? applicationDetails;
  const { data: runDetails, isLoading: isRunLoading } = RunHistoryApi.useGetRunHistoryDetailsQuery(
    { projectId, conversationId: runId },
    { skip: !projectId || !runId },
  );

  // `history_run_id` is the numeric conversation id Run History selects by; analytics is keyed by its UUID
  const runScope = useMemo(
    () => AnalyticCommonHelpers.buildRunScope(RUN_SCOPE_TYPE.run, runDetails?.uuid, rootEntity),
    [runDetails?.uuid, rootEntity],
  );

  const { data: runDetail, isFetching: isRunDetailFetching } = useAnalyticsRunDetailQuery(
    { projectId, ...runScope?.queryArgs },
    { skip: !isEntityScoped || !projectId || !runScope },
  );

  // The version the run executed with, not the one currently open in the editor
  const { date, version, model, createdAt } = useMemo(() => {
    const usageVersionIds = isEntityScoped ? runDetail?.root_entity_version_ids : undefined;
    const versionIds = usageVersionIds?.length ? usageVersionIds : [readRunVersionId(runDetails)];

    return {
      createdAt: runDetails?.created_at,
      date: runDetails ? formatRunTimestamp(runDetails.created_at, RUN_ANALYTICS_TIMESTAMP_FORMAT) : '—',
      version: AnalyticCommonHelpers.describeRunVersions(versionIds, entityDetails?.versions),
      model: isRunDetailFetching && !runDetail ? '…' : AnalyticCommonHelpers.describeRunModels(runDetail),
    };
  }, [isEntityScoped, isRunDetailFetching, runDetail, runDetails, entityDetails?.versions, readRunVersionId]);

  const infoLines = useMemo(() => {
    if (!isEntityScoped) return [`Run: ${date} · Version: ${version}`];

    const totals = AnalyticCommonHelpers.describeRunTotals(runDetail);
    const runLine = `Run: ${date} · Version: ${version} · Model: ${model}`;

    return totals ? [runLine, totals] : [runLine];
  }, [isEntityScoped, date, version, model, runDetail]);

  const showToolsTab = !isEntityScoped || Boolean(runDetail?.kpis?.tool_calls);
  const failedCalls = useMemo(
    () => (isEntityScoped ? AnalyticCommonHelpers.collectFailedRunCalls(runDetail) : undefined),
    [isEntityScoped, runDetail],
  );

  const exportMeta = useMemo(
    () => ({
      entityName: entityDetails?.name ?? '',
      fileSuffix: `run-${runId}`,
      scopeRows: [
        [
          entityLabel ?? (source === ParticipantEntityTypes.Pipeline ? 'Pipeline' : 'Agent'),
          entityDetails?.name ?? '',
        ],
        ['Run ID', runId],
        ['Run Date/Time', AnalyticsExportHelpers.fmtRunDateTime(toRunISOString(createdAt))],
        ['Version', version],
        ...(isEntityScoped ? [['Model', model]] : []),
      ],
    }),
    [entityDetails?.name, entityLabel, runId, source, createdAt, version, isEntityScoped, model],
  );

  return (
    <RunAnalyticsView
      runScope={runScope}
      breadcrumbs={breadcrumbs}
      infoLines={infoLines}
      exportMeta={exportMeta}
      missingRunMessage={RUN_NO_DATA_MESSAGE}
      isRunLoading={isRunLoading}
      showToolsTab={showToolsTab}
      failedCalls={failedCalls}
    />
  );
});

RunAnalyticsContainer.displayName = 'RunAnalyticsContainer';

export default RunAnalyticsContainer;
