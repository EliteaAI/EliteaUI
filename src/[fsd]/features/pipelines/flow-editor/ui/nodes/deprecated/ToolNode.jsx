import { memo, useCallback, useContext, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { FlowEditorContext } from '@/[fsd]/app/providers';
import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { useGetToolkitNameFromSchema } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import {
  FlowEditorNodes,
  FlowEditorSelect,
  FlowEditorSettings,
} from '@/[fsd]/features/pipelines/flow-editor/ui';
import { Input } from '@/[fsd]/shared/ui';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { useToolkitAvailableToolsQuery } from '@/api/toolkits.js';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts';
import { useEdges } from '@xyflow/react';

const toolkitFilter = tool => tool.type != ToolTypes.application.value;

const ToolNode = memo(props => {
  const { id, data, selected } = props;
  const edges = useEdges();
  const { yamlJsonObject, isRunningPipeline, setYamlJsonObject, disabled } = useContext(FlowEditorContext);
  const yamlNode = useMemo(
    () => yamlJsonObject.nodes?.find(node => node.id === id),
    [id, yamlJsonObject.nodes],
  );
  const toolkit = useMemo(() => {
    return yamlNode?.toolkit_name || yamlNode?.tool || id;
  }, [id, yamlNode?.tool, yamlNode?.toolkit_name]);
  const isSourceConnectable = useMemo(
    () =>
      !edges.find(edge => edge.source === id && edge.target !== FlowEditorConstants.PipelineNodeTypes.End),
    [edges, id],
  );
  const { getToolkitNameFromSchema, getSelectedTools } = useGetToolkitNameFromSchema();
  const onSelectToolkit = useCallback(
    newToolkit => {
      if (!newToolkit) {
        FlowEditorHelpers.batchUpdateYamlNode(
          id,
          { toolkit_name: undefined, tool: undefined },
          yamlJsonObject,
          setYamlJsonObject,
        );
        return;
      }
      FlowEditorHelpers.batchUpdateYamlNode(
        id,
        {
          toolkit_name:
            newToolkit.type !== ToolTypes.application.value
              ? newToolkit.toolkit_name || getToolkitNameFromSchema(newToolkit)
              : undefined,
          tool: newToolkit.type === ToolTypes.application.value ? newToolkit.name : undefined,
        },
        yamlJsonObject,
        setYamlJsonObject,
      );
    },
    [getToolkitNameFromSchema, id, setYamlJsonObject, yamlJsonObject],
  );

  const taskValue = useMemo(() => {
    return yamlNode?.task || '';
  }, [yamlNode?.task]);

  const handleSetTask = useCallback(
    e => {
      FlowEditorHelpers.updateYamlNode(id, 'task', e.target.value, yamlJsonObject, setYamlJsonObject);
    },
    [id, setYamlJsonObject, yamlJsonObject],
  );

  const toolValue = useMemo(() => {
    return yamlNode?.tool || '';
  }, [yamlNode?.tool]);

  const handleSetTool = useCallback(
    value => {
      FlowEditorHelpers.batchUpdateYamlNode(
        id,
        {
          tool: value,
        },
        yamlJsonObject,
        setYamlJsonObject,
      );
    },
    [id, setYamlJsonObject, yamlJsonObject],
  );

  const { values } = useFormikContext();

  const projectId = useSelectedProjectId();

  const selectedToolkit = useMemo(() => {
    return (values?.version_details?.tools || [])
      .map(tool => {
        if (tool.toolkit_name) {
          return tool;
        }
        return {
          ...tool,
          toolkit_name: getToolkitNameFromSchema(tool),
        };
      })
      .find(tool => tool.toolkit_name === toolkit || tool.name === toolkit);
  }, [getToolkitNameFromSchema, toolkit, values?.version_details?.tools]);

  const shouldFetchDynamicTools = useMemo(() => {
    const explicitSelected = selectedToolkit?.settings?.selected_tools;
    const hasExplicitSelection = Array.isArray(explicitSelected) && explicitSelected.length > 0;
    if (hasExplicitSelection) return false;
    if (!projectId) return false;
    if (!selectedToolkit?.id) return false;
    return true;
  }, [projectId, selectedToolkit?.id, selectedToolkit?.settings?.selected_tools]);

  const { data: toolkitAvailableToolsData } = useToolkitAvailableToolsQuery(
    { projectId, toolkitId: selectedToolkit?.id },
    { skip: !shouldFetchDynamicTools },
  );

  const dynamicToolNames = useMemo(() => {
    const tools = toolkitAvailableToolsData?.tools || [];
    return tools.map(t => t?.name).filter(name => typeof name === 'string' && name.trim());
  }, [toolkitAvailableToolsData?.tools]);

  const functionOptions = useMemo(() => {
    const explicitSelected = selectedToolkit?.settings?.selected_tools;
    const hasExplicitSelection = Array.isArray(explicitSelected) && explicitSelected.length > 0;
    const availableTools = getSelectedTools(selectedToolkit?.type);
    const hasAvailableCheck = Array.isArray(availableTools) && availableTools.length > 0;

    let enabledTools;
    if (hasExplicitSelection && hasAvailableCheck) {
      enabledTools = explicitSelected.filter(tool =>
        availableTools.includes(FlowEditorHelpers.getToolName(tool)),
      );
    } else if (hasExplicitSelection) {
      enabledTools = explicitSelected;
    } else {
      enabledTools = dynamicToolNames;
    }

    return (enabledTools || [])
      .map(item => ({
        label: FlowEditorHelpers.getToolName(item),
        value: FlowEditorHelpers.getToolName(item),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [dynamicToolNames, getSelectedTools, selectedToolkit?.settings?.selected_tools, selectedToolkit?.type]);

  return (
    <>
      <FlowEditorNodes.NodeCard
        name={id}
        isEntrypoint={yamlJsonObject.entry_point === id}
        selected={selected}
        type={FlowEditorConstants.PipelineNodeTypes.Tool}
        isPerforming={data?.isPerforming}
        id={id}
        handles={() => {
          return (
            <>
              <FlowEditorNodes.CustomHandle
                type="target"
                id="target"
                isConnectable={!isRunningPipeline && !disabled}
                isRunningPipeline={isRunningPipeline}
                isPerforming={data?.isPerforming}
              />
              <FlowEditorNodes.CustomHandle
                type="source"
                id="source"
                isConnectable={isSourceConnectable && !isRunningPipeline && !disabled}
                isRunningPipeline={isRunningPipeline}
                isPerforming={data?.isPerforming}
              />
            </>
          );
        }}
      >
        <FlowEditorSelect.ToolSelect
          id={id}
          onSelectTool={onSelectToolkit}
          selectedToolkit={toolkit}
          disabled={isRunningPipeline || disabled}
          filterTypes={toolkitFilter}
        />
        {functionOptions.length > 0 && (
          <SingleSelect
            sx={{ marginBottom: '0px' }}
            label="Tool"
            value={toolValue}
            onValueChange={handleSetTool}
            options={functionOptions}
            disabled={isRunningPipeline || disabled}
            showBorder
            className="nopan nodrag"
          />
        )}
        <Input.StyledInputEnhancer
          disabled={isRunningPipeline || disabled}
          autoComplete="off"
          showexpandicon="true"
          maxRows={3}
          minRows={1}
          showCopyAction={false}
          showExpandAction={false}
          multiline
          variant="standard"
          fullWidth
          name="task"
          label="Task"
          placeholder=""
          value={taskValue}
          onInput={handleSetTask}
          hasActionsToolBar
          fieldName="Task"
          containerProps={{
            marginBottom: '0px !important',
            className: 'nowheel',
          }}
        />
        <FlowEditorSelect.InputSelect
          id={id}
          label="Input"
          inputFieldName="input"
          disabled={isRunningPipeline || disabled}
        />
        <FlowEditorSelect.OutputSelect
          id={id}
          label="Output"
          outputFieldName="output"
          disabled={isRunningPipeline || disabled}
        />
        <FlowEditorSettings.CommonInterruptSettings
          id={id}
          type={FlowEditorConstants.PipelineNodeTypes.Tool}
          disabled={isRunningPipeline || disabled}
        />
      </FlowEditorNodes.NodeCard>
    </>
  );
});

ToolNode.displayName = 'ToolNode';

export default ToolNode;
