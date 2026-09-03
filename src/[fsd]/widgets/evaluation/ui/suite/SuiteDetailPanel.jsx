import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, CircularProgress, Skeleton, Tooltip, Typography } from '@mui/material';

import { AccordionConstants, ModalConstants } from '@/[fsd]/shared/lib/constants';
import { Button, Input, Modal } from '@/[fsd]/shared/ui';
import { BasicAccordion } from '@/[fsd]/shared/ui/accordion';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { LLMModelSelector } from '@/[fsd]/widgets/llm-model-selector';
import { MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH } from '@/common/constants';
import ArrowBackIcon from '@/components/Icons/ArrowBackIcon';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import InfoIcon from '@/components/Icons/InfoIcon';
import SendIcon from '@/components/Icons/SendIcon';
import useCheckPermission from '@/hooks/useCheckPermission';

import { EVAL_PERMISSIONS } from '../../lib/constants';
import DatasetSection from './dataset/DatasetSection';
import DatasetSectionHeader from './dataset/DatasetSectionHeader';
import DimensionSection from './dimension/DimensionSection';
import DimensionSectionHeader from './dimension/DimensionSectionHeader';

const AUTO_JUDGE_MODEL_ID = '__auto__';

const JUDGE_MODEL_TOOLTIP =
  "The judge model evaluates the agent's input, output or instructions against the selected dimensions and datasets. All evaluation runs for this suit use this model.";

const SuiteDetailPanel = memo(props => {
  const {
    suite,
    isNew,
    isLoading,
    modelsData = { items: [] },
    datasets = [],
    attachedDataset = null,
    isSaving,
    onBack,
    onSave,
    onDiscard,
    onDelete,
    onEvaluate,
    onDirtyChange,
    onManageDatasets,
    onCreateDataset,
    onAttachDataset,
    onRemoveDataset,
    onOpenDataset,
    onAddCase,
    onEditCase,
    onRemoveCase,
    onImportCases,
    onPromoteCases,
    onManageDimensions,
    onSelectDimensionFromLibrary,
    onCreateDimensionManually,
    onBuildDimensionWithAi,
    onEditDimension,
    onRemoveDimension,
    attachedDimensions = [],
  } = props;

  const { checkPermission } = useCheckPermission();
  const canUpdateSuite = checkPermission(EVAL_PERMISSIONS.suiteUpdate);
  const canDeleteSuite = checkPermission(EVAL_PERMISSIONS.suiteDelete);
  const canRun = checkPermission(EVAL_PERMISSIONS.runCreate);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [judgeModel, setJudgeModel] = useState(null);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  useEffect(() => {
    if (isNew) {
      setName('');
      setDescription('');
      setJudgeModel(null);
      return;
    }
    if (suite) {
      setName(suite.name ?? '');
      setDescription(suite.description ?? '');
      setJudgeModel(suite.judge_model ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, suite?.id]);

  const handleNameChange = useCallback(event => {
    setName(event.target.value);
  }, []);

  const handleDescriptionChange = useCallback(event => {
    setDescription(event.target.value);
  }, []);

  const autoJudgeModelLabel = modelsData.low_tier_default_model_name
    ? `Auto (${modelsData.low_tier_default_model_name})`
    : 'Auto';

  const autoJudgeModelOption = useMemo(
    () => ({ id: AUTO_JUDGE_MODEL_ID, name: AUTO_JUDGE_MODEL_ID, display_name: autoJudgeModelLabel }),
    [autoJudgeModelLabel],
  );

  const selectedJudgeModel = useMemo(() => {
    if (judgeModel == null) return autoJudgeModelOption;
    const match = modelsData.items.find(
      m => m.name === judgeModel.model_name && m.project_id === judgeModel.model_project_id,
    );
    return (
      match || {
        id: 'judge-model-missing',
        name: judgeModel.model_name,
        display_name: `${judgeModel.model_name} (unavailable)`,
      }
    );
  }, [judgeModel, autoJudgeModelOption, modelsData.items]);

  const judgeModelOptions = useMemo(() => {
    const base = [autoJudgeModelOption, ...modelsData.items];
    if (selectedJudgeModel?.id === 'judge-model-missing') base.push(selectedJudgeModel);
    return base;
  }, [autoJudgeModelOption, modelsData.items, selectedJudgeModel]);

  const handleSelectJudgeModel = useCallback(model => {
    if (!model || model.id === AUTO_JUDGE_MODEL_ID) {
      setJudgeModel(null);
      return;
    }
    setJudgeModel({ model_name: model.name, model_project_id: model.project_id });
  }, []);

  const handleSave = useCallback(() => {
    onSave?.({ name: name.trim(), description, judge_model: judgeModel });
  }, [onSave, name, description, judgeModel]);

  const handleDiscardClick = useCallback(() => {
    setShowDiscardModal(true);
  }, []);

  const handleDiscardConfirm = useCallback(() => {
    if (suite) {
      setName(suite.name ?? '');
      setDescription(suite.description ?? '');
      setJudgeModel(suite.judge_model ?? null);
    }
    setShowDiscardModal(false);
    onDiscard?.();
  }, [onDiscard, suite]);

  const isDirty = useMemo(() => {
    if (isNew) return !!name.trim();
    if (!suite) return false;
    return (
      name !== (suite.name ?? '') ||
      description !== (suite.description ?? '') ||
      JSON.stringify(judgeModel) !== JSON.stringify(suite.judge_model ?? null)
    );
  }, [isNew, suite, name, description, judgeModel]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleDelete = useCallback(() => {
    onDelete?.(suite);
  }, [onDelete, suite]);

  const isSaveDisabled = !name.trim() || isSaving || !isDirty || !canUpdateSuite;
  const isEvaluateDisabled = isNew || !suite?.id || !canRun;
  const title = isNew ? 'New Suite' : (suite?.name ?? 'Suite');

  const styles = suiteDetailPanelStyles();

  if (isLoading) {
    return (
      <Box sx={styles.root}>
        <Box sx={styles.header}>
          <Box sx={styles.headerLeft}>
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.tertiary}
              onClick={onBack}
              sx={styles.backButton}
              startIcon={<ArrowBackIcon />}
            />
            <Skeleton
              variant="text"
              width={120}
              sx={styles.headerTitleSkeleton}
            />
          </Box>
        </Box>
        <Box sx={styles.loadingContainer}>
          <CircularProgress size={32} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={styles.root}>
      <Box sx={styles.header}>
        <Box sx={styles.headerLeft}>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.tertiary}
            onClick={onBack}
            sx={styles.backButton}
            startIcon={<ArrowBackIcon />}
          />
          <Typography
            variant="bodyMedium"
            sx={styles.headerTitle}
          >
            {title}
          </Typography>
        </Box>
        <Box sx={styles.headerRight}>
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.contained}
            color={BUTTON_COLORS.primary}
            disabled={isSaveDisabled}
            onClick={handleSave}
            sx={styles.headerButton}
          >
            Save
          </Button.BaseBtn>
          {!isNew && (
            <>
              <Button.BaseBtn
                variant={BUTTON_VARIANTS.elitea}
                color={BUTTON_COLORS.secondary}
                disabled={!isDirty}
                onClick={handleDiscardClick}
                sx={styles.headerButton}
              >
                Discard
              </Button.BaseBtn>
              {canDeleteSuite && (
                <>
                  <Box sx={styles.headerDivider} />
                  <Button.BaseBtn
                    variant={BUTTON_VARIANTS.tertiary}
                    onClick={handleDelete}
                    sx={styles.deleteButton}
                    startIcon={<DeleteIcon sx={styles.deleteIcon} />}
                  />
                </>
              )}
            </>
          )}
        </Box>
      </Box>
      <Box sx={styles.content}>
        <BasicAccordion
          showMode={AccordionConstants.AccordionShowMode.LeftMode}
          style={styles.accordion}
          summarySX={styles.accordionSummary}
          items={[
            {
              title: 'General',
              content: (
                <Box sx={styles.formSection}>
                  <Input.InputBase
                    autoComplete="off"
                    fullWidth
                    variant="standard"
                    label="Name"
                    value={name}
                    onChange={handleNameChange}
                    required
                    disabled={!canUpdateSuite}
                    inputProps={{ maxLength: MAX_NAME_LENGTH }}
                  />
                  <Input.InputBase
                    autoComplete="off"
                    fullWidth
                    variant="standard"
                    label="Description"
                    value={description}
                    onChange={handleDescriptionChange}
                    multiline
                    maxRows={6}
                    disabled={!canUpdateSuite}
                    inputProps={{ maxLength: MAX_DESCRIPTION_LENGTH }}
                  />
                  <LLMModelSelector
                    variant="field"
                    label="Judge Model"
                    labelAdornment={
                      <Tooltip
                        title={JUDGE_MODEL_TOOLTIP}
                        placement="top"
                        arrow
                      >
                        <Box
                          component="span"
                          sx={styles.infoIconWrapper}
                        >
                          <InfoIcon sx={styles.infoIcon} />
                        </Box>
                      </Tooltip>
                    }
                    models={judgeModelOptions}
                    selectedModel={selectedJudgeModel}
                    onSelectModel={handleSelectJudgeModel}
                    showSettingsEntry={false}
                    disabled={!canUpdateSuite}
                  />
                </Box>
              ),
            },
            {
              title: 'Dataset',
              headerContent: <DatasetSectionHeader onManageDatasets={onManageDatasets} />,
              content: (
                <DatasetSection
                  datasets={datasets}
                  attachedDataset={attachedDataset}
                  onCreateDataset={onCreateDataset}
                  onAttachDataset={onAttachDataset}
                  onRemoveDataset={onRemoveDataset}
                  onOpenDataset={onOpenDataset}
                  onAddCase={onAddCase}
                  onEditCase={onEditCase}
                  onRemoveCase={onRemoveCase}
                  onImportCases={onImportCases}
                  onPromoteCases={onPromoteCases}
                />
              ),
            },
            {
              title: 'Dimensions',
              headerContent: <DimensionSectionHeader onManageDimensions={onManageDimensions} />,
              content: (
                <DimensionSection
                  attachedDimensions={attachedDimensions}
                  onSelectFromLibrary={onSelectDimensionFromLibrary}
                  onCreateManually={onCreateDimensionManually}
                  onBuildWithAi={onBuildDimensionWithAi}
                  onEditDimension={onEditDimension}
                  onRemoveDimension={onRemoveDimension}
                />
              ),
            },
          ]}
        />
      </Box>
      <Box sx={styles.footer}>
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.elitea}
          color={BUTTON_COLORS.primary}
          disabled={isEvaluateDisabled}
          onClick={onEvaluate}
          startIcon={<SendIcon sx={styles.sendIcon} />}
          sx={styles.evaluateButton}
        >
          Evaluate
        </Button.BaseBtn>
      </Box>
      <Modal.BaseModal
        open={showDiscardModal}
        variant={ModalConstants.MODAL_VARIANT.simple}
        titleIcon={ModalConstants.MODAL_ICON_TYPE.warning}
        title="Warning"
        content="Are you sure you want to discard changes?"
        onClose={() => setShowDiscardModal(false)}
        onConfirm={handleDiscardConfirm}
        cancelButtonText="Cancel"
        confirmButtonText="Discard"
        alarm
      />
    </Box>
  );
});

SuiteDetailPanel.displayName = 'SuiteDetailPanel';

/** @type {MuiSx} */
const suiteDetailPanelStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  accordion: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  accordionSummary: {
    '& .MuiAccordionSummary-content': {
      display: 'flex',
      alignItems: 'center',
      width: '100%',
    },
  },
  header: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1.5rem',
    height: '3.3125rem',
    minHeight: '3.3125rem',
    boxSizing: 'border-box',
    backgroundColor: palette.background.folder.default,
    borderBottom: `0.0625rem solid ${palette.border.table}`,
  }),
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: 0,
  },
  backButton: ({ palette }) => ({
    padding: '0.25rem',
    '&:hover svg path': {
      fill: palette.icon.fill.secondary,
    },
  }),
  headerTitle: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  headerTitleSkeleton: {
    fontSize: '0.875rem',
    lineHeight: '1.5rem',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  headerButton: {
    height: '1.75rem',
    fontSize: '0.8125rem',
  },
  headerDivider: ({ palette }) => ({
    width: '0.0625rem',
    height: '1.5rem',
    backgroundColor: palette.border.lines,
    marginLeft: '0.25rem',
    marginRight: '0.25rem',
  }),
  deleteButton: ({ palette }) => ({
    padding: '0.25rem',
    '&:hover svg path': {
      fill: palette.icon.fill.secondary,
    },
  }),
  deleteIcon: {
    fontSize: '1rem',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    padding: '1rem 1.5rem',
  },
  formSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  infoIconWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  infoIcon: ({ palette }) => ({
    fontSize: '1rem',
    color: palette.icon.fill.default,
  }),
  footer: ({ palette }) => ({
    display: 'flex',
    justifyContent: 'center',
    padding: '0.75rem 1.5rem',
    borderTop: `0.0625rem solid ${palette.border.table}`,
    backgroundColor: palette.background.toolkitDetailLeftPanel,
  }),
  evaluateButton: ({ palette }) => ({
    padding: '0.375rem 1rem 0.375rem 0.75rem',
    gap: '0.5rem',
    borderRadius: '1.5rem',
    backgroundColor: palette.split.default,
    color: palette.primary.main,
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
    '& svg path': {
      fill: palette.primary.main,
    },
    '&:hover': {
      backgroundColor: palette.split.hover,
    },
    '&.Mui-disabled': {
      backgroundColor: palette.background.button.default,
      color: palette.text.disabled,
      '& svg path': {
        fill: palette.text.disabled,
      },
    },
  }),
  sendIcon: {
    fontSize: '1rem',
  },
});

export default SuiteDetailPanel;
