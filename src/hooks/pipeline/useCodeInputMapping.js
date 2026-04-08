import { useCallback, useContext, useEffect, useMemo } from 'react';

import { FlowEditorContext } from '@/[fsd]/app/providers';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';

export const getDefaultCodeInputMapping = () => ({
  code: {
    type: 'fixed',
    value: '',
  },
});

const useCodeInputMapping = ({ id }) => {
  const { yamlJsonObject, setYamlJsonObject } = useContext(FlowEditorContext);

  const yamlNode = useMemo(
    () => yamlJsonObject.nodes?.find(node => node.id === id),
    [id, yamlJsonObject.nodes],
  );

  const inputMappings = useMemo(() => {
    const defaultMapping = getDefaultCodeInputMapping();
    const existingCode = yamlNode?.code;

    // If code exists as an object with type and value, use it
    if (
      existingCode &&
      typeof existingCode === 'object' &&
      existingCode.type &&
      existingCode.value !== undefined
    ) {
      return { code: existingCode };
    }

    // If code exists as a string, convert it to the proper format
    if (existingCode && typeof existingCode === 'string') {
      return { code: { type: 'fixed', value: existingCode } };
    }

    return defaultMapping;
  }, [yamlNode?.code]);

  // Initialize the YAML code field if it doesn't exist
  useEffect(() => {
    const defaultMapping = getDefaultCodeInputMapping();
    const existingCode = yamlNode?.code;

    if (!existingCode) {
      FlowEditorHelpers.batchUpdateYamlNode(
        id,
        { code: defaultMapping.code },
        yamlJsonObject,
        setYamlJsonObject,
      );
    }
  }, [id, yamlNode?.code, yamlJsonObject, setYamlJsonObject]);

  const onChangeMapping = useCallback(
    (key, value) => {
      FlowEditorHelpers.batchUpdateYamlNode(id, { code: value }, yamlJsonObject, setYamlJsonObject);
    },
    [id, yamlJsonObject, setYamlJsonObject],
  );

  // Return only the value part for defaultValues, not the entire object
  const defaultValues = useMemo(() => {
    const defaultMapping = getDefaultCodeInputMapping();
    return {
      code: defaultMapping.code.value, // Return only the value string
    };
  }, []);

  return {
    inputMappings,
    onChangeMapping,
    defaultValues,
  };
};

export default useCodeInputMapping;
