import { memo, useCallback } from 'react';

import { Input } from '@/[fsd]/shared/ui';

const TextQuestion = memo(props => {
  const { question, selectedAnswer, onTextChange } = props;
  const placeholder = question.options?.placeholder ?? '';

  const handleChange = useCallback(
    event => onTextChange(question.id, event.target.value),
    [onTextChange, question.id],
  );

  return (
    <Input.InputBase
      variant={Input.INPUT_VARIANTS.outlined}
      fullWidth
      multiline
      minRows={3}
      maxRows={3}
      enableAutoBlur={false}
      value={selectedAnswer ?? ''}
      onChange={handleChange}
      placeholder={placeholder}
      sx={styles.input}
    />
  );
});

TextQuestion.displayName = 'TextQuestion';

/** @type {MuiSx} */
const styles = {
  input: ({ palette }) => ({
    '& .MuiOutlinedInput-root': {
      background: palette.components.npsSurvey.optionBackground,
      borderRadius: '0.5rem',

      '& fieldset': {
        border: '0.0625rem solid transparent',
      },
      '&:hover fieldset': {
        border: `0.0625rem solid ${palette.components.npsSurvey.accent} !important`,
      },
      '&.Mui-focused fieldset': {
        border: `0.0625rem solid ${palette.components.npsSurvey.accent} !important`,
      },
    },
    '& .MuiInputBase-input': {
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: '1.5rem',
      color: palette.text.alwaysDark,
      maxHeight: '5rem !important',

      '&::placeholder': {
        color: palette.components.npsSurvey.text.placeholder,
        opacity: 1,
      },
    },
  }),
};

export default TextQuestion;
