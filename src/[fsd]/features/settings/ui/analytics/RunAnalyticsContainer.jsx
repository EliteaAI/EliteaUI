import { memo, useMemo } from 'react';

import { useParams, useSearchParams } from 'react-router-dom';

import { RunHistoryApi } from '@/[fsd]/entities/run-history/api';
import {
  RUN_ANALYTICS_TIMESTAMP_FORMAT,
  formatRunTimestamp,
  toRunISOString,
} from '@/[fsd]/entities/run-history/lib/helpers';
import {
  useAnalyticsCostsQuery,
  useAnalyticsRunDetailQuery,
} from '@/[fsd]/features/settings/api/analyticsApi';
import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import { AnalyticCommonHelpers, AnalyticsExportHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { RunAnalyticsView } from '@/[fsd]/features/settings/ui/analytics';
import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import Breadcrumbs from '@/[fsd]/shared/ui/breadcrumbs';
import { useApplicationDetailsQuery } from '@/api/applications';
import { SearchParams } from '@/common/constants';

const { ParticipantEntityTypes } = ParticipantEntityConstants;
const { RUN_SCOPE_TYPE, RUN_NO_DATA_MESSAGE } = AnalyticsCommonConstants;

const readSingleParticipantVersionId = runDetails =>
  runDetails?.meta?.single_participant?.entity_settings?.version_id;

/**
 * Agent/Pipeline Run History → Analytics (#6816): one run, identified by `history_run_id`, or by `usage_run_id`
 * when opened from Analytics Recent Runs.
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
  const usageRunId = searchParams.get(SearchParams.UsageRunId);
  const isUsageRunScoped = Boolean(usageRunId);
  const readsUsageTrace = isEntityScoped || isUsageRunScoped;
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
    () => AnalyticCommonHelpers.buildRunScope(RUN_SCOPE_TYPE.run, usageRunId || runDetails?.uuid, rootEntity),
    [usageRunId, runDetails?.uuid, rootEntity],
  );

  const usageQueryArgs = { projectId, ...runScope?.queryArgs };
  const skipUsageQueries = !readsUsageTrace || !projectId || !runScope;
  const {
    data: runDetail,
    isFetching: isRunDetailFetching,
    error: runDetailError,
  } = useAnalyticsRunDetailQuery(usageQueryArgs, { skip: skipUsageQueries });
  const {
    data: runCosts,
    isFetching: isRunCostsFetching,
    isError: isRunCostsError,
  } = useAnalyticsCostsQuery(usageQueryArgs, { skip: skipUsageQueries });

  const isRunWithoutUsage = runDetailError?.status === 404;
  const isRunDetailUnavailable = Boolean(runDetailError) && !isRunWithoutUsage;

  const isUsagePending =
    readsUsageTrace && ((isRunDetailFetching && !runDetail) || (isRunCostsFetching && !runCosts));

  // The version the run executed with, not the one currently open in the editor
  const { date, version, model, createdAt } = useMemo(() => {
    const usageVersionIds = readsUsageTrace ? runDetail?.root_entity_version_ids : undefined;
    const versionIds = usageVersionIds?.length ? usageVersionIds : [readRunVersionId(runDetails)];
    const runVersion = isRunDetailUnavailable
      ? 'unavailable'
      : AnalyticCommonHelpers.describeRunVersions(
          versionIds,
          entityDetails?.versions,
          readsUsageTrace ? runDetail?.root_entity_versions : undefined,
        );
    const runModel = isRunCostsError
      ? 'unavailable'
      : AnalyticCommonHelpers.describeRunModels(runCosts?.by_model);

    const startedAt = isUsageRunScoped ? runDetail?.started_at : runDetails?.created_at;

    return {
      createdAt: startedAt,
      date:
        isUsageRunScoped && isUsagePending
          ? '…'
          : formatRunTimestamp(startedAt, RUN_ANALYTICS_TIMESTAMP_FORMAT),
      version: isUsagePending ? '…' : runVersion,
      model: isUsagePending ? '…' : runModel,
    };
  }, [
    readsUsageTrace,
    isUsageRunScoped,
    isUsagePending,
    isRunDetailUnavailable,
    isRunCostsError,
    runDetail,
    runCosts?.by_model,
    runDetails,
    entityDetails?.versions,
    readRunVersionId,
  ]);

  const infoLines = useMemo(
    () => [
      readsUsageTrace
        ? `Run: ${date} · Version: ${version} · Model: ${model}`
        : `Run: ${date} · Version: ${version}`,
    ],
    [readsUsageTrace, date, version, model],
  );

  const showToolsTab = !readsUsageTrace || Boolean(runDetail?.kpis?.tool_calls);
  const failedCalls = useMemo(
    () =>
      readsUsageTrace
        ? AnalyticCommonHelpers.collectFailedRunCalls(runDetail, runCosts?.by_model)
        : undefined,
    [readsUsageTrace, runDetail, runCosts?.by_model],
  );
  const exportRunId = usageRunId || runId;

  const exportMeta = useMemo(
    () => ({
      entityName: entityDetails?.name ?? '',
      fileSuffix: `run-${exportRunId}`,
      scopeRows: [
        [
          entityLabel ?? (source === ParticipantEntityTypes.Pipeline ? 'Pipeline' : 'Agent'),
          entityDetails?.name ?? '',
        ],
        ['Run ID', exportRunId],
        ['Run Date/Time', AnalyticsExportHelpers.fmtRunDateTime(toRunISOString(createdAt))],
        ['Version', version],
        ...(readsUsageTrace ? [['Model', model]] : []),
      ],
    }),
    [entityDetails?.name, entityLabel, exportRunId, source, createdAt, version, readsUsageTrace, model],
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
