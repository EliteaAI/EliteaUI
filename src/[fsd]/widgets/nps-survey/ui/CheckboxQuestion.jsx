import { memo, useCallback } from 'react';

import { Box, FormControlLabel, Typography } from '@mui/material';

import { Checkbox } from '@/[fsd]/shared/ui';

const CheckboxQuestion = memo(props => {
  const { question, selectedAnswer, onToggleCheckbox } = props;
  const choices = question.options?.choices ?? [];
  const selected = Array.isArray(selectedAnswer) ? selectedAnswer : [];

  const handleToggle = useCallback(
    value => onToggleCheckbox(question.id, value),
    [onToggleCheckbox, question.id],
  );

  return (
    <Box sx={styles.container}>
      {choices.map((choice, index) => {
        const value = typeof choice === 'string' ? choice : choice.value;
        const label = typeof choice === 'string' ? choice : choice.label;
        const isSelected = selected.includes(value);

        return (
          <FormControlLabel
            key={value ?? index}
            control={
              <Checkbox.BaseCheckbox
                checked={isSelected}
                onChange={() => handleToggle(value)}
                size="small"
              />
            }
            label={<Typography sx={styles.label}>{label}</Typography>}
            sx={isSelected ? styles.optionSelected : styles.option}
          />
        );
      })}
    </Box>
  );
});

CheckboxQuestion.displayName = 'CheckboxQuestion';

/** @type {MuiSx} */
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    width: '100%',
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem 0.75rem',
    borderRadius: '0.5rem',
    background: 'rgba(255, 255, 255, 0.6)',
    border: '1px solid transparent',
    margin: 0,
    width: '100%',

    '&:hover': {
      background: '#fff',
      border: '1px solid rgba(99, 144, 254, 1)',
    },
  },
  optionSelected: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem 0.75rem',
    borderRadius: '0.5rem',
    background: 'rgba(99, 144, 254, 0.1)',
    border: '1px solid rgba(99, 144, 254, 1)',
    margin: 0,
    width: '100%',
  },
  label: {
    fontFamily: '"Montserrat", sans-serif',
    fontWeight: 500,
    fontSize: '0.875rem',
    lineHeight: '1.5rem',
    color: '#0E131D',
  },
};

export default CheckboxQuestion;
