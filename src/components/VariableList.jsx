import { memo, useCallback } from 'react';

import { Box } from '@mui/material';

import { Input } from '@/[fsd]/shared/ui';

const VariableList = memo(props => {
  const { variables, onChangeVariable, variableSX, rowTestId, inputTestId, ...restProps } = props;

  return (
    <Box>
      {variables.map(({ key, name, value }) => {
        const variableLabel = key || name;
        return (
          <Variable
            onChangeVariable={onChangeVariable}
            key={variableLabel}
            label={variableLabel}
            id={variableLabel}
            value={value}
            sx={variableSX}
            rowTestId={rowTestId ? rowTestId.replace('{}', variableLabel) : undefined}
            inputTestId={inputTestId ? inputTestId.replace('{}', variableLabel) : undefined}
            {...restProps}
          />
        );
      })}
    </Box>
  );
});

VariableList.displayName = 'VariableList';
export default VariableList;

const Variable = memo(props => {
  const { id, label, value, onChangeVariable, sx, rowTestId, inputTestId, ...restProps } = props;

  const handleInput = useCallback(
    event => {
      event.preventDefault();
      onChangeVariable(label, event.target.value);
    },
    [label, onChangeVariable],
  );

  return (
    <Box
      sx={sx}
      data-testid={rowTestId}
    >
      <Input.StyledInputEnhancer
        label={label}
        id={id}
        value={value}
        onInput={handleInput}
        hasActionsToolBar
        fieldName={label}
        inputProps={{ 'data-testid': inputTestId }}
        {...restProps}
      />
    </Box>
  );
});

Variable.displayName = 'Variable';
