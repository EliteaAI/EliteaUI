import { memo, useCallback } from 'react';

import { useFormikContext } from 'formik';

import { Box, Typography } from '@mui/material';

import { AccordionConstants } from '@/[fsd]/shared/lib/constants';
import { Label, Switch } from '@/[fsd]/shared/ui';
import BasicAccordion from '@/[fsd]/shared/ui/accordion/BasicAccordion';
import { handleConvertToNumberChange } from '@/[fsd]/widgets/context-budget/lib/validation';
import FormInput from '@/components/FormInput';

import ProfileLongTermMemory from './ProfileLongTermMemory';
import ProfileSummarization from './ProfileSummarization';

const ProfileContextManagement = memo(props => {
  const { modelList, onAutoSaveRequested } = props;
  const { values, errors, setFieldValue } = useFormikContext();

  const styles = profileContextManagementStyles();

  const handleContextEnabledChange = useCallback(
    (event, checkedValue) => {
      setFieldValue('context_enabled', checkedValue);
      onAutoSaveRequested?.();
    },
    [setFieldValue, onAutoSaveRequested],
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
      data-testid="context-management-section"
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
                <Box sx={styles.toggleContent}>
                  <Typography
                    variant="headingSmall"
                    sx={{ color: 'text.secondary' }}
                  >
                    Context Management
                  </Typography>
                  <Typography variant="bodySmall">Enable context management for new conversations</Typography>
                </Box>
                <Switch.BaseSwitch
                  data-testid="context-management-toggle"
                  checked={values.context_enabled}
                  onChange={handleContextEnabledChange}
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
                      'data-testid': 'max-context-tokens-input',
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

              {/* Sub-sections nested under Default Context Management */}
              <Box sx={styles.subSections}>
                <ProfileSummarization modelList={modelList} />
                <ProfileLongTermMemory />
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
    // gap: '1rem',
    paddingRight: '1rem',
  },
  toggleSection: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    backgroundColor: palette.background.userInputBackground,
    borderRadius: '0.75rem',
  }),
  toggleContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  toggleLabel: {
    gap: '0.7rem',
  },
  fieldsRow: {
    display: 'flex',
    gap: '1.5rem',
    marginTop: '1rem',
  },
  subSections: {
    display: 'flex',
    flexDirection: 'column',
    borderColor: 'divider',
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
