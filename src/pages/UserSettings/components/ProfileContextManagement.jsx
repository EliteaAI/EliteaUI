import { memo, useCallback } from 'react';

import { useFormikContext } from 'formik';

import { Box } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { Label, Switch } from '@/[fsd]/shared/ui';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { handleConvertToNumberChange } from '@/[fsd]/widgets/ContextBudget/lib/validation';
import FormInput from '@/components/FormInput';

const ProfileContextManagement = memo(() => {
  const { values, errors, setFieldValue } = useFormikContext();

  const styles = profileContextManagementStyles();

  const handleContextEnabledChange = useCallback(
    (event, checkedValue) => setFieldValue('context_enabled', checkedValue),
    [setFieldValue],
  );

  const handleNumericInputChange = useCallback(
    (e, fieldName) => {
      const value = e?.target?.value;
      handleConvertToNumberChange(value, fieldName, setFieldValue);
    },
    [setFieldValue],
  );

  const isEnabled = values.context_enabled;

  return (
    <BasicAccordion
      showMode={AccordionConstants.AccordionShowMode.LeftMode}
      defaultExpanded
      accordionSX={styles.accordion}
      items={[
        {
          title: 'Default Context Management',
          content: (
            <Box sx={styles.accordionContent}>
              {/* Enable Context Management */}
              <Box sx={styles.toggleSection}>
                <Switch.BaseSwitch
                  checked={values.context_enabled}
                  onChange={handleContextEnabledChange}
                  label="Enable context management for new conversations"
                  slotProps={{
                    switch: { size: 'small' },
                    formControlLabel: { sx: styles.toggleLabel },
                  }}
                />
              </Box>

              {/* Token Fields Row */}
              <Box sx={styles.fieldsRow}>
                {/* Max Context Tokens */}
                <Box sx={styles.field}>
                  <Label.InfoLabelWithTooltip
                    label="Max Context Tokens"
                    tooltip="Maximum number of tokens to keep in conversation context"
                    sx={styles.label}
                  />
                  <FormInput
                    sx={styles.formInput}
                    type="text"
                    inputMode="numeric"
                    value={values.max_context_tokens}
                    onChange={e => handleNumericInputChange(e, 'max_context_tokens')}
                    error={!!errors.max_context_tokens}
                    helperText={errors.max_context_tokens || ' '}
                    disabled={!isEnabled}
                    inputProps={{
                      pattern: '[1-9][0-9]*',
                    }}
                  />
                </Box>

                {/* Preserve Recent Messages */}
                <Box sx={styles.field}>
                  <Label.InfoLabelWithTooltip
                    label="Preserve Recent Messages"
                    tooltip="Number of most recent messages to always keep in context"
                    sx={styles.label}
                  />
                  <FormInput
                    sx={styles.formInput}
                    type="text"
                    inputMode="numeric"
                    value={values.preserve_recent_messages}
                    onChange={e => handleNumericInputChange(e, 'preserve_recent_messages')}
                    error={!!errors.preserve_recent_messages}
                    helperText={errors.preserve_recent_messages || ' '}
                    disabled={!isEnabled}
                    inputProps={{
                      pattern: '[1-9][0-9]*',
                    }}
                  />
                </Box>
              </Box>
            </Box>
          ),
        },
      ]}
    />
  );
});

ProfileContextManagement.displayName = 'ProfileContextManagement';

/** @type {MuiSx} */
const profileContextManagementStyles = () => ({
  accordion: {
    background: 'transparent !important',
    '& .MuiAccordionDetails-root': {
      paddingTop: '0rem',
    },
  },
  accordionContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    paddingRight: '1rem',
  },
  toggleSection: {
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '0.5rem',
  },
  toggleLabel: {
    gap: '0.7rem',
  },
  fieldsRow: {
    display: 'flex',
    gap: '1.5rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
  },
  label: {
    paddingLeft: '0.75rem',
  },
  formInput: {
    padding: '0rem',
    margin: '0rem',
  },
});

export default ProfileContextManagement;
