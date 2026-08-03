import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, Checkbox, FormControlLabel, Radio, RadioGroup, TextField, Typography } from '@mui/material';

import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import CheckedIcon from '@/assets/checked-icon.svg?react';

const MAX_OTHER_LENGTH = 2000;
const OTHER_VALUE = '__other__';

/**
 * Clarifying-question control rendered on a HITL card (guardrail_type ===
 * 'clarifying_question'). Renders one group per question — radio (single) or
 * checkbox (multi) options, plus an optional free-text "Other" field — and
 * submits an answers object keyed by question id through the shared
 * onHitlResume({ action: 'answer', value }) path.
 */
const ClarifyingQuestionControl = memo(props => {
  const { questions, onSubmit, disabled } = props;
  const styles = getStyles();

  const specs = useMemo(() => (Array.isArray(questions) ? questions : []), [questions]);

  // selections: { [questionId]: string | string[] }  |  other: { [questionId]: string }
  const [selections, setSelections] = useState({});
  const [otherText, setOtherText] = useState({});
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (disabled) {
      setSelections({});
      setOtherText({});
      setStep(0);
    }
  }, [disabled]);

  const handleRadioChange = useCallback((qid, value) => {
    setSelections(prev => ({ ...prev, [qid]: value }));
  }, []);

  const handleCheckboxChange = useCallback((qid, label, checked) => {
    setSelections(prev => {
      const current = Array.isArray(prev[qid]) ? prev[qid] : [];
      const next = checked ? [...current, label] : current.filter(item => item !== label);
      return { ...prev, [qid]: next };
    });
  }, []);

  const handleOtherChange = useCallback((qid, value) => {
    setOtherText(prev => ({ ...prev, [qid]: value.slice(0, MAX_OTHER_LENGTH) }));
  }, []);

  const buildAnswer = useCallback(
    qid => {
      const spec = specs.find(q => q.id === qid) || {};
      const selection = selections[qid];
      const typed = (otherText[qid] || '').trim();
      if (spec.multiSelect) {
        const chosen = (Array.isArray(selection) ? selection : []).filter(v => v !== OTHER_VALUE);
        return typed ? [...chosen, typed] : chosen;
      }
      if (selection === OTHER_VALUE) return typed;
      return selection ?? (typed || '');
    },
    [otherText, selections, specs],
  );

  const isQuestionAnswered = useCallback(
    spec => {
      if (!spec) return false;
      const answer = buildAnswer(spec.id);
      return Array.isArray(answer) ? answer.length > 0 : Boolean(String(answer).trim());
    },
    [buildAnswer],
  );

  const currentSpec = specs[step];
  const isLastStep = step >= specs.length - 1;
  const currentAnswered = isQuestionAnswered(currentSpec);

  const handleBack = useCallback(() => {
    setStep(prev => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setStep(prev => Math.min(specs.length - 1, prev + 1));
  }, [specs.length]);

  const handleSubmit = useCallback(() => {
    if (!specs.every(isQuestionAnswered)) return;
    const value = {};
    specs.forEach(spec => {
      value[spec.id] = buildAnswer(spec.id);
    });
    onSubmit?.(value);
  }, [buildAnswer, isQuestionAnswered, onSubmit, specs]);

  if (specs.length === 0) return null;

  const options = Array.isArray(currentSpec?.options) ? currentSpec.options : [];
  const showOther = currentSpec?.allow_other !== false;
  const otherSelected = currentSpec?.multiSelect
    ? Boolean((otherText[currentSpec?.id] || '').length)
    : selections[currentSpec?.id] === OTHER_VALUE;

  return (
    <Box sx={styles.container}>
      {specs.length > 1 && (
        <Typography
          variant="labelSmall"
          sx={styles.stepIndicator}
        >
          Question {step + 1} of {specs.length}
        </Typography>
      )}

      <Box sx={styles.questionBlock}>
        {currentSpec.header && (
          <Typography
            variant="labelSmall"
            sx={styles.header}
          >
            {currentSpec.header}
          </Typography>
        )}
        {currentSpec.question && (
          <Typography
            variant="labelMedium"
            sx={styles.question}
          >
            {currentSpec.question}
          </Typography>
        )}

        {currentSpec.multiSelect ? (
          <Box sx={styles.optionList}>
            {options.map(option => (
              <FormControlLabel
                key={option.label}
                control={
                  <Checkbox
                    size="small"
                    checked={
                      Array.isArray(selections[currentSpec.id]) &&
                      selections[currentSpec.id].includes(option.label)
                    }
                    onChange={event =>
                      handleCheckboxChange(currentSpec.id, option.label, event.target.checked)
                    }
                    disabled={disabled}
                  />
                }
                label={renderOptionLabel(option, styles)}
              />
            ))}
          </Box>
        ) : (
          <RadioGroup
            value={selections[currentSpec.id] ?? ''}
            onChange={event => handleRadioChange(currentSpec.id, event.target.value)}
            sx={styles.optionList}
          >
            {options.map(option => (
              <FormControlLabel
                key={option.label}
                value={option.label}
                control={
                  <Radio
                    size="small"
                    disabled={disabled}
                  />
                }
                label={renderOptionLabel(option, styles)}
              />
            ))}
            {showOther && (
              <FormControlLabel
                value={OTHER_VALUE}
                control={
                  <Radio
                    size="small"
                    disabled={disabled}
                  />
                }
                label="Other"
              />
            )}
          </RadioGroup>
        )}

        {showOther && (currentSpec.multiSelect || otherSelected) && (
          <TextField
            multiline
            minRows={1}
            maxRows={4}
            fullWidth
            size="small"
            value={otherText[currentSpec.id] || ''}
            onChange={event => handleOtherChange(currentSpec.id, event.target.value)}
            disabled={disabled}
            placeholder="Type your own answer"
            slotProps={{ htmlInput: { maxLength: MAX_OTHER_LENGTH } }}
            sx={styles.otherInput}
          />
        )}
      </Box>

      <Box sx={styles.actions}>
        {step > 0 && (
          <BaseBtn
            variant={BUTTON_VARIANTS.secondary}
            onClick={handleBack}
            disabled={disabled}
          >
            Back
          </BaseBtn>
        )}
        {isLastStep ? (
          <BaseBtn
            variant={BUTTON_VARIANTS.positive}
            startIcon={<CheckedIcon />}
            onClick={handleSubmit}
            disabled={disabled || !currentAnswered}
            sx={styles.buttonIcon}
          >
            Submit
          </BaseBtn>
        ) : (
          <BaseBtn
            variant={BUTTON_VARIANTS.positive}
            onClick={handleNext}
            disabled={disabled || !currentAnswered}
          >
            Next
          </BaseBtn>
        )}
      </Box>
    </Box>
  );
});

const renderOptionLabel = (option, styles) => (
  <Box sx={styles.optionLabel}>
    <Typography
      variant="labelMedium"
      sx={styles.optionTitle}
    >
      {option.label}
    </Typography>
    {option.description && (
      <Typography
        variant="labelSmall"
        sx={styles.optionDescription}
      >
        {option.description}
      </Typography>
    )}
  </Box>
);

ClarifyingQuestionControl.displayName = 'ClarifyingQuestionControl';

/** @type {MuiSx} */
const getStyles = () => ({
  container: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.875rem',
  },
  stepIndicator: ({ palette }) => ({
    fontSize: '0.6875rem',
    fontWeight: 600,
    color: palette.text.secondary,
  }),
  questionBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  header: ({ palette }) => ({
    fontSize: '0.6875rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    color: palette.text.secondary,
  }),
  question: ({ palette }) => ({
    fontSize: '0.875rem',
    fontWeight: 600,
    color: palette.text.primary,
  }),
  optionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  },
  optionLabel: {
    display: 'flex',
    flexDirection: 'column',
  },
  optionTitle: ({ palette }) => ({
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: palette.text.primary,
  }),
  optionDescription: ({ palette }) => ({
    fontSize: '0.75rem',
    fontWeight: 400,
    color: palette.text.secondary,
  }),
  otherInput: ({ palette }) => ({
    width: '100%',
    marginTop: '0.25rem',
    '& .MuiInputBase-root': {
      padding: '0.5rem 0.625rem',
      borderRadius: '0.375rem',
      backgroundColor: palette.background.default,
      border: `0.0625rem solid ${palette.border?.lines || palette.divider}`,
      fontSize: '0.8125rem',
      color: palette.text.primary,
    },
    '& .MuiInputBase-root.Mui-focused': {
      borderColor: palette.primary.main,
    },
    '& .MuiOutlinedInput-notchedOutline': {
      border: 'none',
    },
  }),
  actions: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  buttonIcon: {
    '& .MuiButton-startIcon': {
      color: 'white',
    },
  },
});

export default ClarifyingQuestionControl;
