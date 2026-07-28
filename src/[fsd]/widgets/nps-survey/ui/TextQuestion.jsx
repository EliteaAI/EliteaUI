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
  input: {
    '& .MuiOutlinedInput-root': {
      background: 'rgba(255, 255, 255, 0.6)',
      borderRadius: '0.5rem',

      '& fieldset': {
        border: '1px solid transparent',
      },
      '&:hover fieldset': {
        border: '1px solid rgba(99, 144, 254, 1) !important',
      },
      '&.Mui-focused fieldset': {
        border: '1px solid rgba(99, 144, 254, 1) !important',
      },
    },
    '& .MuiInputBase-input': {
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: '1.5rem',
      color: '#0E131D',
      maxHeight: '5rem !important',

      '&::placeholder': {
        color: '#777A83',
        opacity: 1,
      },
    },
  },
};

export default TextQuestion;
