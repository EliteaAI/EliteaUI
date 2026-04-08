import { memo } from 'react';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorNodes } from '@/[fsd]/features/pipelines/flow-editor/ui';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts';

const FunctionNode = memo(({ id, data, selected }) => {
  return (
    <FlowEditorNodes.BaseToolNode
      id={id}
      data={data}
      selected={selected}
      nodeType={FlowEditorConstants.PipelineNodeTypes.Function}
      showStructuredOutput={false}
      customFilterTypes={tool => ![ToolTypes.application.value].includes(tool.type)}
    />
  );
});

FunctionNode.displayName = 'FunctionNode';

export default FunctionNode;
