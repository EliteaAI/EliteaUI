import { useMemo } from 'react';

import { TextField } from '@mui/material';

import { Input } from '@/[fsd]/shared/ui';

export default function FormInput({ value, inputEnhancer, ...props }) {
  const inputProps = useMemo(
    () => ({
      fullWidth: true,
      autoComplete: 'off',
      variant: 'standard',
    }),
    [],
  );

  return inputEnhancer ? (
    <Input.StyledInputEnhancer
      {...inputProps}
      {...props}
      value={value ?? ''}
    />
  ) : (
    <TextField
      {...inputProps}
      {...props}
      value={value ?? ''}
    />
  );
}
