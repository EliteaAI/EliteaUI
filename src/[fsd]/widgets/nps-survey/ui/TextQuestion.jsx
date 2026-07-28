import { memo, useCallback } from 'react';

import { Box } from '@mui/material';

import { Input } from '@/[fsd]/shared/ui';

const TextQuestion = memo(props => {
  const { question, selectedAnswer, onTextChange } = props;
  const placeholder = question.options?.placeholder ?? '';

  const handleChange = useCallback(
    event => onTextChange(question.id, event.target.value),
    [onTextChange, question.id],
  );

  return (
    <Box sx={styles.container}>
      <Input.InputBase
        multiline
        minRows={3}
        maxRows={3}
        variant="outlined"
        value={selectedAnswer ?? ''}
        onChange={handleChange}
        placeholder={placeholder}
        enableAutoBlur={false}
        sx={styles.input}
      />
    </Box>
  );
});

TextQuestion.displayName = 'TextQuestion';

/** @type {MuiSx} */
const styles = {
  container: {
    width: '100%',
  },
  input: {
    '& .MuiOutlinedInput-root': {
      background: 'rgba(255, 255, 255, 0.6)',
      borderRadius: '0.5rem',
      '& fieldset': {
        border: '1px solid transparent',
      },
      '&:hover fieldset': {
        border: '1px solid rgba(99, 144, 254, 1)',
      },
      '&.Mui-focused fieldset': {
        border: '1px solid rgba(99, 144, 254, 1)',
      },
    },
    '& .MuiInputBase-input': {
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: '1.5rem',
      color: '#0E131D',
      '&::placeholder': {
        color: '#777A83',
        opacity: 1,
      },
    },
  },
};

export default TextQuestion;
