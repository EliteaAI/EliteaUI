import * as FlowEditorConstants from './flowEditor.constants';

const DeprecatedTip = 'This node is deprecated and will be removed in a future version. ';
const ViewMigrationGuideText = 'View Migration Guide';

export const DeprecatedTips = {
  [FlowEditorConstants.PipelineNodeTypes.Condition]: {
    text: DeprecatedTip,
    linkText: ViewMigrationGuideText,
    linkUrl: 'https://docs.elitea.ai/migration/v2.0.1/condition-node-migration',
  },
  [FlowEditorConstants.PipelineNodeTypes.Tool]: {
    text: DeprecatedTip,
    linkText: ViewMigrationGuideText,
    linkUrl: 'https://docs.elitea.ai/migration/v2.0.1/tool-node-migration',
  },
  [FlowEditorConstants.PipelineNodeTypes.Function]: {
    text: DeprecatedTip,
    linkText: ViewMigrationGuideText,
    linkUrl: 'https://docs.elitea.ai/migration/v2.0.1/function-node-migration',
  },
  [FlowEditorConstants.PipelineNodeTypes.Pipeline]: {
    text: DeprecatedTip,
    linkText: ViewMigrationGuideText,
    linkUrl: 'https://docs.elitea.ai/migration/v2.0.1/pipeline-node-migration',
  },
  [FlowEditorConstants.PipelineNodeTypes.Loop]: {
    text: DeprecatedTip,
    linkText: ViewMigrationGuideText,
    linkUrl: 'https://docs.elitea.ai/migration/v2.0.1/loop-node-migration',
  },
  [FlowEditorConstants.PipelineNodeTypes.LoopFromTool]: {
    text: DeprecatedTip,
    linkText: ViewMigrationGuideText,
    linkUrl: 'https://docs.elitea.ai/migration/v2.0.1/loop-node-migration',
  },
  [FlowEditorConstants.PipelineNodeTypes.Custom]: {
    text: 'This node is deprecated and hidden from the node picker. Existing Custom nodes will keep working — please select a specific node type (Toolkit, MCP, LLM, Code, etc.) instead.',
  },
};

export const DeprecatedNodes = [
  FlowEditorConstants.PipelineNodeTypes.Function,
  FlowEditorConstants.PipelineNodeTypes.Condition,
  FlowEditorConstants.PipelineNodeTypes.Pipeline,
  FlowEditorConstants.PipelineNodeTypes.Loop,
  FlowEditorConstants.PipelineNodeTypes.LoopFromTool,
  FlowEditorConstants.PipelineNodeTypes.Tool,
  FlowEditorConstants.PipelineNodeTypes.Custom,
];

export const DeprecatedOrInvisibleNode = [
  ...DeprecatedNodes.map(nodeType => FlowEditorConstants.PipelineNodeTypeNames[nodeType]),
  FlowEditorConstants.PipelineNodeTypeNames[FlowEditorConstants.PipelineNodeTypes.End],
  FlowEditorConstants.PipelineNodeTypeNames[FlowEditorConstants.PipelineNodeTypes.Ghost],
  FlowEditorConstants.PipelineNodeTypeNames[FlowEditorConstants.PipelineNodeTypes.Default],
];
