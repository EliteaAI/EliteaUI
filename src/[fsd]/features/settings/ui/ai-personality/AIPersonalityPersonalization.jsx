import { memo, useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { Box, Typography } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { Input, Label } from '@/[fsd]/shared/ui';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { PERSONA_INSTRUCTIONS_PLACEHOLDERS, PERSONA_OPTIONS } from '@/common/constants';

// #5392: the "None" persona has no personality overlay, so it carries no user instructions.
const NONE_PERSONA = 'none';

const AIPersonalityPersonalization = memo(props => {
  const { onAutoSaveRequested } = props;

  const { values, setFieldValue } = useFormikContext();

  const styles = aiPersonalityPersonalizationStyles();

  // Persona options for select
  const personaOptions = useMemo(
    () =>
      PERSONA_OPTIONS.map(option => ({
        value: option.value,
        label: option.label,
        description: option.description,
      })),
    [],
  );

  const handlePersonaChange = useCallback(
    e => {
      const newPersona = e.target.value;
      setFieldValue('persona', newPersona);
      onAutoSaveRequested?.();
    },
    [onAutoSaveRequested, setFieldValue],
  );

  // #5392: instructions are stored per-persona; edit the slot for the currently selected persona.
  const handleInstructionsChange = useCallback(
    e => setFieldValue(`personality_instructions.${values.persona}`, e.target.value),
    [setFieldValue, values.persona],
  );

  return (
    <BasicAccordion
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      defaultExpanded
      accordionSX={styles.accordion}
      items={[
        {
          title: 'Persona Management',
          content: (
            <Box sx={styles.accordionContent}>
              <Box sx={styles.section}>
                <Label.InfoLabelWithTooltip
                  label="Default persona"
                  tooltip="Select the default assistant persona for your conversations"
                  sx={styles.label}
                />
                <SingleSelect
                  showBorder
                  value={values.persona}
                  emptyPlaceholder=""
                  onChange={handlePersonaChange}
                  options={personaOptions}
                  customRenderOption={option => (
                    <Box sx={styles.optionContainer}>
                      <Typography
                        variant="bodyMedium"
                        color="text.secondary"
                      >
                        {option.label}
                      </Typography>
                      <Typography
                        variant="bodySmall"
                        color="text.primary"
                      >
                        {option.description}
                      </Typography>
                    </Box>
                  )}
                  sx={styles.inputSelect}
                />
              </Box>

              {values.persona !== NONE_PERSONA && (
                <Box sx={styles.section}>
                  <Input.StyledInputEnhancer
                    label="User instructions"
                    tooltipDescription="Custom instructions for the selected persona, applied to new conversations that use it. Each persona keeps its own instructions."
                    autoComplete="off"
                    variantInput="outlined"
                    fullWidth
                    multiline
                    value={values.personality_instructions?.[values.persona] ?? ''}
                    onChange={handleInstructionsChange}
                    enableAutoBlur={false}
                    placeholder={
                      PERSONA_INSTRUCTIONS_PLACEHOLDERS[values.persona] ??
                      'No custom instructions for this persona yet. Type here to add some.'
                    }
                    hasActionsToolBar
                    showExpandAction={false}
                    fieldName="User Instructions"
                    containerProps={styles.inputContainer}
                  />
                </Box>
              )}
            </Box>
          ),
        },
      ]}
    />
  );
});

AIPersonalityPersonalization.displayName = 'AIPersonalityPersonalization';

/** @type {MuiSx} */
const aiPersonalityPersonalizationStyles = () => ({
  accordion: {
    background: 'transparent !important',
  },
  accordionContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    paddingRight: '1rem',
    marginTop: '0.6rem',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
  },
  themeToggleContainer: {
    marginTop: '0.5rem',
    paddingLeft: '0.75rem',
  },
  label: {
    paddingLeft: '0.75rem',
  },
  inputSelect: {
    marginTop: '0.25rem',
  },
  inputContainer: {
    padding: '0rem',
    margin: '0rem',
  },
  optionContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
});

export default AIPersonalityPersonalization;
