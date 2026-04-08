import { memo } from 'react';

import { Box } from '@mui/material';

import VariableList from '@/components/VariableList';

const AgentVariables = memo(props => {
  const { variables, onChangeVariable } = props;

  const styles = agentVariablesStyles();

  if (!variables?.length) {
    return null;
  }

  return (
    <Box sx={styles.container}>
      <Box sx={styles.variablesWrapper}>
        <VariableList
          variables={variables}
          onChangeVariable={onChangeVariable}
          disableActiveIndicator
          showexpandicon="true"
          multiline
          collapseContent
          variableSX={styles.variable}
        />
      </Box>
    </Box>
  );
});

AgentVariables.displayName = 'AgentVariables';

/** @type {MuiSx} */
const agentVariablesStyles = () => ({
  container: ({ palette }) => ({
    padding: '0rem 0.5rem 0.5rem 0.5rem',
    borderRadius: '0 0 0.5rem 0.5rem',
    border: 'none',
    borderTop: `0.0625rem solid ${palette.border.lines}`,
  }),
  variablesWrapper: {
    padding: '0.75rem 1rem',
  },
  variable: {
    marginBottom: '0.5rem',
  },
});

export default AgentVariables;
