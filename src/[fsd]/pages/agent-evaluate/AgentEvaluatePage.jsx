import { memo, useEffect, useMemo, useRef } from 'react';

import { useParams } from 'react-router-dom';

import { Box } from '@mui/material';

import { BreadcrumbsOrTitle, Modal } from '@/[fsd]/shared/ui';
import {
  BuildDimensionWithAiModal,
  DatasetModal,
  DimensionModal,
  ResultsPanel,
  SelectDimensionFromLibraryModal,
  SuiteDetailPanel,
  SuitesPanel,
  buildDimensionLookupMap,
  useEvalDatasetActions,
  useEvalDatasetQuery,
  useEvalDatasetsQuery,
  useEvalDimensionActions,
  useEvalDimensionsQuery,
  useEvalRunActions,
  useEvalSuiteActions,
  useEvalSuiteQuery,
  useEvalSuitesQuery,
  usePlatformDimensionCatalogQuery,
} from '@/[fsd]/widgets/evaluation';
import { useListModelsQuery } from '@/api/configurations';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const AgentEvaluatePage = memo(() => {
  const { agentId, tab, suiteId: suiteIdParam } = useParams();
  const projectId = useSelectedProjectId();

  const applicationId = useMemo(() => (agentId ? parseInt(agentId, 10) : null), [agentId]);

  const isCreatingNew = suiteIdParam === 'new';
  const editingSuiteId = useMemo(() => {
    if (!suiteIdParam || suiteIdParam === 'new') return null;
    const parsed = parseInt(suiteIdParam, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }, [suiteIdParam]);

  // ---- Data queries ----
  const skip = !projectId || !applicationId;
  const { data: suites = [], isLoading: isSuitesLoading } = useEvalSuitesQuery(
    { projectId, applicationId },
    { skip },
  );
  const { data: datasets = [] } = useEvalDatasetsQuery({ projectId, agentId: applicationId }, { skip });
  const { data: agentProjectDimensions = [] } = useEvalDimensionsQuery(
    { projectId, agentId: applicationId, includePlatform: false },
    { skip },
  );
  const { data: platformDimensions = [] } = usePlatformDimensionCatalogQuery({ projectId }, { skip });
  const dimensions = useMemo(
    () => [...agentProjectDimensions, ...platformDimensions],
    [agentProjectDimensions, platformDimensions],
  );
  const { data: modelsData = { items: [] } } = useListModelsQuery(
    { projectId, include_shared: true, section: 'llm' },
    { skip: !projectId },
  );

  const { data: suiteDetail, isLoading: isSuiteLoading } = useEvalSuiteQuery(
    { projectId, suiteId: editingSuiteId },
    { skip: !projectId || editingSuiteId == null },
  );

  // ---- API-based data (before hooks, for hook params) ----
  const activeSuiteDetail = isCreatingNew ? null : suiteDetail;
  const apiDatasetId = activeSuiteDetail?.dataset_id ?? null;

  const apiAttachedDimensions = useMemo(() => {
    const bindings = (activeSuiteDetail?.bindings ?? []).filter(b => b.dimension_id != null);
    if (bindings.length === 0) return [];
    const dimMap = buildDimensionLookupMap(dimensions);
    return bindings.map(binding => {
      const dim = dimMap.get(binding.dimension_id);
      return {
        binding,
        name: dim?.name || `Dimension #${binding.dimension_id}`,
        tier: dim?.tier ?? null,
        defaultTarget: dim?.default_target ?? null,
        defaultTargetOperator: dim?.default_target_operator ?? null,
        defaultWeight: dim?.default_weight ?? null,
      };
    });
  }, [activeSuiteDetail?.bindings, dimensions]);

  // ---- Domain hooks ----
  const afterCreateRef = useRef(null);

  const suiteActions = useEvalSuiteActions({
    projectId,
    applicationId,
    agentId,
    tab,
    isCreatingNew,
    editingSuiteId,
    afterCreateRef,
  });

  const datasetActions = useEvalDatasetActions({
    projectId,
    editingSuiteId,
    agentId,
    tab,
  });

  const dimensionActions = useEvalDimensionActions({
    projectId,
    editingSuiteId,
    dimensions,
    attachedDimensions: apiAttachedDimensions,
    agentId,
    tab,
  });

  // ---- Effective values (merge API + pending for new suites) ----
  const effectiveDatasetId = isCreatingNew ? datasetActions.pendingDatasetId : apiDatasetId;

  const { data: fetchedDatasetDetails } = useEvalDatasetQuery(
    { projectId, datasetId: effectiveDatasetId },
    { skip: !projectId || effectiveDatasetId == null },
  );
  const attachedDatasetDetails = effectiveDatasetId != null ? fetchedDatasetDetails : null;

  const attachedDimensionIds = useMemo(() => {
    if (isCreatingNew) {
      return dimensionActions.pendingDimensions.map(p => p.id);
    }
    return (activeSuiteDetail?.bindings ?? []).filter(b => b.dimension_id != null).map(b => b.dimension_id);
  }, [isCreatingNew, dimensionActions.pendingDimensions, activeSuiteDetail?.bindings]);

  const attachedDimensions = useMemo(() => {
    if (isCreatingNew) {
      const dimMap = buildDimensionLookupMap(dimensions);
      return dimensionActions.pendingDimensions.map(pending => {
        const dim = dimMap.get(pending.id);
        return {
          binding: { id: `pending-${pending.id}`, dimension_id: pending.id, engine: pending.engine },
          name: dim?.name || `Dimension #${pending.id}`,
          tier: dim?.tier ?? null,
          defaultTarget: dim?.default_target ?? null,
          defaultTargetOperator: dim?.default_target_operator ?? null,
          defaultWeight: dim?.default_weight ?? null,
        };
      });
    }
    return apiAttachedDimensions;
  }, [isCreatingNew, dimensionActions.pendingDimensions, dimensions, apiAttachedDimensions]);

  const runActions = useEvalRunActions({
    projectId,
    editingSuiteId,
    applicationId,
    attachedDatasetId: effectiveDatasetId,
    attachedDatasetDetails,
    attachedDimensionsCount: attachedDimensions.length,
  });

  // Wire up afterCreate to flush pending state. Assigned from an effect rather than
  // during render so the render pass stays side-effect free; the ref is only read
  // from the async save handler, which always runs after the commit.
  const { flushPendingDataset } = datasetActions;
  const { flushPendingDimensions } = dimensionActions;

  useEffect(() => {
    afterCreateRef.current = async createdSuiteId => {
      await flushPendingDataset(createdSuiteId);
      await flushPendingDimensions(createdSuiteId);
    };
  }, [flushPendingDataset, flushPendingDimensions]);

  const datasetNamesById = useMemo(() => Object.fromEntries(datasets.map(d => [d.id, d.name])), [datasets]);

  const styles = agentEvaluatePageStyles();

  return (
    <Box sx={styles.wrapper}>
      <Box sx={styles.header}>
        <BreadcrumbsOrTitle title="Evaluation" />
      </Box>
      <Box sx={styles.body}>
        <Box sx={styles.leftPanel}>
          {suiteActions.isDetailView ? (
            <SuiteDetailPanel
              suite={suiteDetail}
              isNew={isCreatingNew}
              isLoading={!isCreatingNew && isSuiteLoading}
              modelsData={modelsData}
              datasets={datasets}
              attachedDataset={attachedDatasetDetails}
              attachedDimensions={attachedDimensions}
              suiteActions={suiteActions}
              datasetActions={datasetActions}
              dimensionActions={dimensionActions}
              runActions={runActions}
            />
          ) : (
            <SuitesPanel
              suites={suites}
              isLoading={isSuitesLoading}
              datasetNamesById={datasetNamesById}
              suiteActions={suiteActions}
            />
          )}
        </Box>
        <Box sx={styles.divider} />
        <Box sx={styles.rightPanel}>
          <ResultsPanel runActions={runActions} />
        </Box>
      </Box>

      {/* Suite delete confirmation */}
      <Modal.DeleteEntityModal
        open={!!suiteActions.suiteToDelete}
        onClose={suiteActions.handleCloseDelete}
        onConfirm={suiteActions.handleConfirmDelete}
        title="Delete confirmation"
        textContent="Are you sure to delete the "
        name={suiteActions.suiteToDelete?.name}
        shouldRequestInputName
        confirmButtonText="Delete"
      />

      {/* Dataset create dialog */}
      <DatasetModal
        open={datasetActions.showDatasetDialog}
        onClose={datasetActions.handleCloseDatasetDialog}
        projectId={projectId}
        applicationId={applicationId}
        dataset={null}
        onSaved={datasetActions.handleDatasetSaved}
      />

      {/* Dimension remove confirmation */}
      <Modal.DeleteEntityModal
        open={!!dimensionActions.dimensionToRemove}
        onClose={dimensionActions.handleCloseRemoveDimension}
        onConfirm={dimensionActions.handleConfirmRemoveDimension}
        title="Remove confirmation"
        textContent="Are you sure to remove "
        name={dimensionActions.dimensionToRemove?.name}
        inlineExtraContent=" from this suite?"
        confirmButtonText="Remove"
      />

      {/* Case exclude confirmation */}
      <Modal.DeleteEntityModal
        open={datasetActions.showExcludeCaseConfirm}
        onClose={datasetActions.handleCloseExcludeCaseConfirm}
        onConfirm={datasetActions.handleConfirmExcludeCase}
        title="Exclude confirmation"
        textContent="Are you sure to exclude case "
        name={`#${datasetActions.caseToExclude?.id ?? ''}`}
        inlineExtraContent=" from this suite? The case will remain in the dataset."
        confirmButtonText="Exclude"
        alarm
      />

      {/* Dimension modals (saved suite OR new suite) */}
      {(editingSuiteId || isCreatingNew) && (
        <>
          <SelectDimensionFromLibraryModal
            open={dimensionActions.showDimensionLibrary}
            onClose={dimensionActions.handleCloseDimensionLibrary}
            projectId={projectId}
            applicationId={applicationId}
            attachedDimensionIds={attachedDimensionIds}
            onAdd={dimensionActions.handleAddDimensionsFromLibrary}
          />
          <DimensionModal
            open={dimensionActions.showCreateDimensionModal || !!dimensionActions.dimensionToEdit}
            onClose={
              dimensionActions.dimensionToEdit
                ? dimensionActions.handleCloseEditDimension
                : dimensionActions.handleCloseCreateDimensionModal
            }
            projectId={projectId}
            applicationId={applicationId}
            dimension={dimensionActions.dimensionToEdit}
            onSaved={
              dimensionActions.dimensionToEdit
                ? dimensionActions.handleDimensionUpdated
                : dimensionActions.handleDimensionCreated
            }
          />
          <BuildDimensionWithAiModal
            open={dimensionActions.showBuildDimensionWithAi}
            onClose={dimensionActions.handleCloseBuildDimensionWithAi}
            projectId={projectId}
            applicationId={applicationId}
            onSaved={dimensionActions.handleDimensionCreated}
          />
        </>
      )}

      {/* Clear results confirmation */}
      <Modal.DeleteEntityModal
        open={runActions.showClearConfirm}
        onClose={runActions.handleCloseClearConfirm}
        onConfirm={runActions.handleConfirmClearResults}
        title="Clear confirmation"
        textContent="Are you sure you want to clear the evaluation results? This action cannot be undone."
        confirmButtonText="Clear"
        inlineExtraContent=" "
      />
    </Box>
  );
});

AgentEvaluatePage.displayName = 'AgentEvaluatePage';

/** @type {MuiSx} */
const agentEvaluatePageStyles = () => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  header: ({ palette }) => ({
    height: '3.8rem',
    minHeight: '3.8rem',
    width: '100%',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    padding: '0 1.5rem',
  }),
  body: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  leftPanel: {
    display: 'flex',
    flexDirection: 'column',
    width: '35%',
    minWidth: 0,
    overflow: 'hidden',
  },
  rightPanel: {
    display: 'flex',
    flexDirection: 'column',
    width: '65%',
    minWidth: 0,
    overflow: 'hidden',
  },
  divider: ({ palette }) => ({
    width: '0.0625rem',
    backgroundColor: palette.border.lines,
    flexShrink: 0,
  }),
});

export default AgentEvaluatePage;
