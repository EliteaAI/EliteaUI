import { memo, useCallback } from 'react';

import { Box, FormControlLabel, Typography } from '@mui/material';

import { Checkbox } from '@/[fsd]/shared/ui';

const RadioQuestion = memo(props => {
  const { question, selectedAnswer, onSelectAnswer } = props;
  const choices = question.options?.choices ?? [];

  const handleSelect = useCallback(
    value => onSelectAnswer(question.id, value),
    [onSelectAnswer, question.id],
  );

  return (
    <Box sx={styles.container}>
      {choices.map((choice, index) => {
        const value = typeof choice === 'string' ? choice : choice.value;
        const label = typeof choice === 'string' ? choice : choice.label;
        const isSelected = selectedAnswer === value;

        return (
          <FormControlLabel
            key={value ?? index}
            control={
              <Checkbox.BaseCheckbox
                mode="radio"
                checked={isSelected}
                onChange={() => handleSelect(value)}
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

RadioQuestion.displayName = 'RadioQuestion';

/** @type {MuiSx} */
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    width: '100%',
  },
  option: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem 0.75rem',
    borderRadius: '0.5rem',
    background: palette.components.npsSurvey.optionBackground,
    border: '1px solid transparent',
    margin: 0,
    width: '100%',
    '&:hover': {
      background: palette.components.npsSurvey.optionBackgroundHover,
      border: `0.0625rem solid ${palette.components.npsSurvey.accent}`,
    },
  }),
  optionSelected: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem 0.75rem',
    borderRadius: '0.5rem',
    background: palette.components.npsSurvey.accentSubtle,
    border: `0.0625rem solid ${palette.components.npsSurvey.accent}`,
    margin: 0,
    width: '100%',
  }),
  label: ({ palette }) => ({
    fontFamily: '"Montserrat", sans-serif',
    fontWeight: 500,
    fontSize: '0.875rem',
    lineHeight: '1.5rem',
    color: palette.text.alwaysDark,
  }),
};

export default RadioQuestion;
