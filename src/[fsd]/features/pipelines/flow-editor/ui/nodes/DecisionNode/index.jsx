import { memo, useMemo } from 'react';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';

import LegacyDecisionNode from './LegacyDecisionNode';
import NormalDecisionNode from './NormalDecisionNode';

const DecisionNode = memo(props => {
  const { id, data, selected } = props;
  const isLegacyDecisionNode = useMemo(() => id.endsWith(FlowEditorConstants.DECISION_NODE_ID_SUFFIX), [id]);

  if (isLegacyDecisionNode) {
    return <LegacyDecisionNode {...{ id, data, selected }} />;
  } else {
    return <NormalDecisionNode {...{ id, data, selected }} />;
  }
});

DecisionNode.displayName = 'DecisionNode';

export default DecisionNode;
