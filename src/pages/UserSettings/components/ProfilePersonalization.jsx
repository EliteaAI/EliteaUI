import { memo, useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { Box, Typography } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { Input, Label } from '@/[fsd]/shared/ui';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { PERSONA_OPTIONS } from '@/common/constants';

const ProfilePersonalization = memo(props => {
  const { onAutoSaveRequested } = props;

  const { values, setFieldValue } = useFormikContext();

  const styles = profilePersonalizationStyles();

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

  const handleInstructionsChange = useCallback(
    e => setFieldValue('default_instructions', e.target.value),
    [setFieldValue],
  );

  return (
    <BasicAccordion
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      defaultExpanded
      accordionSX={styles.accordion}
      items={[
        {
          title: 'General',
          content: (
            <Box sx={styles.accordionContent}>
              {/* Default Persona Selection */}
              <Box sx={styles.section}>
                <Label.InfoLabelWithTooltip
                  label="Default Personality"
                  tooltip="Select the default assistant personality for your conversations"
                  sx={styles.label}
                />
                <SingleSelect
                  showBorder
                  value={values.persona}
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

              {/* Default Instructions */}
              <Box sx={styles.section}>
                <Label.InfoLabelWithTooltip
                  label="Default User Instructions"
                  tooltip="Custom instructions that will be applied to all new conversations"
                  sx={styles.label}
                />
                <Input.StyledInputEnhancer
                  autoComplete="off"
                  variant="standard"
                  fullWidth
                  multiline
                  maxRows={6}
                  minRows={3}
                  value={values.default_instructions}
                  onChange={handleInstructionsChange}
                  enableAutoBlur={false}
                  placeholder="Example: Always respond in a concise manner. Focus on practical solutions. Use code examples when explaining technical concepts."
                  hasActionsToolBar
                  fieldName="Default Instructions"
                  containerProps={styles.inputContainer}
                />
              </Box>
            </Box>
          ),
        },
      ]}
    />
  );
});

ProfilePersonalization.displayName = 'ProfilePersonalization';

/** @type {MuiSx} */
const profilePersonalizationStyles = () => ({
  accordion: {
    background: 'transparent !important',
  },
  accordionContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    paddingRight: '1rem',
    marginTop: '0.6rem',
    marginBottom: '1.5rem',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
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

export default ProfilePersonalization;
