import { memo } from 'react';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorNodes } from '@/[fsd]/features/pipelines/flow-editor/ui';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts';

const ToolkitNode = memo(props => {
  const { id, data, selected } = props;

  return (
    <FlowEditorNodes.BaseToolNode
      showStructuredOutput // Different from FunctionNode
      id={id}
      data={data}
      selected={selected}
      nodeType={FlowEditorConstants.PipelineNodeTypes.Toolkit}
      customFilterTypes={tool =>
        ![ToolTypes.application.value].includes(tool.type) &&
        !tool.meta?.mcp &&
        tool.type !== FlowEditorConstants.PipelineNodeTypes.Mcp
      }
    />
  );
});

ToolkitNode.displayName = 'ToolkitNode';

export default ToolkitNode;
