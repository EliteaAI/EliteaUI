import { memo, useCallback } from 'react';

import { Box } from '@mui/material';

import { Input } from '@/[fsd]/shared/ui';

const VariableList = memo(props => {
  const { variables, onChangeVariable, variableSX, ...restProps } = props;

  return (
    <Box>
      {variables.map(({ key, name, value }) => (
        <Variable
          onChangeVariable={onChangeVariable}
          key={key || name}
          label={key || name}
          id={key || name}
          value={value}
          sx={variableSX}
          {...restProps}
        />
      ))}
    </Box>
  );
});

VariableList.displayName = 'VariableList';
export default VariableList;

const Variable = memo(props => {
  const { id, label, value, onChangeVariable, sx, ...restProps } = props;

  const handleInput = useCallback(
    event => {
      event.preventDefault();
      onChangeVariable(label, event.target.value);
    },
    [label, onChangeVariable],
  );

  return (
    <Box sx={sx}>
      <Input.StyledInputEnhancer
        label={label}
        id={id}
        value={value}
        onInput={handleInput}
        hasActionsToolBar
        fieldName={label}
        {...restProps}
      />
    </Box>
  );
});

Variable.displayName = 'Variable';
