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
import DeleteIcon from '@/components/Icons/DeleteIcon';
import EditIcon from '@/components/Icons/EditIcon';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

import { useDeleteEvalDatasetCaseMutation, useEvalDatasetQuery } from '../api';
import {
  caseSourceLabel,
  excerpt,
  parseEvalError,
  variablesPreview,
  withoutExpectedCount,
} from '../lib/helpers';
import CaseEditorDialog from './CaseEditorDialog';

const DatasetDetailView = memo(props => {
  const { datasetId, canUpdate = false, onBack, onImport, onPromote } = props;

  const projectId = useSelectedProjectId();
  const { toastError, toastSuccess } = useToast();

  const [caseDialog, setCaseDialog] = useState({ open: false, datasetCase: null });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const {
    data: dataset,
    isLoading,
    isError,
  } = useEvalDatasetQuery({ projectId, datasetId }, { skip: !projectId || datasetId == null });

  const [deleteCase, { isLoading: isDeletingCase }] = useDeleteEvalDatasetCaseMutation();

  const cases = useMemo(() => dataset?.cases ?? [], [dataset?.cases]);
  const missingExpected = useMemo(() => withoutExpectedCount(cases), [cases]);

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
    } catch (error) {
      toastError(parseEvalError(error, 'Failed to delete case.'));
    }
  }, [deleteTarget, deleteCase, projectId, datasetId, toastSuccess, toastError]);

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
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.elitea}
              color={BUTTON_COLORS.secondary}
              onClick={() => onImport?.(dataset)}
              data-testid="dataset-detail-import"
            >
              Import
            </Button.BaseBtn>
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.elitea}
              color={BUTTON_COLORS.secondary}
              onClick={() => onPromote?.(dataset)}
              data-testid="dataset-detail-promote"
            >
              From conversation
            </Button.BaseBtn>
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.elitea}
              color={BUTTON_COLORS.primary}
              onClick={openAddCase}
              data-testid="dataset-detail-add-case"
            >
              + Add case
            </Button.BaseBtn>
          </Box>
        )}
      </Box>

      {missingExpected > 0 && (
        <Typography
          variant="bodySmall"
          sx={styles.warning}
          data-testid="dataset-detail-missing-expected"
        >
          ⚠ {missingExpected} case{missingExpected === 1 ? '' : 's'} without expected output.
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
});

export default DatasetDetailView;
