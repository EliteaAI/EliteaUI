import { memo, useCallback, useState } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import { Modal } from '@/[fsd]/shared/ui';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

import { useDeleteEvalDimensionMutation, useEvalDimensionsQuery } from '../../api';
import { EVAL_PERMISSIONS, EVAL_TIER } from '../../lib/constants';
import { parseEvalError } from '../../lib/helpers';
import DimensionEditorDialog from './DimensionEditorDialog';
import EvaluationSection from './EvaluationSection';

const isPlatformTier = item => item?.tier === EVAL_TIER.platform;

const LibraryView = memo(props => {
  const { isFetching: isAppFetching, isError: isAppError, applicationId = null } = props;

  const projectId = useSelectedProjectId();
  const { checkPermission } = useCheckPermission();
  const { toastError, toastSuccess } = useToast();

  const [dimensionDialog, setDimensionDialog] = useState({ open: false, item: null });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const {
    data: dimensions = [],
    isLoading: isDimensionsLoading,
    isError: isDimensionsError,
  } = useEvalDimensionsQuery({ projectId, agentId: applicationId }, { skip: !projectId });

  const [deleteDimension, { isLoading: isDeletingDimension }] = useDeleteEvalDimensionMutation();

  const isLoading = isAppFetching || isDimensionsLoading;
  const isError = isAppError || isDimensionsError;

  const canCreateDimension = checkPermission(EVAL_PERMISSIONS.dimensionCreate);
  const canEditDimension = checkPermission(EVAL_PERMISSIONS.dimensionUpdate);
  const canDeleteDimension = checkPermission(EVAL_PERMISSIONS.dimensionDelete);

  const openDimensionEditor = useCallback((item = null) => {
    setDimensionDialog({ open: true, item });
  }, []);
  const closeDimensionEditor = useCallback(() => {
    setDimensionDialog({ open: false, item: null });
  }, []);

  const requestDeleteDimension = useCallback(item => {
    setDeleteTarget({ kind: 'dimension', item });
  }, []);
  const cancelDelete = useCallback(() => setDeleteTarget(null), []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const { item } = deleteTarget;
    try {
      await deleteDimension({ projectId, dimensionId: item.id }).unwrap();
      toastSuccess('Deleted successfully.');
      setDeleteTarget(null);
    } catch (error) {
      toastError(parseEvalError(error, 'Failed to delete.'));
    }
  }, [deleteTarget, deleteDimension, projectId, toastSuccess, toastError]);

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
        Define reusable scoring dimensions for this project.
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

      <DimensionEditorDialog
        open={dimensionDialog.open}
        projectId={projectId}
        applicationId={applicationId}
        dimension={dimensionDialog.item}
        onClose={closeDimensionEditor}
      />

      <Modal.DeleteEntityModal
        open={!!deleteTarget}
        name={deleteTarget?.item?.name}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        alarm
        confirming={isDeletingDimension}
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
