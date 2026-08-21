import { memo, useCallback, useMemo, useState } from 'react';

import { Box, CircularProgress, Divider, ListItemButton, Typography } from '@mui/material';

import { exportToExcel } from '@/[fsd]/shared/lib/utils/exportToExcel.utils';
import { Button, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import useCheckPermission from '@/hooks/useCheckPermission';
import useToast from '@/hooks/useToast';

import { useEvalRunResultsQuery, useWriteEvalHumanScoreMutation } from '../../api';
import { EVAL_PERMISSIONS } from '../../lib/constants';
import {
  buildEvaluationResultsSheets,
  buildScorecard,
  coveredCaseIdsFromPage,
  evaluationExportFileName,
  formatScore,
  parseEvalError,
} from '../../lib/helpers';
import CaseDrillDown from './CaseDrillDown';
import ScorecardOverview from './ScorecardOverview';

const CASE_FILTER = {
  all: 'all',
  needsScore: 'needsScore',
  missed: 'missed',
  errors: 'errors',
};

const filterCases = (cases, filter) => {
  switch (filter) {
    case CASE_FILTER.needsScore:
      return cases.filter(c => c.pendingCount > 0);
    case CASE_FILTER.missed:
      return cases.filter(c => c.missedAny);
    case CASE_FILTER.errors:
      return cases.filter(c => c.hasError);
    default:
      return cases;
  }
};

// Results scorecard (#6209, §15): run-level aggregates plus a per-case
// drill-down with inline human scoring. Reachable from a finished run's progress
// dialog and the last-run summary.
const ResultsScorecardDialog = memo(props => {
  const { open, projectId, runId, onClose } = props;

  const { checkPermission } = useCheckPermission();
  const { toastError, toastSuccess } = useToast();
  const canScore = checkPermission(EVAL_PERMISSIONS.humanScoreCreate);

  const [filter, setFilter] = useState(CASE_FILTER.all);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [savingKey, setSavingKey] = useState(null);

  const shouldFetch = open && projectId != null && runId != null;

  const { data, isFetching, isError } = useEvalRunResultsQuery({ projectId, runId }, { skip: !shouldFetch });

  const [writeHumanScore] = useWriteEvalHumanScoreMutation();

  // The results read is paged (EVAL_RESULT_MAX_LIMIT). A run bigger than one page is shown as the
  // case range the page actually covers, so a truncated read cannot pass for a complete scorecard.
  const coveredCaseIds = useMemo(
    () =>
      coveredCaseIdsFromPage({
        results: data?.results ?? [],
        total: data?.total ?? 0,
        offset: data?.offset ?? 0,
      }),
    [data],
  );

  const scorecard = useMemo(
    () =>
      buildScorecard({
        run: data?.run,
        results: data?.results,
        humanScores: data?.human_scores,
        headlineScore: data?.headline_score,
        caseIds: coveredCaseIds,
      }),
    [data, coveredCaseIds],
  );

  const needsScoreCount = useMemo(
    () => scorecard.cases.filter(c => c.pendingCount > 0).length,
    [scorecard.cases],
  );

  const filterOptions = useMemo(
    () => [
      { value: CASE_FILTER.all, label: `All cases (${scorecard.cases.length})` },
      { value: CASE_FILTER.needsScore, label: `Needs my score (${needsScoreCount})` },
      { value: CASE_FILTER.missed, label: `Missed ≥1 (${scorecard.counts.missedAny})` },
      { value: CASE_FILTER.errors, label: `Errors (${scorecard.counts.errors})` },
    ],
    [scorecard.cases.length, scorecard.counts, needsScoreCount],
  );

  const visibleCases = useMemo(() => filterCases(scorecard.cases, filter), [scorecard.cases, filter]);

  const selectedCase = useMemo(
    () => visibleCases.find(c => c.id === selectedCaseId) ?? visibleCases[0] ?? null,
    [visibleCases, selectedCaseId],
  );

  const handleSubmitScore = useCallback(
    async payload => {
      setSavingKey(payload.bindingKey);
      try {
        await writeHumanScore({
          projectId,
          runId,
          body: {
            dataset_case_id: payload.datasetCaseId,
            dimension_id: payload.dimensionId,
            native_score: payload.nativeScore,
            note: payload.note,
          },
        }).unwrap();
        toastSuccess('Score saved.');
      } catch (error) {
        toastError(parseEvalError(error, 'Failed to save score.'));
      } finally {
        setSavingKey(null);
      }
    },
    [writeHumanScore, projectId, runId, toastSuccess, toastError],
  );

  const handleExport = useCallback(async () => {
    try {
      const sheets = buildEvaluationResultsSheets(scorecard, { runId });
      await exportToExcel(evaluationExportFileName({ runId }), sheets);
    } catch (error) {
      toastError(parseEvalError(error, 'Failed to export results.'));
    }
  }, [scorecard, runId, toastError]);

  const styles = resultsScorecardDialogStyles();

  const content = (
    <Box
      sx={styles.content}
      data-testid="evaluation-scorecard"
    >
      {isError ? (
        <Typography
          variant="bodySmall"
          sx={styles.error}
        >
          Failed to load results. Please close and try again.
        </Typography>
      ) : isFetching && !data ? (
        <Box sx={styles.centered}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {coveredCaseIds && (
            <Typography
              variant="bodySmall"
              sx={styles.truncated}
              data-testid="evaluation-scorecard-truncated"
            >
              ⚠ This run is too large to show at once — {scorecard.cases.length} of{' '}
              {data?.run?.snapshot?.cases?.length ?? scorecard.cases.length} cases are shown, and Export
              covers only those. The headline score below still spans the whole run.
            </Typography>
          )}

          <ScorecardOverview scorecard={scorecard} />

          <Divider />

          <Box sx={styles.filterRow}>
            <Box sx={styles.filterGrow}>
              <SingleSelect
                label="Filter cases"
                showBorder
                value={filter}
                options={filterOptions}
                onValueChange={setFilter}
                data-testid="evaluation-scorecard-filter"
              />
            </Box>
          </Box>

          <Box sx={styles.caseList}>
            {visibleCases.map(card => (
              <ListItemButton
                key={card.id}
                selected={selectedCase?.id === card.id}
                sx={[styles.caseRow, selectedCase?.id === card.id && styles.caseRowActive]}
                onClick={() => setSelectedCaseId(card.id)}
                data-testid="evaluation-scorecard-case-row"
              >
                <Typography variant="bodyMedium">Case #{card.id}</Typography>
                <Typography
                  variant="bodySmall"
                  color="text.secondary"
                >
                  {formatScore(card.caseScore)}
                  {card.hasError ? ' · error' : card.missedAny ? ' · missed' : ''}
                  {card.pendingCount > 0 ? ` · ${card.pendingCount} to score` : ''}
                </Typography>
              </ListItemButton>
            ))}
            {!visibleCases.length && (
              <Typography
                variant="bodySmall"
                color="text.secondary"
              >
                No cases match this filter.
              </Typography>
            )}
          </Box>

          {selectedCase && (
            <>
              <Divider />
              <CaseDrillDown
                card={selectedCase}
                canScore={canScore}
                savingKey={savingKey}
                onSubmitScore={handleSubmitScore}
              />
            </>
          )}
        </>
      )}
    </Box>
  );

  return (
    <Modal.BaseModal
      open={open}
      title={runId != null ? `Run #${runId} results` : 'Evaluation results'}
      onClose={onClose}
      content={content}
      actions={
        <>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.secondary}
            onClick={handleExport}
            disabled={!data}
            data-testid="evaluation-scorecard-export"
          >
            Export
          </Button.BaseBtn>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.secondary}
            onClick={onClose}
            data-testid="evaluation-scorecard-close"
          >
            Close
          </Button.BaseBtn>
        </>
      }
      data-testid="evaluation-scorecard-dialog"
    />
  );
});

ResultsScorecardDialog.displayName = 'ResultsScorecardDialog';

/** @type {MuiSx} */
const resultsScorecardDialogStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: '56rem',
    maxWidth: '100%',
  },
  centered: {
    display: 'flex',
    justifyContent: 'center',
    padding: '2rem',
  },
  filterRow: {
    display: 'flex',
  },
  filterGrow: {
    width: '18rem',
    maxWidth: '100%',
  },
  caseList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    maxHeight: '12rem',
    overflowY: 'auto',
  },
  caseRow: ({ palette }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    border: `0.0625rem solid ${palette.border.lines}`,
  }),
  caseRowActive: ({ palette }) => ({
    borderColor: palette.primary.main,
  }),
  error: ({ palette }) => ({
    color: palette.error.main,
  }),
  truncated: ({ palette }) => ({
    color: palette.warning?.main ?? palette.error.main,
  }),
});

export default ResultsScorecardDialog;
