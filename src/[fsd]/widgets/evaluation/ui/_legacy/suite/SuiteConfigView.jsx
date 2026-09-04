import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import { Button, Input, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { LLMModelSelector } from '@/[fsd]/widgets/llm-model-selector';
import { useListModelsQuery } from '@/api/configurations';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import {
  ContentContainer,
  LeftContentContainer,
  LeftGridItem,
  RightGridItem,
  StyledGridContainer,
} from '@/pages/Common/Components/StyledComponents';

import {
  useAddEvalBindingMutation,
  useBootstrapEvalSuiteMutation,
  useCreateEvalSuiteMutation,
  useDeleteEvalBindingMutation,
  useEvalDatasetsQuery,
  useEvalDimensionsQuery,
  useEvalRunsQuery,
  useEvalSuiteQuery,
  useEvalSuitesQuery,
  useMaterializePlatformDimensionMutation,
  usePlatformDimensionCatalogQuery,
  useReorderEvalBindingsMutation,
  useStartEvalRunMutation,
  useUpdateEvalSuiteMutation,
} from '../../../api';
import {
  ADD_VALIDATION_MENU,
  EVAL_ENGINE,
  EVAL_PERMISSIONS,
  EVAL_RUN_TRIGGER,
  EVAL_TIER,
} from '../../../lib/constants';
import { getBindingLabel, parseEvalError } from '../../../lib/helpers';
import { useStickySuiteSelection } from '../../../lib/hooks';
import { DimensionEditorDialog } from '../library';
import { LastRunSummary, ResultsScorecardDialog, RunHistoryList, RunProgressDialog } from '../results';
import AddValidationMenu from './AddValidationMenu';
import BindingDetailDialog from './BindingDetailDialog';
import BindingList from './BindingList';
import GenerateDimensionsDialog from './GenerateDimensionsDialog';
import LibraryPickerDialog from './LibraryPickerDialog';

const NONE_DATASET = '';
const AUTO_JUDGE_MODEL_ID = '__auto__';

// A new binding inherits the dimension's configured defaults (weight / target /
// operator). Used both when attaching from the library and when a freshly
// created dimension is auto-attached, so the two paths stay consistent.
const dimensionBindingBody = (item, evidenceScope) => {
  const hasTarget = item.default_target !== null && item.default_target !== undefined;
  const engines = item.allowed_engines ?? [];
  return {
    dimension_id: item.id,
    // The binding's engine defaults to `ai` server-side, which is wrong for a dimension that
    // is not AI-scorable, so send an engine the definition actually allows.
    ...(engines.length && !engines.includes(EVAL_ENGINE.ai) ? { engine: engines[0] } : {}),
    weight: item.default_weight ?? 1,
    target: hasTarget ? item.default_target : null,
    target_operator: hasTarget ? (item.default_target_operator ?? null) : null,
    ...(evidenceScope ? { evidence_scope: evidenceScope } : {}),
  };
};

const SuiteConfigView = memo(props => {
  const {
    isFetching: isAppFetching,
    isError: isAppError,
    applicationId,
    applicationVersionId,
    onOpenDatasets,
  } = props;

  const projectId = useSelectedProjectId();
  const { checkPermission } = useCheckPermission();
  const { toastError, toastSuccess } = useToast();

  const canCreateSuite = checkPermission(EVAL_PERMISSIONS.suiteCreate);
  const canUpdateSuite = checkPermission(EVAL_PERMISSIONS.suiteUpdate);
  const canCreateDimension = checkPermission(EVAL_PERMISSIONS.dimensionCreate);
  const canRun = checkPermission(EVAL_PERMISSIONS.runCreate);

  const [selectedSuiteId, setSelectedSuiteId] = useStickySuiteSelection(projectId, applicationId);
  const [datasetDraft, setDatasetDraft] = useState(NONE_DATASET);
  const [judgeModelDraft, setJudgeModelDraft] = useState(null);
  const [newSuiteDialog, setNewSuiteDialog] = useState({ open: false, name: '' });
  const [bindingDialog, setBindingDialog] = useState({ open: false, binding: null });
  const [pickerDialog, setPickerDialog] = useState({ open: false, kind: null });
  const [dimensionDialog, setDimensionDialog] = useState(false);
  const [generateDialog, setGenerateDialog] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [runDialog, setRunDialog] = useState({ open: false, runId: null });
  const [scorecardDialog, setScorecardDialog] = useState({ open: false, runId: null });

  const skip = !projectId || !applicationId;

  const {
    data: suites = [],
    isLoading: isSuitesLoading,
    isError: isSuitesError,
  } = useEvalSuitesQuery({ projectId, applicationId }, { skip });

  const { data: dimensions = [], isError: isDimensionsError } = useEvalDimensionsQuery(
    { projectId, agentId: applicationId },
    { skip: !projectId },
  );

  // Fetched only while the platform picker is open — the catalog is a shared-schema read.
  const { data: platformCatalog = [] } = usePlatformDimensionCatalogQuery(
    { projectId },
    { skip: !projectId || pickerDialog.kind !== 'platform' },
  );

  const { data: datasets = [] } = useEvalDatasetsQuery(
    { projectId, agentId: applicationId },
    { skip: !projectId },
  );

  const { data: modelsData = { items: [] } } = useListModelsQuery(
    { projectId, include_shared: true, section: 'llm' },
    { skip: !projectId },
  );

  const { data: suiteDetail, isFetching: isSuiteDetailFetching } = useEvalSuiteQuery(
    { projectId, suiteId: selectedSuiteId },
    { skip: !projectId || selectedSuiteId == null },
  );

  const { data: runs = [], refetch: refetchRuns } = useEvalRunsQuery(
    { projectId, applicationId, suiteId: selectedSuiteId },
    { skip: skip || selectedSuiteId == null },
  );

  const [bootstrapSuite] = useBootstrapEvalSuiteMutation();
  const [createSuite, { isLoading: isCreatingSuite }] = useCreateEvalSuiteMutation();
  const [updateSuite, { isLoading: isSavingSuite }] = useUpdateEvalSuiteMutation();
  const [addBinding, { isLoading: isAttaching }] = useAddEvalBindingMutation();
  const [materializePlatformDimension] = useMaterializePlatformDimensionMutation();
  const [deleteBinding, { isLoading: isRemoving }] = useDeleteEvalBindingMutation();
  const [reorderBindings, { isLoading: isReorderingBindings }] = useReorderEvalBindingsMutation();
  const [startRun, { isLoading: isStartingRun }] = useStartEvalRunMutation();

  const bootstrappedRef = useRef(false);

  // Idempotently create the default suite the first time an author with create
  // rights opens an agent that has none (§13).
  useEffect(() => {
    if (skip || isSuitesLoading || isSuitesError) return;
    if (suites.length > 0 || bootstrappedRef.current || !canCreateSuite) return;
    bootstrappedRef.current = true;
    bootstrapSuite({ projectId, body: { application_id: applicationId } })
      .unwrap()
      .catch(error => toastError(parseEvalError(error, 'Failed to create default suite.')));
  }, [
    skip,
    isSuitesLoading,
    isSuitesError,
    suites.length,
    canCreateSuite,
    bootstrapSuite,
    projectId,
    applicationId,
    toastError,
  ]);

  // Keep a valid selected suite as the list changes. Guarded on the loading
  // state so an in-flight fetch (empty list) never clears a sticky selection.
  useEffect(() => {
    if (isSuitesLoading) return;
    if (!suites.length) {
      setSelectedSuiteId(null);
      return;
    }
    setSelectedSuiteId(prev => (suites.some(s => s.id === prev) ? prev : suites[0].id));
  }, [suites, isSuitesLoading, setSelectedSuiteId]);

  // Sync the dataset draft to the loaded suite.
  useEffect(() => {
    setDatasetDraft(suiteDetail?.dataset_id ?? NONE_DATASET);
  }, [suiteDetail?.id, suiteDetail?.dataset_id]);

  // Sync the judge model draft to the loaded suite. `judge_model` is an object, so it must not
  // be a dependency here — its reference changes on every refetch even when the value is the
  // same, which would silently wipe an in-progress selection.
  useEffect(() => {
    setJudgeModelDraft(suiteDetail?.judge_model ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suiteDetail?.id]);

  const suiteOptions = useMemo(() => suites.map(s => ({ value: s.id, label: s.name })), [suites]);
  const datasetOptions = useMemo(
    () => [
      { value: NONE_DATASET, label: 'No dataset (quick run)' },
      ...datasets.map(d => ({ value: d.id, label: d.name })),
    ],
    [datasets],
  );

  const bindings = useMemo(() => suiteDetail?.bindings ?? [], [suiteDetail?.bindings]);
  const boundDimensionIds = useMemo(
    () => new Set(bindings.filter(b => b.dimension_id != null).map(b => b.dimension_id)),
    [bindings],
  );
  const lastRun = runs.length ? runs[0] : null;

  const datasetDirty = (suiteDetail?.dataset_id ?? NONE_DATASET) !== datasetDraft;
  const savedJudgeModel = suiteDetail?.judge_model ?? null;
  const judgeModelDirty =
    (savedJudgeModel?.model_name ?? null) !== (judgeModelDraft?.model_name ?? null) ||
    (savedJudgeModel?.model_project_id ?? null) !== (judgeModelDraft?.model_project_id ?? null);

  const autoJudgeModelLabel = modelsData.low_tier_default_model_name
    ? `Auto (${modelsData.low_tier_default_model_name})`
    : 'Auto';
  const autoJudgeModelOption = useMemo(
    () => ({ id: AUTO_JUDGE_MODEL_ID, name: AUTO_JUDGE_MODEL_ID, display_name: autoJudgeModelLabel }),
    [autoJudgeModelLabel],
  );
  const selectedJudgeModel = useMemo(() => {
    if (judgeModelDraft == null) return autoJudgeModelOption;
    const match = modelsData.items.find(
      m => m.name === judgeModelDraft.model_name && m.project_id === judgeModelDraft.model_project_id,
    );
    return (
      match || {
        id: 'judge-model-missing',
        name: judgeModelDraft.model_name,
        display_name: `${judgeModelDraft.model_name} (unavailable)`,
      }
    );
  }, [judgeModelDraft, autoJudgeModelOption, modelsData.items]);
  const judgeModelOptions = useMemo(() => {
    const base = [autoJudgeModelOption, ...modelsData.items];
    // Surface an unavailable saved model so the user can at least see it and replace it.
    if (selectedJudgeModel?.id === 'judge-model-missing') base.push(selectedJudgeModel);
    return base;
  }, [autoJudgeModelOption, modelsData.items, selectedJudgeModel]);

  const handleSelectSuite = useCallback(value => setSelectedSuiteId(value), [setSelectedSuiteId]);

  const handleSaveSuite = useCallback(async () => {
    if (selectedSuiteId == null) return;
    try {
      await updateSuite({
        projectId,
        suiteId: selectedSuiteId,
        body: {
          dataset_id: datasetDraft === NONE_DATASET ? null : datasetDraft,
          judge_model: judgeModelDraft,
        },
      }).unwrap();
      toastSuccess('Suite saved.');
    } catch (error) {
      toastError(parseEvalError(error, 'Failed to save suite.'));
    }
  }, [selectedSuiteId, updateSuite, projectId, datasetDraft, judgeModelDraft, toastSuccess, toastError]);

  const handleCreateSuite = useCallback(async () => {
    const name = newSuiteDialog.name.trim();
    if (!name) return;
    try {
      const created = await createSuite({
        projectId,
        body: { application_id: applicationId, name },
      }).unwrap();
      setNewSuiteDialog({ open: false, name: '' });
      if (created?.id != null) setSelectedSuiteId(created.id);
      toastSuccess('Suite created.');
    } catch (error) {
      toastError(parseEvalError(error, 'Failed to create suite.'));
    }
  }, [
    newSuiteDialog.name,
    createSuite,
    projectId,
    applicationId,
    setSelectedSuiteId,
    toastSuccess,
    toastError,
  ]);

  const attachBinding = useCallback(
    async body => {
      if (selectedSuiteId == null) return;
      try {
        await addBinding({ projectId, suiteId: selectedSuiteId, body }).unwrap();
        toastSuccess('Validation added.');
      } catch (error) {
        toastError(parseEvalError(error, 'Failed to add validation.'));
      }
    },
    [selectedSuiteId, addBinding, projectId, toastSuccess, toastError],
  );

  const handleAttachDimension = useCallback(
    item => {
      setPickerDialog({ open: false, kind: null });
      attachBinding(dimensionBindingBody(item));
    },
    [attachBinding],
  );
  // Attaching a platform dimension copies it into this project first: the binding FKs to a
  // local eval_dimension row, so it needs the local id, not the registry uuid.
  const handleAttachPlatformDimension = useCallback(
    async item => {
      setPickerDialog({ open: false, kind: null });
      try {
        const local = await materializePlatformDimension({ projectId, uuid: item.uuid }).unwrap();
        attachBinding(dimensionBindingBody(local));
      } catch (error) {
        toastError(parseEvalError(error, 'Failed to add the platform dimension.'));
      }
    },
    [materializePlatformDimension, projectId, attachBinding, toastError],
  );
  const handleAddMenuSelect = useCallback(key => {
    switch (key) {
      case ADD_VALIDATION_MENU.dimensionLibrary:
        setPickerDialog({ open: true, kind: 'dimension' });
        break;
      case ADD_VALIDATION_MENU.platformCatalog:
        setPickerDialog({ open: true, kind: 'platform' });
        break;
      case ADD_VALIDATION_MENU.newDimension:
        setDimensionDialog(true);
        break;
      case ADD_VALIDATION_MENU.generateWithAi:
        setGenerateDialog(true);
        break;
      default:
        break;
    }
  }, []);

  const handleEditBinding = useCallback(binding => setBindingDialog({ open: true, binding }), []);
  const handleRequestRemove = useCallback(binding => setRemoveTarget(binding), []);
  const handleConfirmRemove = useCallback(async () => {
    if (!removeTarget || selectedSuiteId == null) return;
    try {
      await deleteBinding({ projectId, suiteId: selectedSuiteId, bindingId: removeTarget.id }).unwrap();
      toastSuccess('Validation removed.');
      setRemoveTarget(null);
    } catch (error) {
      toastError(parseEvalError(error, 'Failed to remove validation.'));
    }
  }, [removeTarget, selectedSuiteId, deleteBinding, projectId, toastSuccess, toastError]);

  const handleReorderBindings = useCallback(
    async bindingIds => {
      if (selectedSuiteId == null) return;
      try {
        await reorderBindings({
          projectId,
          suiteId: selectedSuiteId,
          body: { binding_ids: bindingIds },
        }).unwrap();
      } catch (error) {
        toastError(parseEvalError(error, 'Failed to reorder validations.'));
      }
    },
    [selectedSuiteId, reorderBindings, projectId, toastError],
  );

  const handleRun = useCallback(async () => {
    if (selectedSuiteId == null) return;
    try {
      const started = await startRun({
        projectId,
        body: {
          suite_id: selectedSuiteId,
          trigger_type: EVAL_RUN_TRIGGER.offline_batch,
          dataset_id: datasetDraft === NONE_DATASET ? null : datasetDraft,
          application_version_id: applicationVersionId ?? null,
        },
      }).unwrap();
      setRunDialog({ open: true, runId: started?.id ?? null });
    } catch (error) {
      toastError(parseEvalError(error, 'Failed to start evaluation run.'));
    }
  }, [selectedSuiteId, startRun, projectId, datasetDraft, applicationVersionId, toastError]);

  // The runs-list query and the single-run poll share a non-scoped cache tag, so
  // the poll settling to a terminal status does not refresh the list. Refetch it
  // here so LastRunSummary leaves the stale create-time snapshot (status/score/counts).
  const handleRunTerminal = useCallback(() => {
    refetchRuns();
  }, [refetchRuns]);

  const handleCloseRunDialog = useCallback(() => setRunDialog({ open: false, runId: null }), []);

  const handleViewResults = useCallback(runId => {
    if (runId == null) return;
    setRunDialog({ open: false, runId: null });
    setScorecardDialog({ open: true, runId });
  }, []);

  const handleCloseScorecard = useCallback(() => setScorecardDialog({ open: false, runId: null }), []);

  const handleOpenNewSuiteDialog = useCallback(() => setNewSuiteDialog({ open: true, name: '' }), []);
  const handleCloseNewSuiteDialog = useCallback(() => setNewSuiteDialog({ open: false, name: '' }), []);
  const handleChangeNewSuiteName = useCallback(
    event => setNewSuiteDialog(prev => ({ ...prev, name: event.target.value })),
    [],
  );
  const handleCloseBindingDialog = useCallback(() => setBindingDialog({ open: false, binding: null }), []);
  const handleClosePickerDialog = useCallback(() => setPickerDialog({ open: false, kind: null }), []);
  const handleCloseDimensionDialog = useCallback(() => setDimensionDialog(false), []);
  const handleCloseGenerateDialog = useCallback(() => setGenerateDialog(false), []);
  const handleCloseRemoveTarget = useCallback(() => setRemoveTarget(null), []);

  const handleEditDataset = useCallback(() => {
    onOpenDatasets?.(datasetDraft === NONE_DATASET ? null : datasetDraft);
  }, [onOpenDatasets, datasetDraft]);

  const handleSelectJudgeModel = useCallback(model => {
    if (!model || model.id === AUTO_JUDGE_MODEL_ID) {
      setJudgeModelDraft(null);
      return;
    }
    setJudgeModelDraft({ model_name: model.name, model_project_id: model.project_id });
  }, []);

  const pickerItems = useMemo(() => {
    if (pickerDialog.kind === 'dimension') {
      return dimensions.filter(d => d.tier !== EVAL_TIER.platform && !boundDimensionIds.has(d.id));
    }
    if (pickerDialog.kind === 'platform') {
      // The catalog is already limited to active entries; an entry this suite has bound
      // already has a local id, which is what the bindings reference.
      return platformCatalog.filter(d => !boundDimensionIds.has(d.local_dimension_id));
    }
    return [];
  }, [pickerDialog.kind, dimensions, platformCatalog, boundDimensionIds]);

  const styles = suiteConfigViewStyles();

  const isError = isAppError || isSuitesError || isDimensionsError;
  const isLoading = isAppFetching || isSuitesLoading;

  if (isError) {
    return (
      <Box
        sx={styles.centered}
        data-testid="evaluation-suite-config-view"
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
        data-testid="evaluation-suite-config-view"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!suites.length) {
    return (
      <Box
        sx={styles.centered}
        data-testid="evaluation-suite-config-view"
      >
        <Typography
          variant="bodySmall"
          color="text.secondary"
        >
          No evaluation suite is configured for this agent yet.
        </Typography>
      </Box>
    );
  }

  return (
    <StyledGridContainer
      container
      data-testid="evaluation-suite-config-view"
    >
      <LeftGridItem
        item
        xs={7}
      >
        <LeftContentContainer>
          <Box sx={styles.leftBody}>
            <Box sx={styles.selectorRow}>
              <Box sx={styles.selectorGrow}>
                <SingleSelect
                  label="Suite"
                  showBorder
                  value={selectedSuiteId ?? ''}
                  options={suiteOptions}
                  onValueChange={handleSelectSuite}
                  data-testid="evaluation-suite-select"
                />
              </Box>
              {canCreateSuite && (
                <Button.BaseBtn
                  variant={BUTTON_VARIANTS.elitea}
                  color={BUTTON_COLORS.secondary}
                  onClick={handleOpenNewSuiteDialog}
                  data-testid="evaluation-new-suite"
                >
                  New
                </Button.BaseBtn>
              )}
            </Box>

            <Box sx={styles.selectorRow}>
              <Box sx={styles.selectorGrow}>
                <SingleSelect
                  label="Dataset"
                  showBorder
                  value={datasetDraft}
                  options={datasetOptions}
                  onValueChange={setDatasetDraft}
                  disabled={!canUpdateSuite}
                  data-testid="evaluation-dataset-select"
                />
              </Box>
              <Button.BaseBtn
                variant={BUTTON_VARIANTS.elitea}
                color={BUTTON_COLORS.secondary}
                onClick={handleEditDataset}
                data-testid="evaluation-edit-dataset"
              >
                Edit
              </Button.BaseBtn>
            </Box>

            <Box
              sx={styles.selectorRow}
              data-testid="evaluation-judge-model-select"
              aria-label="Judge model"
            >
              <Box sx={styles.selectorGrow}>
                <Typography
                  variant="labelSmall"
                  color="text.secondary"
                  sx={styles.judgeModelLabel}
                >
                  Judge model
                </Typography>
                <LLMModelSelector
                  variant="field"
                  models={judgeModelOptions}
                  selectedModel={selectedJudgeModel}
                  onSelectModel={handleSelectJudgeModel}
                  disabled={!canUpdateSuite}
                  showSettingsEntry={false}
                />
              </Box>
            </Box>

            <Box sx={styles.bindingsWrapper}>
              {isSuiteDetailFetching ? (
                <Box sx={styles.centeredInline}>
                  <CircularProgress size={20} />
                </Box>
              ) : (
                <BindingList
                  bindings={bindings}
                  dimensions={dimensions}
                  canEdit={canUpdateSuite}
                  onEdit={handleEditBinding}
                  onRemove={handleRequestRemove}
                  onReorder={handleReorderBindings}
                  isReordering={isReorderingBindings}
                />
              )}
            </Box>

            <Box sx={styles.leftActions}>
              {canUpdateSuite && (
                <AddValidationMenu
                  canCreateDimension={canCreateDimension}
                  onSelect={handleAddMenuSelect}
                />
              )}
              {canUpdateSuite && (
                <Button.BaseBtn
                  variant={BUTTON_VARIANTS.elitea}
                  color={BUTTON_COLORS.primary}
                  disabled={!(datasetDirty || judgeModelDirty) || isSavingSuite}
                  onClick={handleSaveSuite}
                  data-testid="evaluation-save-suite"
                >
                  Save
                </Button.BaseBtn>
              )}
            </Box>
          </Box>
        </LeftContentContainer>
      </LeftGridItem>

      <RightGridItem
        item
        xs={5}
      >
        <ContentContainer>
          <Box sx={styles.rightBody}>
            <LastRunSummary
              run={lastRun}
              onViewResults={handleViewResults}
            />
            {canRun && (
              <Button.BaseBtn
                variant={BUTTON_VARIANTS.elitea}
                color={BUTTON_COLORS.primary}
                disabled={selectedSuiteId == null || isStartingRun}
                onClick={handleRun}
                data-testid="evaluation-run"
              >
                Run evaluation
              </Button.BaseBtn>
            )}
            <RunHistoryList
              runs={runs}
              onViewResults={handleViewResults}
              canDelete={canRun}
            />
          </Box>
        </ContentContainer>
      </RightGridItem>

      <Modal.BaseModal
        open={newSuiteDialog.open}
        title="New suite"
        onClose={handleCloseNewSuiteDialog}
        content={
          <Box sx={styles.newSuiteContent}>
            <Input.InputBase
              autoFocus
              fullWidth
              variant="standard"
              label="Suite name"
              value={newSuiteDialog.name}
              onChange={handleChangeNewSuiteName}
              inputProps={{ maxLength: 128 }}
              data-testid="evaluation-new-suite-name"
            />
          </Box>
        }
        actions={
          <>
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.elitea}
              color={BUTTON_COLORS.secondary}
              onClick={handleCloseNewSuiteDialog}
            >
              Cancel
            </Button.BaseBtn>
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.elitea}
              color={BUTTON_COLORS.primary}
              disabled={isCreatingSuite || !newSuiteDialog.name.trim()}
              onClick={handleCreateSuite}
              data-testid="evaluation-new-suite-create"
            >
              Create
            </Button.BaseBtn>
          </>
        }
        data-testid="evaluation-new-suite-dialog"
      />

      <BindingDetailDialog
        open={bindingDialog.open}
        projectId={projectId}
        suiteId={selectedSuiteId}
        binding={bindingDialog.binding}
        dimensions={dimensions}
        onClose={handleCloseBindingDialog}
      />

      <LibraryPickerDialog
        open={pickerDialog.open}
        title={pickerDialog.kind === 'platform' ? 'Add platform validation' : 'Add dimension'}
        items={pickerItems}
        attaching={isAttaching}
        onAttach={pickerDialog.kind === 'platform' ? handleAttachPlatformDimension : handleAttachDimension}
        onClose={handleClosePickerDialog}
      />

      <DimensionEditorDialog
        open={dimensionDialog}
        projectId={projectId}
        applicationId={applicationId}
        dimension={null}
        onSaved={(result, evidenceScope) =>
          result?.id != null && attachBinding(dimensionBindingBody(result, evidenceScope))
        }
        onClose={handleCloseDimensionDialog}
      />

      <GenerateDimensionsDialog
        open={generateDialog}
        projectId={projectId}
        applicationId={applicationId}
        applicationVersionId={applicationVersionId}
        suiteId={selectedSuiteId}
        onClose={handleCloseGenerateDialog}
      />

      <Modal.DeleteEntityModal
        open={!!removeTarget}
        name={removeTarget ? getBindingLabel(removeTarget, { dimensions }) : ''}
        onClose={handleCloseRemoveTarget}
        onConfirm={handleConfirmRemove}
        alarm
        confirming={isRemoving}
      />

      <RunProgressDialog
        open={runDialog.open}
        projectId={projectId}
        runId={runDialog.runId}
        onClose={handleCloseRunDialog}
        onViewResults={handleViewResults}
        onTerminal={handleRunTerminal}
      />

      <ResultsScorecardDialog
        open={scorecardDialog.open}
        projectId={projectId}
        runId={scorecardDialog.runId}
        onClose={handleCloseScorecard}
      />
    </StyledGridContainer>
  );
});

SuiteConfigView.displayName = 'SuiteConfigView';

/** @type {MuiSx} */
const suiteConfigViewStyles = () => ({
  centered: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  centeredInline: {
    display: 'flex',
    justifyContent: 'center',
    padding: '1rem',
  },
  leftBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1.5rem',
    height: '100%',
    overflowY: 'auto',
  },
  selectorRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '0.75rem',
  },
  selectorGrow: {
    flex: 1,
    minWidth: 0,
  },
  judgeModelLabel: {
    marginBottom: '0.25rem',
  },
  bindingsWrapper: {
    flex: 1,
    minHeight: 0,
  },
  leftActions: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '0.75rem',
  },
  rightBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1.5rem',
    height: '100%',
    overflowY: 'auto',
  },
  newSuiteContent: {
    minWidth: '24rem',
    paddingTop: '0.5rem',
  },
});

export default SuiteConfigView;
