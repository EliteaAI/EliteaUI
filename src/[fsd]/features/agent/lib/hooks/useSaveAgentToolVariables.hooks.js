import { useCallback, useState } from 'react';

import { useFormikContext } from 'formik';

export const useSaveAgentToolVariables = ({ tool }) => {
  const [showVariables, setShowVariables] = useState(false);
  const { setFieldValue, values } = useFormikContext();

  const onToggleVariables = useCallback(event => {
    event.stopPropagation();
    setShowVariables(prev => !prev);
  }, []);

  const onChangeVariable = useCallback(
    (label, newValue) => {
      setFieldValue(
        `version_details.tools`,
        values?.version_details.tools.map(i =>
          i.id === tool.id
            ? {
                ...i,
                variables: [
                  ...tool.variables.map(variable =>
                    variable.name === label ? { name: label, value: newValue } : variable,
                  ),
                ],
              }
            : i,
        ),
      );
    },
    [setFieldValue, tool.id, tool.variables, values?.version_details.tools],
  );

  return {
    showVariables,
    onToggleVariables,
    variables: tool.variables,
    onChangeVariable,
  };
};
