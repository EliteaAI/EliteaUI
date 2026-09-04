import { memo, useCallback, useMemo, useState } from 'react';

import {
  Box,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';

import { Button, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import CountBadge from '@/[fsd]/shared/ui/chip/CountBadge';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import EditIcon from '@/components/Icons/EditIcon';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

import { useDeleteEvalDatasetCaseMutation, useEvalDatasetQuery } from '../../../api';
import {
  EVAL_DATASET_CASE_PAGE_SIZE,
  MAX_CASES_PER_DATASET,
} from '../../../lib/constants/evaluation.constants';
import {
  caseSourceLabel,
  excerpt,
  parseEvalError,
  variablesPreview,
  withoutExpectedCount,
} from '../../../lib/helpers';
import CaseEditorDialog from './CaseEditorDialog';

const DatasetDetailView = memo(props => {
  const { datasetId, canUpdate = false, onBack, onImport, onPromote } = props;

  const projectId = useSelectedProjectId();
  const { toastError, toastSuccess } = useToast();

  const [caseDialog, setCaseDialog] = useState({ open: false, datasetCase: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [offset, setOffset] = useState(0);

  const {
    data: dataset,
    isLoading,
    isError,
  } = useEvalDatasetQuery(
    { projectId, datasetId, limit: EVAL_DATASET_CASE_PAGE_SIZE, offset },
    { skip: !projectId || datasetId == null },
  );

  const [deleteCase, { isLoading: isDeletingCase }] = useDeleteEvalDatasetCaseMutation();

  const cases = useMemo(() => dataset?.cases ?? [], [dataset?.cases]);
  const missingExpected = useMemo(() => withoutExpectedCount(cases), [cases]);

  const total = dataset?.case_count ?? cases.length;
  const isPaged = total > cases.length;
  const atCap = total >= MAX_CASES_PER_DATASET;
  const hasPrev = offset > 0;
  const hasNext = offset + cases.length < total;

  const goPrev = useCallback(
    () => setOffset(current => Math.max(0, current - EVAL_DATASET_CASE_PAGE_SIZE)),
    [],
  );
  const goNext = useCallback(() => setOffset(current => current + EVAL_DATASET_CASE_PAGE_SIZE), []);

  const openAddCase = useCallback(() => setCaseDialog({ open: true, datasetCase: null }), []);
  const openEditCase = useCallback(datasetCase => setCaseDialog({ open: true, datasetCase }), []);
  const closeCaseDialog = useCallback(() => setCaseDialog({ open: false, datasetCase: null }), []);

  const requestDeleteCase = useCallback(datasetCase => setDeleteTarget(datasetCase), []);
  const cancelDelete = useCallback(() => setDeleteTarget(null), []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteCase({ projectId, datasetId, caseId: deleteTarget.id }).unwrap();
      toastSuccess('Case deleted.');
      setDeleteTarget(null);
      // Emptying the last page would otherwise leave the view stranded past the end.
      if (cases.length === 1) goPrev();
    } catch (error) {
      toastError(parseEvalError(error, 'Failed to delete case.'));
    }
  }, [deleteTarget, deleteCase, projectId, datasetId, toastSuccess, toastError, cases.length, goPrev]);

  const styles = datasetDetailViewStyles();

  if (isLoading) {
    return (
      <Box
        sx={styles.centered}
        data-testid="evaluation-dataset-detail"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !dataset) {
    return (
      <Box
        sx={styles.centered}
        data-testid="evaluation-dataset-detail"
      >
        <Typography
          variant="labelMedium"
          color="text.secondary"
        >
          Failed to load dataset! Please try refreshing the page.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={styles.root}
      data-testid="evaluation-dataset-detail"
    >
      <Box sx={styles.header}>
        <Box sx={styles.heading}>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.text}
            color={BUTTON_COLORS.secondary}
            onClick={onBack}
            data-testid="dataset-detail-back"
          >
            ← Datasets
          </Button.BaseBtn>
          <Typography variant="headingSmall">{dataset.name}</Typography>
          <CountBadge
            count={total}
            total={MAX_CASES_PER_DATASET}
            ariaLabel="Cases used out of the dataset cap"
            testId="dataset-detail-case-cap"
          />
          {dataset.description && (
            <Typography
              variant="bodySmall"
              color="text.secondary"
            >
              {dataset.description}
            </Typography>
          )}
        </Box>
        {canUpdate && (
          <Box sx={styles.headerActions}>
            <Tooltip
              title={atCap ? `Dataset is at the ${MAX_CASES_PER_DATASET}-case limit.` : ''}
              placement="top"
            >
              <span>
                <Button.BaseBtn
                  variant={BUTTON_VARIANTS.elitea}
                  color={BUTTON_COLORS.secondary}
                  disabled={atCap}
                  onClick={() => onImport?.(dataset)}
                  data-testid="dataset-detail-import"
                >
                  Import
                </Button.BaseBtn>
              </span>
            </Tooltip>
            <Tooltip
              title={atCap ? `Dataset is at the ${MAX_CASES_PER_DATASET}-case limit.` : ''}
              placement="top"
            >
              <span>
                <Button.BaseBtn
                  variant={BUTTON_VARIANTS.elitea}
                  color={BUTTON_COLORS.secondary}
                  disabled={atCap}
                  onClick={() => onPromote?.(dataset)}
                  data-testid="dataset-detail-promote"
                >
                  From conversation
                </Button.BaseBtn>
              </span>
            </Tooltip>
            <Tooltip
              title={atCap ? `Dataset is at the ${MAX_CASES_PER_DATASET}-case limit.` : ''}
              placement="top"
            >
              <span>
                <Button.BaseBtn
                  variant={BUTTON_VARIANTS.elitea}
                  color={BUTTON_COLORS.primary}
                  disabled={atCap}
                  onClick={openAddCase}
                  data-testid="dataset-detail-add-case"
                >
                  + Add case
                </Button.BaseBtn>
              </span>
            </Tooltip>
          </Box>
        )}
      </Box>

      {missingExpected > 0 && (
        <Typography
          variant="bodySmall"
          sx={styles.warning}
          data-testid="dataset-detail-missing-expected"
        >
          ⚠ {missingExpected} case{missingExpected === 1 ? '' : 's'} without expected output
          {isPaged ? ' on this page' : ''}.
        </Typography>
      )}

      {cases.length === 0 ? (
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          No cases yet.
        </Typography>
      ) : (
        <Box sx={styles.tableWrapper}>
          <Table
            size="small"
            data-testid="dataset-cases-table"
          >
            <TableHead>
              <TableRow>
                <TableCell>Input</TableCell>
                <TableCell>Variables</TableCell>
                <TableCell>Expected</TableCell>
                <TableCell>Source</TableCell>
                {canUpdate && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {cases.map(datasetCase => (
                <TableRow
                  key={datasetCase.id}
                  data-testid="dataset-case-row"
                >
                  <TableCell>{excerpt(datasetCase.input)}</TableCell>
                  <TableCell>{variablesPreview(datasetCase.variables)}</TableCell>
                  <TableCell>{excerpt(datasetCase.expected_output)}</TableCell>
                  <TableCell>{caseSourceLabel(datasetCase.source_type)}</TableCell>
                  {canUpdate && (
                    <TableCell align="right">
                      <Tooltip
                        title="Edit"
                        placement="top"
                      >
                        <IconButton
                          size="small"
                          onClick={() => openEditCase(datasetCase)}
                          data-testid="dataset-case-edit"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip
                        title="Delete"
                        placement="top"
                      >
                        <IconButton
                          size="small"
                          onClick={() => requestDeleteCase(datasetCase)}
                          data-testid="dataset-case-delete"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {isPaged && (
        <Box
          sx={styles.pager}
          data-testid="dataset-cases-pager"
        >
          <Typography
            variant="bodySmall"
            color="text.secondary"
            data-testid="dataset-cases-page-label"
          >
            Showing {cases.length === 0 ? 0 : offset + 1}–{offset + cases.length} of {total} cases
          </Typography>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.text}
            color={BUTTON_COLORS.secondary}
            disabled={!hasPrev}
            onClick={goPrev}
            data-testid="dataset-cases-prev"
          >
            Previous
          </Button.BaseBtn>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.text}
            color={BUTTON_COLORS.secondary}
            disabled={!hasNext}
            onClick={goNext}
            data-testid="dataset-cases-next"
          >
            Next
          </Button.BaseBtn>
        </Box>
      )}

      <CaseEditorDialog
        open={caseDialog.open}
        projectId={projectId}
        datasetId={datasetId}
        datasetCase={caseDialog.datasetCase}
        onClose={closeCaseDialog}
      />

      <Modal.DeleteEntityModal
        open={!!deleteTarget}
        name={deleteTarget ? excerpt(deleteTarget.input, 40) : ''}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        alarm
        confirming={isDeletingCase}
      />
    </Box>
  );
});

DatasetDetailView.displayName = 'DatasetDetailView';

/** @type {MuiSx} */
const datasetDetailViewStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    height: '100%',
    overflowY: 'auto',
    padding: '1.5rem',
  },
  centered: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  heading: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    minWidth: 0,
  },
  headerActions: {
    display: 'flex',
    gap: '0.5rem',
    flexShrink: 0,
  },
  warning: ({ palette }) => ({
    color: palette.warning?.main ?? palette.error.main,
  }),
  tableWrapper: {
    overflowX: 'auto',
  },
  pager: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
});

export default DatasetDetailView;
