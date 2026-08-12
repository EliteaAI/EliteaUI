import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, TextField, Typography } from '@mui/material';

import BaseBtn, { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import BaseCheckbox, { CHECKBOX_MODES } from '@/[fsd]/shared/ui/checkbox/BaseCheckbox';
import ArrowLeftIcon from '@/assets/arrow-left-icon.svg?react';
import ArrowRightIcon from '@/assets/arrow-right-icon.svg?react';

const MAX_CUSTOM_LENGTH = 2000;

/**
 * Clarifying-question control rendered on a HITL card (guardrail_type ===
 * 'clarifying_question'). Shows one question at a time with a top-right stepper,
 * hoverable option rows (radio for single-select, checkbox for multi-select),
 * an always-visible custom "Your option" input, and a Skip/Continue action.
 * Submits an answers object keyed by question id through onSubmit.
 */
const ClarifyingQuestionControl = memo(props => {
  const { questions, onSubmit, disabled } = props;
  const styles = clarifyingQuestionControlStyles();

  const specs = useMemo(() => (Array.isArray(questions) ? questions : []), [questions]);

  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState({});
  const [customText, setCustomText] = useState({});

  useEffect(() => {
    if (disabled) {
      setStep(0);
      setSelections({});
      setCustomText({});
    }
  }, [disabled]);

  const total = specs.length;
  const currentSpec = specs[step];
  const isLastStep = step >= total - 1;

  const buildAnswer = useCallback(
    qid => {
      const spec = specs.find(q => q.id === qid) || {};
      const selection = selections[qid];
      const typed = (customText[qid] || '').trim();
      if (spec.multiSelect) {
        const chosen = Array.isArray(selection) ? selection : [];
        return typed ? [...chosen, typed] : chosen;
      }
      return typed || selection || '';
    },
    [customText, selections, specs],
  );

  const isAnswered = useCallback(
    spec => {
      if (!spec) return false;
      const answer = buildAnswer(spec.id);
      return Array.isArray(answer) ? answer.length > 0 : Boolean(String(answer).trim());
    },
    [buildAnswer],
  );

  const goPrev = useCallback(() => setStep(prev => Math.max(0, prev - 1)), []);
  const goNext = useCallback(() => setStep(prev => Math.min(total - 1, prev + 1)), [total]);

  const submitAll = useCallback(() => {
    const value = {};
    specs.forEach(spec => {
      value[spec.id] = buildAnswer(spec.id);
    });
    onSubmit?.(value);
  }, [buildAnswer, onSubmit, specs]);

  const handleContinue = useCallback(() => {
    if (isLastStep) submitAll();
    else goNext();
  }, [goNext, isLastStep, submitAll]);

  const handleSelectSingle = useCallback(
    (qid, label) => {
      setSelections(prev => ({ ...prev, [qid]: label }));
      setCustomText(prev => ({ ...prev, [qid]: '' }));
      if (!isLastStep) goNext();
    },
    [goNext, isLastStep],
  );

  const handleToggleMulti = useCallback((qid, label) => {
    setSelections(prev => {
      const current = Array.isArray(prev[qid]) ? prev[qid] : [];
      const next = current.includes(label) ? current.filter(v => v !== label) : [...current, label];
      return { ...prev, [qid]: next };
    });
  }, []);

  const handleCustomChange = useCallback((qid, value, multiSelect) => {
    const text = value.slice(0, MAX_CUSTOM_LENGTH);
    setCustomText(prev => ({ ...prev, [qid]: text }));
    if (!multiSelect && text) {
      setSelections(prev => ({ ...prev, [qid]: '' }));
    }
  }, []);

  if (total === 0) return null;

  const options = Array.isArray(currentSpec?.options) ? currentSpec.options : [];
  const qid = currentSpec.id;
  const multiSelect = Boolean(currentSpec.multiSelect);
  const answered = isAnswered(currentSpec);
  const selection = selections[qid];

  const handleRowClick = option => {
    if (disabled) return;
    if (multiSelect) handleToggleMulti(qid, option.label);
    else handleSelectSingle(qid, option.label);
  };

  return (
    <Box sx={styles.container}>
      <Box sx={styles.header}>
        {currentSpec.header && (
          <Typography
            variant="labelSmall"
            sx={styles.eyebrow}
          >
            {currentSpec.header}
          </Typography>
        )}
        <Box sx={styles.headerRow}>
          <Typography
            variant="headingSmall"
            sx={styles.question}
          >
            {`${step + 1}. ${currentSpec.question || ''}`}
          </Typography>
          {total > 1 && (
            <Box sx={styles.stepper}>
              <BaseBtn
                variant={BUTTON_VARIANTS.tertiary}
                onClick={goPrev}
                disabled={disabled || step === 0}
                startIcon={<ArrowLeftIcon />}
                aria-label="Previous question"
              />
              <Typography
                variant="labelSmall"
                sx={styles.stepperLabel}
              >
                {`${step + 1}/${total}`}
              </Typography>
              <BaseBtn
                variant={BUTTON_VARIANTS.tertiary}
                onClick={goNext}
                disabled={disabled || isLastStep}
                startIcon={<ArrowRightIcon />}
                aria-label="Next question"
              />
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={styles.optionList}>
        {options.map(option => {
          const checked = multiSelect
            ? Array.isArray(selection) && selection.includes(option.label)
            : selection === option.label;
          return (
            <Box
              key={option.label}
              sx={styles.optionRow}
              onClick={() => handleRowClick(option)}
            >
              <BaseCheckbox
                mode={multiSelect ? CHECKBOX_MODES.checkbox : CHECKBOX_MODES.radio}
                size="small"
                checked={checked}
                onChange={() => {}}
                disabled={disabled}
                sx={styles.control}
              />
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
            </Box>
          );
        })}
      </Box>

      <Box sx={styles.inputRow}>
        <TextField
          fullWidth
          size="small"
          value={customText[qid] || ''}
          onChange={event => handleCustomChange(qid, event.target.value, multiSelect)}
          disabled={disabled}
          placeholder="Your option"
          slotProps={{ htmlInput: { maxLength: MAX_CUSTOM_LENGTH } }}
          sx={styles.customInput}
        />
        <BaseBtn
          variant={answered ? BUTTON_VARIANTS.contained : BUTTON_VARIANTS.secondary}
          onClick={handleContinue}
          disabled={disabled}
          sx={styles.actionBtn}
        >
          {answered ? 'Continue' : 'Skip'}
        </BaseBtn>
      </Box>
    </Box>
  );
});

ClarifyingQuestionControl.displayName = 'ClarifyingQuestionControl';

/** @type {MuiSx} */
const clarifyingQuestionControlStyles = () => ({
  container: ({ palette }) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1rem 1.25rem 1.25rem',
    borderRadius: '0.75rem',
    background: palette.background.secondary,
    border: `0.0625rem solid ${palette.border.cardsOutlines}`,
  }),
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
  },
  eyebrow: ({ palette }) => ({
    fontSize: '0.6875rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    color: palette.text.secondary,
  }),
  question: ({ palette }) => ({
    flex: 1,
    minWidth: 0,
    fontWeight: 600,
    color: palette.text.primary,
  }),
  stepper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    flexShrink: 0,
  },
  stepperLabel: ({ palette }) => ({
    minWidth: '2rem',
    textAlign: 'center',
    fontSize: '0.75rem',
    fontWeight: 500,
    color: palette.text.secondary,
  }),
  optionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  optionRow: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    minHeight: '2.5rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    '&:hover': {
      backgroundColor: palette.background.tabButton.hover,
    },
  }),
  control: {
    padding: 0,
    pointerEvents: 'none',
  },
  optionLabel: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
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
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '0.25rem',
  },
  customInput: ({ palette }) => ({
    flex: 1,
    minWidth: 0,
    '& .MuiInputBase-root': {
      padding: '0.625rem 0.875rem',
      borderRadius: '0.5rem',
      backgroundColor: palette.background.default,
      border: `0.0625rem solid ${palette.border?.lines || palette.divider}`,
      fontSize: '0.8125rem',
      color: palette.text.primary,
      transition: 'border-color 0.15s ease',
    },
    '& .MuiInputBase-root:hover': {
      borderColor: palette.text.secondary,
    },
    '& .MuiInputBase-root.Mui-focused': {
      borderColor: palette.primary.main,
    },
    '& .MuiOutlinedInput-notchedOutline': {
      border: 'none',
    },
  }),
  actionBtn: {
    flexShrink: 0,
  },
});

export default ClarifyingQuestionControl;
