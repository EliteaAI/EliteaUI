import { memo, useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { Box } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { Label } from '@/[fsd]/shared/ui';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { MAX_STEP_LIMIT, MIN_STEP_LIMIT } from '@/common/constants';

import FormInput from './FormInput';

const ApplicationAdvanceSettings = memo(props => {
  const { style, disabled } = props;

  const { values: { version_details } = {}, setFieldValue } = useFormikContext();

  const inputValidator = useMemo(
    () => ({
      isValidStepLimit: value => {
        if (value === '') return '';
        const numericValue = parseInt(value, 10);
        if (isNaN(numericValue)) return '';
        if (numericValue > MAX_STEP_LIMIT) return MAX_STEP_LIMIT;
        if (numericValue < MIN_STEP_LIMIT) return MIN_STEP_LIMIT;
        return numericValue;
      },

      isValidKeyInput: (key, currentValue, allowedModifiers = false) => {
        const navigationKeys = [
          'Backspace',
          'Delete',
          'Tab',
          'Escape',
          'Enter',
          'ArrowLeft',
          'ArrowRight',
          'ArrowUp',
          'ArrowDown',
          'Home',
          'End',
        ];

        if (allowedModifiers) return true;

        if (navigationKeys.includes(key)) return true;

        if (/[0-9]/.test(key)) {
          const nextValue = `${currentValue}${key}`;
          return parseInt(nextValue, 10) <= MAX_STEP_LIMIT;
        }
        return false;
      },
    }),
    [],
  );

  const handleChange = useCallback(
    e => {
      const inputValue = e.target.value;
      const value = inputValidator.isValidStepLimit(inputValue);
      setFieldValue('version_details.meta.step_limit', value);
    },
    [inputValidator, setFieldValue],
  );

  const handleKeyDown = useCallback(
    e => {
      if (!inputValidator.isValidKeyInput(e.key, e.target.value, e.ctrlKey || e.metaKey)) {
        e.preventDefault();
      }
    },
    [inputValidator],
  );

  const styles = useMemo(() => agentAdvanceSettingsStyles(), []);

  const accordionItems = useMemo(
    () => [
      {
        title: 'Advanced',
        content: (
          <Box sx={styles.fieldContainer}>
            <Label.InfoLabelWithTooltip
              label="Step limit"
              tooltip="The maximum number of steps to take before ending the execution loop (tools call limit)."
              variant="subtitle"
              sx={styles.fieldLabel}
            />
            <FormInput
              value={version_details?.meta?.step_limit ?? ''}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              type="text"
              inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]*',
                min: MIN_STEP_LIMIT,
                max: MAX_STEP_LIMIT,
              }}
            />
          </Box>
        ),
      },
    ],
    [version_details?.meta?.step_limit, handleChange, handleKeyDown, disabled, styles],
  );

  return (
    <BasicAccordion
      style={style}
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      accordionSX={styles.accordion}
      items={accordionItems}
    />
  );
});

ApplicationAdvanceSettings.displayName = 'ApplicationAdvanceSettings';

/** @type {MuiSx} */
const agentAdvanceSettingsStyles = () => ({
  accordion: ({ palette }) => ({
    background: `${palette.background.tabPanel} !important`,
  }),
  fieldContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  fieldLabel: ({ palette }) => ({
    color: palette.text.primary,
    fontSize: '0.75rem',
    lineHeight: '0.9375rem',
    textTransform: 'uppercase',
    paddingLeft: '0.5rem',
  }),
});

export default ApplicationAdvanceSettings;
