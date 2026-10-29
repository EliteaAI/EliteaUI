import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { Input, Label } from '@/[fsd]/shared/ui';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { PERSONA_OPTIONS } from '@/[fsd]/widgets/context-budget/lib/constants';

/**
 * Persona management section of the Context Management modal.
 * Mirrors the persona controls of Settings → AI Personality.
 */
const ContextStrategySystemMessages = memo(props => {
  const { formData, errors, handleInputChange } = props;
  const styles = systemMessagesStyles();

  const personaOptions = useMemo(
    () =>
      PERSONA_OPTIONS.map(option => ({
        value: option.value,
        label: option.label,
        description: option.description,
      })),
    [],
  );

  return (
    <Box sx={styles.container}>
      <Box sx={styles.section}>
        <Label.InfoLabelWithTooltip
          label="Default persona"
          tooltip="Select the default assistant persona for model chat (without agent selected)"
          sx={styles.label}
        />
        <SingleSelect
          showBorder
          value={formData.persona}
          emptyPlaceholder=""
          onChange={e => handleInputChange(e, 'persona')}
          disabled={!formData.preserve_system_messages}
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
        />
      </Box>

      <Input.StyledInputEnhancer
        label="User instructions"
        tooltipDescription="Custom instructions for the assistant"
        autoComplete="off"
        variantInput="outlined"
        fullWidth
        multiline
        value={formData.system_messages}
        onChange={e => handleInputChange(e, 'system_messages')}
        enableAutoBlur={false}
        error={!!errors.system_messages}
        helperText={errors.system_messages}
        disabled={!formData.preserve_system_messages}
        placeholder="Enter custom instructions for the assistant..."
        hasActionsToolBar
        showExpandAction={false}
        fieldName="User Instructions"
        containerProps={styles.inputContainer}
        inputProps={{
          'data-testid': 'persona-user-instructions-textarea',
        }}
      />
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
    gap: '1.25rem',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    paddingLeft: '0.75rem',
  },
  optionContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputContainer: {
    padding: '0rem',
    margin: '0rem',
  },
});

export default ContextStrategySystemMessages;
