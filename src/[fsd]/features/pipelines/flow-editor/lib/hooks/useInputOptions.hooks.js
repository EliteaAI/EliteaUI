import { useContext, useMemo } from 'react';

import { FlowEditorContext } from '@/[fsd]/app/providers';
import { StateVariableTypes } from '@/[fsd]/features/pipelines/flow-editor/lib/constants/flowEditor.constants';
import { SharedHelpers } from '@/[fsd]/shared/lib/helpers';

export const useInputOptions = () => {
  const { yamlJsonObject } = useContext(FlowEditorContext);

  const inputOptions = useMemo(() => {
    const stateKeys = Object.keys(
      yamlJsonObject.state || { input: StateVariableTypes.String, messages: StateVariableTypes.List },
    );

    const sortedKeys = SharedHelpers.sortWithPriority(stateKeys, ['input', 'messages']);

    return (
      sortedKeys.map(variable => ({
        label: variable,
        value: variable,
      })) || []
    );
  }, [yamlJsonObject.state]);

  return inputOptions;
};
