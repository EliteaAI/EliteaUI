import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import FullscreenOutlinedIcon from '@mui/icons-material/FullscreenOutlined';
import { Box, FormControlLabel, Tooltip, Typography } from '@mui/material';

import { CodeMirrorLinterHelpers } from '@/[fsd]/shared/lib/helpers';
import { Button, Checkbox, Field, Input } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { CHECKBOX_MODES } from '@/[fsd]/shared/ui/checkbox/BaseCheckbox';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import InfoTooltip from '@/[fsd]/shared/ui/tooltip/InfoTooltip';
import InfoIcon from '@/components/Icons/InfoIcon';
import StyledInputModal from '@/components/StyledInputModal';

import {
  EVAL_ENGINE,
  EVIDENCE_SCOPE_OPTIONS,
  IMPORTANCE,
  IMPORTANCE_OPTIONS,
  POLARITY_OPTIONS,
  SCALE_TYPE_PRESET,
  SCALE_TYPE_PRESET_OPTIONS,
  SUCCESS_CRITERIA_OPTIONS,
} from '../../../lib/constants';
import {
  buildDimensionApiBody,
  getDefaultDimensionFormState,
  getDimensionFormValidationError,
  mapDimensionToFormState,
} from '../../../lib/helpers';

export {
  buildDimensionApiBody,
  getDimensionFormValidationError as getValidationError,
  getDefaultDimensionFormState as getDefaultFormState,
  mapDimensionToFormState as mapDimensionToForm,
};

const EVALUATOR_OPTIONS = [
  { value: EVAL_ENGINE.ai, label: 'AI' },
  { value: EVAL_ENGINE.human, label: 'Human' },
  { value: EVAL_ENGINE.code, label: 'Code' },
];

const TOOLTIPS = {
  availableAcrossProject:
    'Allow this dimension to be used by all agents and agent versions in the current project.',
  evaluator:
    "Determines how this dimension is evaluated. AI uses the suit's judge model, Human requires manual review, and Code uses Python validation logic.",
  evaluationInstructions:
    'Instructions used by the judge model to assess this dimension. Describe the expected qualities, behaviors, constraints, or examples the model should consider.',
  evaluationGuidance:
    'Guidance for human reviewers to help them assess responses consistently. Include evaluation criteria, examples, or decision rules.',
  validationCode:
    'Python logic used to evaluate the selected target. The code must return a result compatible with the configured scale.',
  evaluationTarget:
    'Select the parts of the evaluation case or agent configuration that this dimension should assess.',
  scaleType: 'Defines the format used to score this dimension.',
  polarity: 'Defines whether higher or lower values represent better evaluation results.',
  targetValue:
    'The score or rating that must satisfy the selected success criterion for this dimension to pass.',
  importance: 'Indicates how significant this dimension is when interpreting the overall evaluation result.',
  customMin: 'The minimum value for the custom scale.',
  customMax: 'The maximum value for the custom scale.',
  customImportance: 'Custom importance weight value.',
};

const CODE_SAFETY_NOTICE =
  'The code is checked by a safety pre-screen before it is stored. Dangerous imports, builtins, and dunder access are rejected.';

const DimensionForm = memo(props => {
  const { form, setForm, errorMessage, isEditMode = false } = props;

  const [codeExtensions, setCodeExtensions] = useState([]);
  const [isCodeExpanded, setIsCodeExpanded] = useState(false);

  const isAI = form.evaluator === EVAL_ENGINE.ai;
  const isHuman = form.evaluator === EVAL_ENGINE.human;
  const isCode = form.evaluator === EVAL_ENGINE.code;
  const isPassFail = form.scaleTypePreset === SCALE_TYPE_PRESET.passFail;
  const isCustomScale = form.scaleTypePreset === SCALE_TYPE_PRESET.custom;
  const isCustomImportance = form.importance === IMPORTANCE.custom;

  useEffect(() => {
    let active = true;
    CodeMirrorLinterHelpers.getExtensionsByLang('python').then(({ extensionWithLinter }) => {
      if (active) setCodeExtensions(extensionWithLinter);
    });
    return () => {
      active = false;
    };
  }, []);

  const setField = useCallback(
    (key, value) => {
      setForm(prev => ({ ...prev, [key]: value }));
    },
    [setForm],
  );

  const handleOpenCodeExpanded = useCallback(() => {
    setIsCodeExpanded(true);
  }, []);

  const handleCloseCodeExpanded = useCallback(() => {
    setIsCodeExpanded(false);
  }, []);

  const handleCodeExpandedChange = useCallback(
    ({ target }) => {
      setField('validationCode', target.value);
    },
    [setField],
  );

  const handleNameChange = useCallback(
    event => {
      setField('name', event.target.value);
    },
    [setField],
  );

  const handleSharedChange = useCallback(
    event => {
      setField('isShared', event.target.checked);
    },
    [setField],
  );

  const handleEvaluatorChange = useCallback(
    newEvaluator => {
      setForm(prev => {
        const next = { ...prev, evaluator: newEvaluator };
        if (newEvaluator === EVAL_ENGINE.code) {
          next.scaleTypePreset = SCALE_TYPE_PRESET.passFail;
        }
        return next;
      });
    },
    [setForm],
  );

  const handleInstructionsChange = useCallback(
    event => {
      setField('evaluationInstructions', event.target.value);
    },
    [setField],
  );

  const handleGuidanceChange = useCallback(
    event => {
      setField('evaluationGuidance', event.target.value);
    },
    [setField],
  );

  const handleValidationCodeChange = useCallback(
    value => {
      setField('validationCode', value);
    },
    [setField],
  );

  const handlePolarityChange = useCallback(
    value => {
      setField('polarity', value);
    },
    [setField],
  );

  const handleSuccessCriteriaChange = useCallback(
    value => {
      setField('successCriteria', value);
    },
    [setField],
  );

  const handleTargetValueChange = useCallback(
    event => {
      setField('targetValue', event.target.value);
    },
    [setField],
  );

  const handleImportanceChange = useCallback(
    value => {
      setField('importance', value);
    },
    [setField],
  );

  const handleCustomMinChange = useCallback(
    event => {
      setField('customMin', event.target.value);
    },
    [setField],
  );

  const handleCustomMaxChange = useCallback(
    event => {
      setField('customMax', event.target.value);
    },
    [setField],
  );

  const handleCustomImportanceChange = useCallback(
    event => {
      setField('customImportanceValue', event.target.value);
    },
    [setField],
  );

  const toggleEvaluationTarget = useCallback(
    key => {
      setForm(prev => ({
        ...prev,
        evaluationTarget: { ...prev.evaluationTarget, [key]: !prev.evaluationTarget[key] },
      }));
    },
    [setForm],
  );

  const handleScaleTypeChange = useCallback(
    value => {
      setForm(prev => ({
        ...prev,
        scaleTypePreset: value,
        customMin: value === SCALE_TYPE_PRESET.custom ? '' : prev.customMin,
        customMax: value === SCALE_TYPE_PRESET.custom ? '' : prev.customMax,
      }));
    },
    [setForm],
  );

  const scaleTypeOptions = useMemo(() => {
    if (isCode) {
      return SCALE_TYPE_PRESET_OPTIONS.filter(
        opt => opt.value === SCALE_TYPE_PRESET.passFail || opt.value === SCALE_TYPE_PRESET.score,
      );
    }
    return SCALE_TYPE_PRESET_OPTIONS;
  }, [isCode]);

  const styles = dimensionFormStyles();

  return (
    <>
      <Box sx={styles.content}>
        <Input.InputBase
          data-testid="dimension-name-input"
          fullWidth
          variant="standard"
          label="Name"
          value={form.name}
          onChange={handleNameChange}
          inputProps={{ maxLength: 128 }}
          required
        />

        <FormControlLabel
          control={
            <Checkbox.BaseCheckbox
              checked={form.isShared}
              onChange={handleSharedChange}
              data-testid="dimension-shared-checkbox"
            />
          }
          label={
            <Box sx={styles.checkboxLabelWrapper}>
              <Typography variant="bodyMedium">Available across the project</Typography>
              <InfoTooltip infoTooltip={TOOLTIPS.availableAcrossProject} />
            </Box>
          }
          sx={styles.checkboxFormControl}
        />

        <Box sx={styles.verticalSection}>
          <Box sx={styles.sectionLabelRow}>
            <Typography sx={styles.sectionLabel}>Evaluator</Typography>
            <InfoTooltip infoTooltip={TOOLTIPS.evaluator} />
          </Box>
          {isEditMode ? (
            <Box sx={styles.evaluatorTagWrapper}>
              <Typography
                component="span"
                sx={styles.evaluatorTag}
              >
                {EVALUATOR_OPTIONS.find(opt => opt.value === form.evaluator)?.label || form.evaluator}
              </Typography>
            </Box>
          ) : (
            <Box sx={styles.radioGroup}>
              {EVALUATOR_OPTIONS.map(option => (
                <FormControlLabel
                  key={option.value}
                  sx={styles.radioFormControl}
                  control={
                    <Checkbox.BaseCheckbox
                      mode={CHECKBOX_MODES.radio}
                      checked={form.evaluator === option.value}
                      onChange={() => handleEvaluatorChange(option.value)}
                      data-testid={`dimension-evaluator-${option.value}`}
                    />
                  }
                  label={<Typography sx={styles.checkboxLabel}>{option.label}</Typography>}
                />
              ))}
            </Box>
          )}
        </Box>

        {isAI && (
          <Box sx={styles.textareaSection}>
            <Box sx={styles.textareaLabelRow}>
              <Typography sx={styles.sectionLabel}>Evaluation Instructions</Typography>
              <Typography
                component="span"
                sx={styles.required}
              >
                *
              </Typography>
              <InfoTooltip infoTooltip={TOOLTIPS.evaluationInstructions} />
            </Box>
            <Input.InputBase
              data-testid="dimension-instructions-input"
              fullWidth
              multiline
              minRows={5}
              variant="outlined"
              placeholder="Describe what should lead to higher or lower scores. Include specific qualities, behaviors, or examples that AI should consider when evaluating responses."
              value={form.evaluationInstructions}
              onChange={handleInstructionsChange}
              showFullScreenAction={false}
              showCopyAction={false}
              showExpandAction={false}
              sx={styles.textareaField}
            />
          </Box>
        )}

        {isHuman && (
          <Box sx={styles.textareaSection}>
            <Box sx={styles.textareaLabelRow}>
              <Typography sx={styles.sectionLabel}>Evaluation Guidance (optional)</Typography>
              <InfoTooltip infoTooltip={TOOLTIPS.evaluationGuidance} />
            </Box>
            <Input.InputBase
              data-testid="dimension-guidance-input"
              fullWidth
              multiline
              minRows={5}
              variant="outlined"
              placeholder="Provide guidance to help reviewers evaluate responses consistently."
              value={form.evaluationGuidance}
              onChange={handleGuidanceChange}
              showFullScreenAction={false}
              showCopyAction={false}
              showExpandAction={false}
              sx={styles.textareaField}
            />
          </Box>
        )}

        {isCode && (
          <Box sx={styles.textareaSection}>
            <Box sx={styles.codeLabelRow}>
              <Typography sx={styles.sectionLabel}>Validation Code (Python)</Typography>
              <Typography
                component="span"
                sx={styles.required}
              >
                *
              </Typography>
              <InfoTooltip infoTooltip={TOOLTIPS.validationCode} />
              <Box sx={styles.expandButton}>
                <Tooltip
                  title="Full screen view"
                  placement="top"
                >
                  <Button.BaseBtn
                    variant={BUTTON_VARIANTS.tertiary}
                    onClick={handleOpenCodeExpanded}
                    sx={styles.iconButton}
                  >
                    <FullscreenOutlinedIcon sx={styles.expandIcon} />
                  </Button.BaseBtn>
                </Tooltip>
              </Box>
            </Box>
            <Box sx={styles.editorWrapper}>
              <Field.CodeMirrorEditor
                value={form.validationCode}
                extensions={codeExtensions}
                notifyChange={handleValidationCodeChange}
                height="10rem"
                maxHeight="10rem"
                contentTestId="dimension-code-input"
              />
            </Box>
            <Box sx={styles.safetyNotice}>
              <InfoIcon sx={styles.safetyNoticeIcon} />
              <Typography
                variant="bodySmall"
                sx={styles.safetyNoticeText}
              >
                {CODE_SAFETY_NOTICE}
              </Typography>
            </Box>
          </Box>
        )}

        <Box sx={styles.verticalSection}>
          <Box sx={styles.sectionLabelRow}>
            <Typography sx={styles.sectionLabel}>Evaluation Target</Typography>
            <InfoTooltip infoTooltip={TOOLTIPS.evaluationTarget} />
          </Box>
          <Box sx={styles.radioGroup}>
            {EVIDENCE_SCOPE_OPTIONS.map(option => (
              <FormControlLabel
                key={option.key}
                sx={styles.radioFormControl}
                control={
                  <Checkbox.BaseCheckbox
                    checked={!!form.evaluationTarget[option.key]}
                    onChange={() => toggleEvaluationTarget(option.key)}
                    data-testid={`dimension-target-${option.key}`}
                  />
                }
                label={<Typography sx={styles.checkboxLabel}>{option.label}</Typography>}
              />
            ))}
          </Box>
        </Box>

        <Box sx={styles.verticalField}>
          <Box sx={styles.fieldLabelRow}>
            <Typography sx={styles.fieldLabel}>Scale Type</Typography>
            <InfoTooltip infoTooltip={TOOLTIPS.scaleType} />
          </Box>
          <SingleSelect
            showBorder
            value={form.scaleTypePreset}
            options={scaleTypeOptions}
            onValueChange={handleScaleTypeChange}
            data-testid="dimension-scale-type-select"
          />
        </Box>

        {isCustomScale && (
          <Box sx={styles.twoColumnRow}>
            <Box sx={styles.verticalField}>
              <Box sx={styles.fieldLabelRowFixedFirst}>
                <Typography sx={styles.fieldLabel}>Min</Typography>
                <Typography
                  component="span"
                  sx={styles.required}
                >
                  *
                </Typography>
                <InfoTooltip infoTooltip={TOOLTIPS.customMin} />
              </Box>
              <Box sx={styles.twoColumnInput}>
                <Input.InputBase
                  data-testid="dimension-custom-min-input"
                  fullWidth
                  type="number"
                  variant="standard"
                  value={form.customMin}
                  onChange={handleCustomMinChange}
                />
              </Box>
            </Box>
            <Box sx={styles.verticalField}>
              <Box sx={styles.fieldLabelRowFixed}>
                <Typography sx={styles.fieldLabel}>Max</Typography>
                <Typography
                  component="span"
                  sx={styles.required}
                >
                  *
                </Typography>
                <InfoTooltip infoTooltip={TOOLTIPS.customMax} />
              </Box>
              <Box sx={styles.twoColumnInput}>
                <Input.InputBase
                  data-testid="dimension-custom-max-input"
                  fullWidth
                  type="number"
                  variant="standard"
                  value={form.customMax}
                  onChange={handleCustomMaxChange}
                />
              </Box>
            </Box>
          </Box>
        )}

        {!isPassFail && (
          <>
            <Box sx={styles.verticalField}>
              <Box sx={styles.fieldLabelRow}>
                <Typography sx={styles.fieldLabel}>Polarity</Typography>
                <InfoTooltip infoTooltip={TOOLTIPS.polarity} />
              </Box>
              <SingleSelect
                showBorder
                value={form.polarity}
                options={POLARITY_OPTIONS}
                onValueChange={handlePolarityChange}
                data-testid="dimension-polarity-select"
              />
            </Box>

            <Box sx={styles.twoColumnRow}>
              <Box sx={styles.verticalField}>
                <Box sx={styles.fieldLabelRowFixedFirst}>
                  <Typography sx={styles.fieldLabel}>Success Criteria</Typography>
                  <InfoTooltip infoTooltip={TOOLTIPS.targetValue} />
                </Box>
                <Box sx={styles.twoColumnSelect}>
                  <SingleSelect
                    showBorder
                    value={form.successCriteria}
                    options={SUCCESS_CRITERIA_OPTIONS}
                    onValueChange={handleSuccessCriteriaChange}
                    data-testid="dimension-success-criteria-select"
                  />
                </Box>
              </Box>
              <Box sx={styles.verticalField}>
                <Box sx={styles.fieldLabelRowFixed}>
                  <Typography sx={styles.fieldLabel}>Target Value</Typography>
                  <Typography
                    component="span"
                    sx={styles.required}
                  >
                    *
                  </Typography>
                  <InfoTooltip infoTooltip={TOOLTIPS.targetValue} />
                </Box>
                <Box sx={styles.twoColumnInput}>
                  <Input.InputBase
                    data-testid="dimension-target-value-input"
                    fullWidth
                    type="number"
                    variant="standard"
                    value={form.targetValue}
                    onChange={handleTargetValueChange}
                  />
                </Box>
              </Box>
            </Box>
          </>
        )}

        <Box sx={styles.verticalField}>
          <Box sx={styles.fieldLabelRow}>
            <Typography sx={styles.fieldLabel}>Importance</Typography>
            <InfoTooltip infoTooltip={TOOLTIPS.importance} />
          </Box>
          <SingleSelect
            showBorder
            value={form.importance}
            options={IMPORTANCE_OPTIONS}
            onValueChange={handleImportanceChange}
            data-testid="dimension-importance-select"
          />
        </Box>

        {isCustomImportance && (
          <Box sx={styles.verticalField}>
            <Box sx={styles.fieldLabelRow}>
              <Typography sx={styles.fieldLabel}>Importance Value</Typography>
              <InfoTooltip infoTooltip={TOOLTIPS.customImportance} />
            </Box>
            <Input.InputBase
              data-testid="dimension-custom-importance-input"
              fullWidth
              type="number"
              variant="standard"
              value={form.customImportanceValue}
              onChange={handleCustomImportanceChange}
            />
          </Box>
        )}

        {errorMessage && (
          <Typography
            data-testid="dimension-create-error"
            variant="bodySmall"
            sx={styles.error}
          >
            {errorMessage}
          </Typography>
        )}
      </Box>
      {isCodeExpanded && (
        <StyledInputModal
          open={isCodeExpanded}
          title="Validation Code (Python)"
          value={form.validationCode}
          hasOnChangeCallback
          onChange={handleCodeExpandedChange}
          onClose={handleCloseCodeExpanded}
          specifiedLanguage="python"
        />
      )}
    </>
  );
});

DimensionForm.displayName = 'DimensionForm';

/** @type {MuiSx} */
const dimensionFormStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  textareaSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginLeft: '0.75rem',
  },
  textareaLabelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  codeLabelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  expandButton: {
    marginLeft: 'auto',
  },
  iconButton: ({ palette }) => ({
    padding: '0.25rem',
    '&:hover': {
      backgroundColor: palette.action.hover,
    },
  }),
  expandIcon: {
    width: '1rem',
    height: '1rem',
  },
  textareaField: {
    '& .MuiOutlinedInput-input.MuiInputBase-inputMultiline': {
      maxHeight: '7.5rem',
      overflowY: 'auto',
    },
  },
  sectionLabel: ({ palette }) => ({
    color: palette.text.primary,
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: '1.5rem',
  }),
  fieldLabel: ({ palette }) => ({
    color: palette.text.primary,
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
  }),
  required: ({ palette }) => ({
    color: palette.text.primary,
    marginLeft: '0.125rem',
  }),
  checkboxFormControl: {
    marginLeft: '0.25rem',
    marginRight: 0,
  },
  checkboxLabelWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  radioGroup: {
    display: 'flex',
    gap: '1.5rem',
    marginLeft: '0.25rem',
  },
  evaluatorTagWrapper: {
    display: 'flex',
    marginLeft: '0.75rem',
    gap: '0.625rem',
  },
  evaluatorTag: ({ palette }) => ({
    padding: '0.25rem 0.5rem',
    borderRadius: '1.0625rem',
    backgroundColor: palette.background.tabButton.default,
    border: `0.0625rem solid ${palette.border.lines}`,
    color: palette.text.secondary,
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: '1rem',
  }),
  radioFormControl: {
    marginLeft: 0,
    marginRight: 0,
  },
  checkboxLabel: ({ palette }) => ({
    color: palette.text.secondary,
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: '1.5rem',
  }),
  editorWrapper: ({ palette }) => ({
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.25rem',
    overflow: 'hidden',
    height: '10rem',
    '& .cm-editor': {
      height: '100%',
      backgroundColor: 'transparent',
    },
    '& .cm-scroller': {
      overflow: 'auto',
    },
    '& .cm-gutters': {
      backgroundColor: 'transparent',
    },
  }),
  safetyNotice: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 0.75rem',
    backgroundColor: palette.background.indexResult.info,
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.indexResult.info}`,
  }),
  safetyNoticeIcon: ({ palette }) => ({
    width: '0.875rem',
    height: '0.875rem',
    color: palette.icon.fill.info,
    flexShrink: 0,
    path: {
      fill: palette.icon.fill.info,
    },
  }),
  safetyNoticeText: ({ palette }) => ({
    color: palette.text.indexResult.info,
    fontSize: '0.75rem',
    lineHeight: '1.25rem',
    fontWeight: 400,
  }),
  verticalSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  sectionLabelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    marginLeft: '0.75rem',
  },
  verticalField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
  },
  fieldLabelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    marginLeft: '0.75rem',
  },
  twoColumnRow: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
    '& .MuiFormControl-root': {
      marginTop: 0,
      marginBottom: 0,
    },
    '& > .MuiBox-root': {
      gap: '0.25rem',
    },
  },
  fieldLabelRowFixed: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    height: '1rem',
  },
  fieldLabelRowFixedFirst: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    height: '1rem',
    marginLeft: '0.75rem',
  },
  twoColumnInput: {
    '& .MuiInputBase-root': {
      height: '2.25rem',
    },
    '& .MuiFormControl-root': {
      marginTop: 0,
      paddingTop: 0,
    },
    '& .MuiTextField-root': {
      marginTop: 0,
      paddingTop: 0,
    },
  },
  twoColumnSelect: {
    '& .MuiFormControl-root': {
      marginTop: 0,
      marginBottom: 0,
    },
    '& .MuiInputBase-root': {
      height: '2.25rem',
    },
  },
  error: ({ palette }) => ({
    color: palette.error.main,
    whiteSpace: 'pre-wrap',
  }),
});

export default DimensionForm;
