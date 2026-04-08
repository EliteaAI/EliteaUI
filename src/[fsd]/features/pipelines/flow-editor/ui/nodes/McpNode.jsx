import { memo } from 'react';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorNodes } from '@/[fsd]/features/pipelines/flow-editor/ui';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts';

const McpNode = memo(({ id, data, selected }) => {
  return (
    <FlowEditorNodes.BaseToolNode
      showStructuredOutput // Different from FunctionNode
      id={id}
      data={data}
      selected={selected}
      nodeType={FlowEditorConstants.PipelineNodeTypes.Mcp}
      customFilterTypes={tool =>
        ![ToolTypes.application.value].includes(tool.type) &&
        (tool.meta?.mcp || tool.type === FlowEditorConstants.PipelineNodeTypes.Mcp)
      }
    />
  );
});

McpNode.displayName = 'McpNode';

export default McpNode;
