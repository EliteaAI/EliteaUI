import { useCallback } from 'react';

import { useSelector } from 'react-redux';

const REQUIRED_VALIDATION_FIELDS = ['_configuration', 'pg_vector_configuration', 'embedding_model'];

export const useValidateToolkitImport = () => {
  const toolkitSchemas = useSelector(state => state.applications.toolkitSchemas);

  const validateInvalidTools = useCallback((requiredSettings, toolSettings) => {
    const invalidTools = [];

    toolSettings.selected_tools?.forEach(tool => {
      if (!requiredSettings.selected_tools?.items?.enum?.includes(tool)) invalidTools.push(tool);
    });

    return invalidTools;
  }, []);

  const validateMissingsSettings = useCallback((requiredSettings, toolSettings) => {
    const missingSettings = [];

    Object.keys(requiredSettings).forEach(key => {
      if (
        !(key in toolSettings) ||
        toolSettings[key] === '' ||
        toolSettings[key] === null ||
        toolSettings[key] === undefined ||
        (Array.isArray(toolSettings[key]) && toolSettings[key].length === 0) ||
        (typeof toolSettings[key] === 'object' && Object.keys(toolSettings[key]).length === 0)
      ) {
        if (REQUIRED_VALIDATION_FIELDS.some(f => key.includes(f))) missingSettings.push(key);
      }
    });

    return missingSettings;
  }, []);

  const validateToolkitImport = useCallback(
    tool => {
      const errors = [];
      let isValid = true;

      if (!toolkitSchemas || !tool) return { errors, isValid };

      const currentToolkitSchema = toolkitSchemas[tool.type];
      const toolSettings = tool.settings ?? {};
      const requiredSettings = currentToolkitSchema?.properties ?? {};

      const missingSettings = validateMissingsSettings(requiredSettings, toolSettings);
      const invalidTools = validateInvalidTools(requiredSettings, toolSettings);

      if (missingSettings.length) {
        errors.push(`Missing required settings: ${missingSettings.join(', ')}`);
        isValid = false;
      }

      if (invalidTools.length) {
        errors.push(`Invalid configuration for tools: ${invalidTools.join(', ')}`);
        isValid = false;
      }

      return { errors, isValid };
    },
    [toolkitSchemas, validateInvalidTools, validateMissingsSettings],
  );

  return { validateToolkitImport };
};
