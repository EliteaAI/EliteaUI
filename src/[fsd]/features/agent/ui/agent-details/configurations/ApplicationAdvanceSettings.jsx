import { memo, useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { Box } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { Checkbox, Input, Label } from '@/[fsd]/shared/ui';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { MAX_STEP_LIMIT, MIN_STEP_LIMIT } from '@/common/constants';

const ApplicationAdvanceSettings = memo(props => {
  const { style, disabled, showIgnoreProjectContext = false } = props;

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

  const handleIgnoreToggle = useCallback(
    e => {
      setFieldValue('version_details.meta.ignore_project_context', e.target.checked);
    },
    [setFieldValue],
  );

  const styles = useMemo(() => applicationAdvanceSettingsStyles(), []);

  const accordionItems = useMemo(
    () => [
      {
        title: 'Advanced',
        content: (
          <Box sx={styles.fieldContainer}>
            <Input.StyledInputEnhancer
              value={version_details?.meta?.step_limit ?? ''}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              label={
                <Label.InfoLabelWithTooltip
                  label="Step limit"
                  tooltip="The maximum number of steps to take before ending the execution loop (tools call limit)."
                  variant="labelLarge"
                />
              }
              type="text"
              inputProps={{
                inputMode: 'numeric',
                pattern: '[0-9]*',
                min: MIN_STEP_LIMIT,
                max: MAX_STEP_LIMIT,
              }}
            />
            {showIgnoreProjectContext && (
              <Box sx={styles.toggleRow}>
                <Checkbox.BaseCheckbox
                  checked={version_details?.meta?.ignore_project_context ?? false}
                  onChange={handleIgnoreToggle}
                  disabled={disabled}
                />
                <Label.InfoLabelWithTooltip
                  label="Ignore Project Context"
                  tooltip="When enabled, this agent will not use the project background context in its responses."
                  variant="bodyMedium"
                  labelSx={styles.label}
                />
              </Box>
            )}
          </Box>
        ),
      },
    ],
    [
      version_details?.meta?.step_limit,
      version_details?.meta?.ignore_project_context,
      handleChange,
      handleKeyDown,
      handleIgnoreToggle,
      disabled,
      styles,
      showIgnoreProjectContext,
    ],
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
const applicationAdvanceSettingsStyles = () => ({
  accordion: ({ palette }) => ({
    background: `${palette.background.tabPanel} !important`,
  }),
  fieldContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
  label: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
  },
});

export default ApplicationAdvanceSettings;
