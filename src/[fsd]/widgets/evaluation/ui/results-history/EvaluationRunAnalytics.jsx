import { memo, useMemo } from 'react';

import { useParams, useSearchParams } from 'react-router-dom';

import {
  RUN_ANALYTICS_TIMESTAMP_FORMAT,
  formatRunTimestamp,
  toRunISOString,
} from '@/[fsd]/entities/run-history/lib/helpers';
import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';
import { AnalyticCommonHelpers, AnalyticsExportHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { RunAnalyticsView } from '@/[fsd]/features/settings/ui/analytics';
import { useApplicationDetailsQuery } from '@/api/applications';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import { useEvalRunQuery, useEvalSuitesQuery } from '../../api';
import { resolveRunSuiteName, resolveRunVersionName } from '../../lib/helpers';
import { RUN_SEARCH_PARAM } from '../../lib/hooks/useEvalRunHistory.hooks';
import { EvaluationBreadcrumbs } from '../common';

const { RUN_SCOPE_TYPE, EVAL_RUN_NO_DATA_MESSAGE } = AnalyticsCommonConstants;

const UNKNOWN_LABEL = '—';

/**
 * Evaluation Results History → Analytics (#6817): execution and LLM-as-judge usage of one evaluation run,
 * scoped by `eval_run_id`. The run is the same `?run=` the Results History screen selects by.
 */
const EvaluationRunAnalytics = memo(() => {
  const { agentId } = useParams();
  const [searchParams] = useSearchParams();
  const projectId = useSelectedProjectId();

  const applicationId = useMemo(() => (agentId ? parseInt(agentId, 10) : null), [agentId]);
  const runId = useMemo(() => {
    const parsed = parseInt(searchParams.get(RUN_SEARCH_PARAM), 10);
    return Number.isNaN(parsed) ? null : parsed;
  }, [searchParams]);

  const skipAgent = !projectId || !applicationId;

  const { data: run, isLoading: isRunLoading } = useEvalRunQuery(
    { projectId, runId },
    { skip: !projectId || runId == null },
  );
  const { data: suites = [] } = useEvalSuitesQuery({ projectId, applicationId }, { skip: skipAgent });
  const { data: agentDetails } = useApplicationDetailsQuery(
    { projectId, applicationId },
    { skip: skipAgent },
  );

  // `?run=` carries the numeric id Results History selects by; analytics is keyed by the run's UUID
  const runScope = useMemo(
    () => AnalyticCommonHelpers.buildRunScope(RUN_SCOPE_TYPE.evalRun, run?.uuid),
    [run?.uuid],
  );

  // The evaluated version recorded on the run, not the one currently open in the editor
  const { suiteName, versionName, startedAt, date } = useMemo(() => {
    const suiteNamesById = Object.fromEntries(suites.map(suite => [suite.id, suite.name]));
    const timestamp = run?.started_at || run?.created_at;

    return {
      suiteName: run ? resolveRunSuiteName(run, suiteNamesById) : UNKNOWN_LABEL,
      versionName: resolveRunVersionName(run, agentDetails?.versions ?? []) ?? UNKNOWN_LABEL,
      startedAt: timestamp,
      date: run ? formatRunTimestamp(timestamp, RUN_ANALYTICS_TIMESTAMP_FORMAT) : UNKNOWN_LABEL,
    };
  }, [run, suites, agentDetails?.versions]);

  const infoLines = useMemo(
    () => [
      `Evaluation Run #${runId ?? UNKNOWN_LABEL} · Suite: ${suiteName}`,
      `Run: ${date} · Agent version: ${versionName}`,
    ],
    [runId, suiteName, date, versionName],
  );

  const exportMeta = useMemo(
    () => ({
      entityName: agentDetails?.name ?? '',
      fileSuffix: `eval-run-${runId}`,
      scopeRows: [
        ['Agent', agentDetails?.name ?? ''],
        ['Evaluated Version', versionName],
        ['Suite', suiteName],
        ['Evaluation Run ID', runId],
        ['Run Date/Time', AnalyticsExportHelpers.fmtRunDateTime(toRunISOString(startedAt))],
      ],
    }),
    [agentDetails?.name, versionName, suiteName, runId, startedAt],
  );

  return (
    <RunAnalyticsView
      runScope={runScope}
      breadcrumbs={<EvaluationBreadcrumbs title="Analytics" />}
      infoLines={infoLines}
      exportMeta={exportMeta}
      missingRunMessage={EVAL_RUN_NO_DATA_MESSAGE}
      isRunLoading={isRunLoading}
    />
  );
});

EvaluationRunAnalytics.displayName = 'EvaluationRunAnalytics';

export default EvaluationRunAnalytics;
