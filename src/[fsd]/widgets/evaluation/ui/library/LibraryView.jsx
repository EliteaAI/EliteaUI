import { memo, useCallback, useState } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import { Modal } from '@/[fsd]/shared/ui';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

import {
  useDeleteEvalCodeValidationMutation,
  useDeleteEvalDimensionMutation,
  useEvalCodeValidationsQuery,
  useEvalDimensionsQuery,
} from '../../api';
import { EVAL_PERMISSIONS, EVAL_TIER } from '../../lib/constants';
import { parseEvalError } from '../../lib/helpers';
import CodeValidationEditorDialog from './CodeValidationEditorDialog';
import DimensionEditorDialog from './DimensionEditorDialog';
import EvaluationSection from './EvaluationSection';

const isPlatformTier = item => item?.tier === EVAL_TIER.platform;

const LibraryView = memo(props => {
  const { isFetching: isAppFetching, isError: isAppError, applicationId = null } = props;

  const projectId = useSelectedProjectId();
  const { checkPermission } = useCheckPermission();
  const { toastError, toastSuccess } = useToast();

  const [dimensionDialog, setDimensionDialog] = useState({ open: false, item: null });
  const [codeValidationDialog, setCodeValidationDialog] = useState({ open: false, item: null });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const {
    data: dimensions = [],
    isLoading: isDimensionsLoading,
    isError: isDimensionsError,
  } = useEvalDimensionsQuery({ projectId, agentId: applicationId }, { skip: !projectId });

  const {
    data: codeValidations = [],
    isLoading: isCodeValidationsLoading,
    isError: isCodeValidationsError,
  } = useEvalCodeValidationsQuery({ projectId }, { skip: !projectId });

  const [deleteDimension, { isLoading: isDeletingDimension }] = useDeleteEvalDimensionMutation();
  const [deleteCodeValidation, { isLoading: isDeletingCodeValidation }] =
    useDeleteEvalCodeValidationMutation();

  const isLoading = isAppFetching || isDimensionsLoading || isCodeValidationsLoading;
  const isError = isAppError || isDimensionsError || isCodeValidationsError;

  const canCreateDimension = checkPermission(EVAL_PERMISSIONS.dimensionCreate);
  const canEditDimension = checkPermission(EVAL_PERMISSIONS.dimensionUpdate);
  const canDeleteDimension = checkPermission(EVAL_PERMISSIONS.dimensionDelete);
  const canCreateCodeValidation = checkPermission(EVAL_PERMISSIONS.codeValidationCreate);
  const canEditCodeValidation = checkPermission(EVAL_PERMISSIONS.codeValidationUpdate);
  const canDeleteCodeValidation = checkPermission(EVAL_PERMISSIONS.codeValidationDelete);

  const openDimensionEditor = useCallback((item = null) => {
    setDimensionDialog({ open: true, item });
  }, []);
  const closeDimensionEditor = useCallback(() => {
    setDimensionDialog({ open: false, item: null });
  }, []);

  const openCodeValidationEditor = useCallback((item = null) => {
    setCodeValidationDialog({ open: true, item });
  }, []);
  const closeCodeValidationEditor = useCallback(() => {
    setCodeValidationDialog({ open: false, item: null });
  }, []);

  const requestDeleteDimension = useCallback(item => {
    setDeleteTarget({ kind: 'dimension', item });
  }, []);
  const requestDeleteCodeValidation = useCallback(item => {
    setDeleteTarget({ kind: 'codeValidation', item });
  }, []);
  const cancelDelete = useCallback(() => setDeleteTarget(null), []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const { kind, item } = deleteTarget;
    try {
      if (kind === 'dimension') {
        await deleteDimension({ projectId, dimensionId: item.id }).unwrap();
      } else {
        await deleteCodeValidation({ projectId, codeValidationId: item.id }).unwrap();
      }
      toastSuccess('Deleted successfully.');
      setDeleteTarget(null);
    } catch (error) {
      toastError(parseEvalError(error, 'Failed to delete.'));
    }
  }, [deleteTarget, deleteDimension, projectId, deleteCodeValidation, toastSuccess, toastError]);

  const styles = libraryViewStyles();

  if (isError) {
    return (
      <Box
        sx={styles.centered}
        data-testid="evaluation-library-view"
      >
        <Typography
          variant="labelMedium"
          color="text.secondary"
        >
          Failed to load evaluation data! Please try refreshing the page.
        </Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box
        sx={styles.centered}
        data-testid="evaluation-library-view"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={styles.root}
      data-testid="evaluation-library-view"
    >
      <Typography variant="headingSmall">Evaluation library</Typography>
      <Typography
        variant="bodySmall"
        color="text.secondary"
      >
        Define reusable scoring dimensions and code validations for this project.
      </Typography>

      <EvaluationSection
        title="Dimensions"
        items={dimensions}
        testId="evaluation-dimensions-list"
        canCreate={canCreateDimension}
        canEdit={canEditDimension}
        canDelete={canDeleteDimension}
        isItemReadOnly={isPlatformTier}
        onAdd={() => openDimensionEditor(null)}
        onEdit={openDimensionEditor}
        onDelete={requestDeleteDimension}
        addTooltip="New dimension"
        addTestId="evaluation-add-dimension"
      />

      <EvaluationSection
        title="Code validations"
        items={codeValidations}
        testId="evaluation-code-validations-list"
        canCreate={canCreateCodeValidation}
        canEdit={canEditCodeValidation}
        canDelete={canDeleteCodeValidation}
        onAdd={() => openCodeValidationEditor(null)}
        onEdit={openCodeValidationEditor}
        onDelete={requestDeleteCodeValidation}
        addTooltip="New code validation"
        addTestId="evaluation-add-code-validation"
      />

      <DimensionEditorDialog
        open={dimensionDialog.open}
        projectId={projectId}
        applicationId={applicationId}
        dimension={dimensionDialog.item}
        onClose={closeDimensionEditor}
      />

      <CodeValidationEditorDialog
        open={codeValidationDialog.open}
        projectId={projectId}
        codeValidation={codeValidationDialog.item}
        onClose={closeCodeValidationEditor}
      />

      <Modal.DeleteEntityModal
        open={!!deleteTarget}
        name={deleteTarget?.item?.name}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        alarm
        confirming={isDeletingDimension || isDeletingCodeValidation}
      />
    </Box>
  );
});

LibraryView.displayName = 'LibraryView';

/** @type {MuiSx} */
const libraryViewStyles = () => ({
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
});

export default LibraryView;
