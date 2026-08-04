import { memo, useCallback, useContext, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { FlowEditorContext } from '@/[fsd]/app/providers';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useGetToolkitNameFromSchema } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { Select } from '@/[fsd]/shared/ui';

// data-testid (ELITEA-2004): caller-supplied, opt-in — the LLM node is the
// only call site today (`pipeline-llm-node-toolkits-select`); any future
// caller that doesn't pass one renders untagged, same discipline as the
// Toolkit/Tool/Input/Output testids in BaseToolNode.jsx
// (.agents/testing.md § Locator policy — testid scope is load-bearing).
const ToolkitsSelect = memo(props => {
  const {
    id,
    label = 'Toolkits',
    disabled,
    onValueChange,
    allowApplications = false,
    'data-testid': dataTestId,
  } = props;

  const { setYamlJsonObject, yamlJsonObject } = useContext(FlowEditorContext);
  const { values } = useFormikContext();
  const { getToolkitNameFromSchema } = useGetToolkitNameFromSchema();

  const yamlNode = useMemo(
    () => yamlJsonObject.nodes?.find(node => node.id === id),
    [id, yamlJsonObject.nodes],
  );

  const toolkitOptions = useMemo(
    () =>
      (values?.version_details?.tools || [])
        .filter(tool => allowApplications || tool.type !== 'application')
        .map(tool => {
          const nameFromSchema = getToolkitNameFromSchema(tool);
          return {
            label: tool.toolkit_name || nameFromSchema,
            value: nameFromSchema,
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label)),
    [allowApplications, getToolkitNameFromSchema, values?.version_details?.tools],
  );

  // Get selected toolkits from tool_names keys instead of selected_toolkits
  const selectedToolkits = useMemo(() => {
    const toolNames = yamlNode?.tool_names || {};
    return Object.keys(toolNames);
  }, [yamlNode?.tool_names]);

  const handleToolkitsChange = useCallback(
    newValue => {
      const currentToolNames = yamlNode?.tool_names || {};
      const updatedToolNames = {};

      newValue.forEach(toolkitName => {
        const toolkitObj = (values?.version_details?.tools || []).find(
          tk => (tk.toolkit_name || getToolkitNameFromSchema(tk)) === toolkitName,
        );
        const availableTools = (toolkitObj?.tools || toolkitObj?.settings?.selected_tools || []).map(tool =>
          typeof tool === 'string' ? tool : tool.name,
        );
        if (currentToolNames[toolkitName]) {
          updatedToolNames[toolkitName] = (currentToolNames[toolkitName] || []).filter(tool =>
            availableTools.includes(tool),
          );
        } else {
          updatedToolNames[toolkitName] = availableTools;
        }
      });

      FlowEditorHelpers.updateYamlNode(id, 'tool_names', updatedToolNames, yamlJsonObject, setYamlJsonObject);

      if (onValueChange) {
        onValueChange(newValue);
      }
    },
    [
      id,
      onValueChange,
      setYamlJsonObject,
      yamlJsonObject,
      yamlNode?.tool_names,
      values?.version_details?.tools,
      getToolkitNameFromSchema,
    ],
  );

  return (
    <Select.SingleSelect
      showEmptyPlaceholder={false}
      label={label}
      value={selectedToolkits}
      onValueChange={handleToolkitsChange}
      options={toolkitOptions}
      disabled={disabled || !toolkitOptions?.length}
      showBorder
      multiple
      className="nopan nodrag"
      data-testid={dataTestId}
    />
  );
});

ToolkitsSelect.displayName = 'ToolkitsSelect';

export default ToolkitsSelect;
