import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { Button, Input } from '@/[fsd]/shared/ui';
import { BasicAccordion } from '@/[fsd]/shared/ui/accordion';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { LLMModelSelector } from '@/[fsd]/widgets/llm-model-selector';
import { MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH } from '@/common/constants';
import ArrowBackIcon from '@/components/Icons/ArrowBackIcon';
import DeleteIcon from '@/components/Icons/DeleteIcon';
import InfoIcon from '@/components/Icons/InfoIcon';
import SendIcon from '@/components/Icons/SendIcon';

const AUTO_JUDGE_MODEL_ID = '__auto__';

const JUDGE_MODEL_TOOLTIP =
  "The judge model evaluates the agent's input, output or instructions against the selected dimensions and datasets. All evaluation runs for this suit use this model.";

const SuiteDetailPanel = memo(props => {
  const {
    suite,
    isNew,
    modelsData = { items: [] },
    isSaving,
    onBack,
    onSave,
    onDiscard,
    onDelete,
    onEvaluate,
  } = props;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [judgeModel, setJudgeModel] = useState(null);

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

  const handleDiscard = useCallback(() => {
    if (suite) {
      setName(suite.name ?? '');
      setDescription(suite.description ?? '');
      setJudgeModel(suite.judge_model ?? null);
    }
    onDiscard?.();
  }, [onDiscard, suite]);

  const handleDelete = useCallback(() => {
    onDelete?.(suite);
  }, [onDelete, suite]);

  const isDirty = useMemo(() => {
    if (isNew) return !!name.trim();
    if (!suite) return false;
    return (
      name !== (suite.name ?? '') ||
      description !== (suite.description ?? '') ||
      JSON.stringify(judgeModel) !== JSON.stringify(suite.judge_model ?? null)
    );
  }, [isNew, suite, name, description, judgeModel]);

  const isSaveDisabled = !name.trim() || isSaving || !isDirty;
  const isEvaluateDisabled = isNew || !suite?.id;
  const title = isNew ? 'New suite' : (suite?.name ?? '');

  const styles = suiteDetailPanelStyles();

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
                onClick={handleDiscard}
                sx={styles.headerButton}
              >
                Discard
              </Button.BaseBtn>
              <Box sx={styles.headerDivider} />
              <Button.BaseBtn
                variant={BUTTON_VARIANTS.tertiary}
                onClick={handleDelete}
                sx={styles.deleteButton}
                startIcon={<DeleteIcon sx={styles.deleteIcon} />}
              />
            </>
          )}
        </Box>
      </Box>
      <Box sx={styles.content}>
        <BasicAccordion
          showMode={AccordionConstants.AccordionShowMode.LeftMode}
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
                        <InfoIcon sx={styles.infoIcon} />
                      </Tooltip>
                    }
                    models={judgeModelOptions}
                    selectedModel={selectedJudgeModel}
                    onSelectModel={handleSelectJudgeModel}
                    showSettingsEntry={false}
                  />
                </Box>
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
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
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
  infoIcon: ({ palette }) => ({
    fontSize: '1rem',
    color: palette.icon.fill.default,
    cursor: 'pointer',
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
