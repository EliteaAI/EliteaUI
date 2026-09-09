import { useCallback, useRef, useState } from 'react';

import { useStore } from 'react-redux';

import { exportToExcel } from '@/[fsd]/shared/lib/utils/exportToExcel.utils';
import { useLazyApplicationDetailsQuery } from '@/api/applications';
import useToast from '@/hooks/useToast';

import { evaluationApi } from '../../api';
import {
  buildEvaluationResultsSheets,
  buildScorecard,
  evaluationExportFileName,
  fetchEvaluationRunExportData,
  resolveExportDatasets,
  resolveRunSuiteName,
  resolveRunVersionName,
} from '../helpers';

const EXPORT_ERROR_MESSAGE = 'Evaluation results could not be exported. Please try again.';
// A `{}` default in the signature would be a new reference on every render, which would give
// `exportRun` a new identity each time and defeat the memo on everything it is passed to.
const EMPTY_SUITE_NAMES = {};
// What a run that named no judge model was scored with — the backend picks one per project.
const AUTO_JUDGE_MODEL = 'Auto';

/**
 * Excel export of one evaluation run (#6549), shared by the Results header and the Results History
 * row menu so both produce the same workbook. The run is read back from the API rather than taken
 * from the caller, so a history row exports its own stored snapshot without being selected first.
 *
 * `exportingRunId` is what disables the action while a workbook is being built — a second click
 * must not start a duplicate export (§10).
 */
export const useEvaluationExport = ({
  projectId,
  applicationId,
  suiteNamesById = EMPTY_SUITE_NAMES,
} = {}) => {
  const store = useStore();
  const { toastError } = useToast();
  const [fetchApplicationDetails] = useLazyApplicationDetailsQuery();
  const [exportingRunId, setExportingRunId] = useState(null);
  // The state drives the disabled button; the ref is what actually guards re-entry, since a
  // second click reads the state captured at the last render, not the one just set.
  const isExportingRef = useRef(false);

  const exportRun = useCallback(
    async run => {
      const runId = run?.id ?? null;
      if (runId == null || projectId == null) return;
      if (isExportingRef.current) return;

      isExportingRef.current = true;
      setExportingRunId(runId);
      try {
        const { run: runDetail, ...data } = await fetchEvaluationRunExportData(
          store.dispatch,
          evaluationApi.endpoints,
          { projectId, runId, applicationId },
        );

        const scorecard = buildScorecard({
          run: runDetail,
          results: data.results,
          humanScores: data.humanScores,
          headlineScore: data.headlineScore,
          dimensions: data.dimensions,
        });

        const application =
          applicationId != null
            ? await fetchApplicationDetails({ projectId, applicationId })
                .unwrap()
                .catch(() => null)
            : null;

        const { datasetNames, datasetNameByCaseId } = resolveExportDatasets({
          run: runDetail,
          scorecard,
          datasets: data.datasets,
        });

        const agentName = application?.name || null;
        const suiteName = resolveRunSuiteName(runDetail, suiteNamesById);

        const sheets = buildEvaluationResultsSheets(scorecard, {
          run: runDetail,
          meta: {
            agentName,
            agentVersion: resolveRunVersionName(runDetail, application?.versions),
            suiteName,
            judgeModel: runDetail?.snapshot?.suite?.judge_model?.model_name || AUTO_JUDGE_MODEL,
            datasetNames,
            datasetNameByCaseId,
          },
        });

        await exportToExcel(evaluationExportFileName({ agentName, suiteName, run: runDetail }), sheets);
      } catch {
        // Nothing has been written at this point — the workbook is only handed to the browser once
        // it is complete, so a failure here cannot leave a partial file behind.
        toastError(EXPORT_ERROR_MESSAGE);
      } finally {
        isExportingRef.current = false;
        setExportingRunId(null);
      }
    },
    [projectId, applicationId, store, fetchApplicationDetails, suiteNamesById, toastError],
  );

  return {
    exportRun,
    exportingRunId,
    isExporting: exportingRunId != null,
  };
};
