import { memo, useMemo } from 'react';

import { Box, MenuItem, Typography } from '@mui/material';

import { Label } from '@/[fsd]/shared/ui';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { PERSONA_OPTIONS } from '@/[fsd]/widgets/ContextBudget/lib/constants';
import FormInput from '@/components/FormInput';

const ContextStrategySystemMessages = memo(props => {
  const { formData, errors, handleInputChange, isEnabled } = props;
  const styles = systemMessagesStyles();

  const personaOptions = useMemo(
    () =>
      PERSONA_OPTIONS.map(option => ({
        value: option.value,
        label: option.label,
      })),
    [],
  );

  return (
    <Box sx={styles.container}>
      {/* Preserve System Messages Toggle */}
      {/* <Box sx={styles.toggleSection}>
        <Switch.BaseSwitch
          checked={formData.preserve_system_messages}
          onChange={(event, checkedValue) =>
            handleInputChange(
              { target: { checked: checkedValue, type: 'checkbox' } },
              'preserve_system_messages',
            )
          }
          disabled={!isEnabled}
          label="Always preserve system messages"
          slotProps={{
            switch: { size: 'small' },
            formControlLabel: {
              sx: styles.toggleLabel,
            },
          }}
        />
      </Box> */}

      {/* Default Persona Selection */}
      <Box sx={styles.section}>
        <Label.InfoLabelWithTooltip
          label="Default Persona"
          tooltip="Select the default assistant persona for model chat (without agent selected)"
          sx={styles.label}
        />
        <SingleSelect
          showBorder
          value={formData.persona}
          onChange={e => handleInputChange(e, 'persona')}
          disabled={!isEnabled || !formData.preserve_system_messages}
          options={personaOptions}
          renderOption={(option, isSelected) => (
            <MenuItem
              key={option.value}
              value={option.value}
              selected={isSelected}
            >
              <Typography variant="bodyMedium">{option.label}</Typography>
            </MenuItem>
          )}
        />
      </Box>

      {/* User Instructions */}
      <Box sx={styles.section}>
        <Label.InfoLabelWithTooltip
          label="User instructions"
          tooltip="Custom instructions for the assistant"
          sx={styles.label}
        />
        <FormInput
          multiline
          maxRows={3}
          value={formData.system_messages}
          onChange={e => handleInputChange(e, 'system_messages')}
          error={!!errors.system_messages}
          helperText={errors.system_messages || ' '}
          disabled={!isEnabled || !formData.preserve_system_messages}
          placeholder="Enter custom instructions for the assistant..."
          sx={styles.formInput}
        />
      </Box>
    </Box>
  );
});

ContextStrategySystemMessages.displayName = 'ContextStrategySystemMessages';

/** @type {MuiSx} */
const systemMessagesStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    paddingRight: '1rem',
    gap: '0.75rem',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    paddingLeft: '0.75rem',
  },
  formInput: {
    padding: '0rem',
    margin: '0rem',
  },
  toggleSection: {
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '0.5rem',
  },
  toggleLabel: {
    gap: '0.7rem',
    marginTop: '-1rem',
  },
});

export default ContextStrategySystemMessages;
