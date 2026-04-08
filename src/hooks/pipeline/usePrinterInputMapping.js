import { useCallback, useContext, useEffect, useMemo } from 'react';

import { FlowEditorContext } from '@/[fsd]/app/providers';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';

export const getDefaultPrinterInputMapping = () => ({
  printer: { type: 'fixed', value: '' },
});

export default function usePrinterInputMapping({ id }) {
  const { yamlJsonObject, setYamlJsonObject } = useContext(FlowEditorContext);

  const yamlNode = useMemo(
    () => yamlJsonObject.nodes?.find(node => node.id === id),
    [id, yamlJsonObject.nodes],
  );

  const inputMappings = useMemo(() => {
    const defaultMapping = getDefaultPrinterInputMapping();
    const existingInputMapping = yamlNode?.input_mapping || {};

    // Merge with defaults, ensuring each property has both type and value
    const merged = {};
    Object.keys(defaultMapping).forEach(key => {
      if (existingInputMapping[key]) {
        merged[key] = existingInputMapping[key];
      } else {
        merged[key] = defaultMapping[key];
      }
    });

    return merged;
  }, [yamlNode?.input_mapping]);

  // Initialize YAML input_mapping if it doesn't exist
  useEffect(() => {
    const defaultMapping = getDefaultPrinterInputMapping();
    const existingInputMapping = Object.keys(yamlNode?.input_mapping || {});
    const requiredInputs = ['printer'];

    if (!existingInputMapping.length || requiredInputs.find(input => !existingInputMapping.includes(input))) {
      // Only update if there is no existing mapping or required inputs are missing
      FlowEditorHelpers.batchUpdateYamlNode(
        id,
        { input_mapping: defaultMapping },
        yamlJsonObject,
        setYamlJsonObject,
      );
    }
  }, [id, yamlNode?.input_mapping, yamlJsonObject, setYamlJsonObject]);

  const onChangeMapping = useCallback(
    (key, value) => {
      const updatedMapping = { ...inputMappings, [key]: value };
      FlowEditorHelpers.batchUpdateYamlNode(
        id,
        { input_mapping: updatedMapping },
        yamlJsonObject,
        setYamlJsonObject,
      );
    },
    [id, inputMappings, yamlJsonObject, setYamlJsonObject],
  );

  const defaultValues = useMemo(() => {
    const defaultMapping = getDefaultPrinterInputMapping();
    return {
      printer: defaultMapping.printer.value,
    };
  }, []);

  return {
    inputMappings,
    onChangeMapping,
    defaultValues,
  };
}
