import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';

const DeprecatedTip = 'This node is deprecated and will be removed in a future version. ';
const ViewMigrationGuideText = 'View Migration Guide';

export const DeprecatedTips = {
  [FlowEditorConstants.PipelineNodeTypes.Condition]: {
    text: DeprecatedTip,
    linkText: ViewMigrationGuideText,
    linkUrl: 'https://elitea.ai/docs/migration/v2.0.1/condition-node-migration',
  },
  [FlowEditorConstants.PipelineNodeTypes.Tool]: {
    text: DeprecatedTip,
    linkText: ViewMigrationGuideText,
    linkUrl: 'https://elitea.ai/docs/migration/v2.0.1/tool-node-migration',
  },
  [FlowEditorConstants.PipelineNodeTypes.Function]: {
    text: DeprecatedTip,
    linkText: ViewMigrationGuideText,
    linkUrl: 'https://elitea.ai/docs/migration/v2.0.1/function-node-migration',
  },
  [FlowEditorConstants.PipelineNodeTypes.Pipeline]: {
    text: DeprecatedTip,
    linkText: ViewMigrationGuideText,
    linkUrl: 'https://elitea.ai/docs/migration/v2.0.1/pipeline-node-migration',
  },
  [FlowEditorConstants.PipelineNodeTypes.Loop]: {
    text: DeprecatedTip,
    linkText: ViewMigrationGuideText,
    linkUrl: 'https://elitea.ai/docs/migration/v2.0.1/loop-node-migration',
  },
  [FlowEditorConstants.PipelineNodeTypes.LoopFromTool]: {
    text: DeprecatedTip,
    linkText: ViewMigrationGuideText,
    linkUrl: 'https://elitea.ai/docs/migration/v2.0.1/loop-node-migration',
  },
};

export const DeprecatedNodes = [
  FlowEditorConstants.PipelineNodeTypes.Function,
  FlowEditorConstants.PipelineNodeTypes.Condition,
  FlowEditorConstants.PipelineNodeTypes.Pipeline,
  FlowEditorConstants.PipelineNodeTypes.Loop,
  FlowEditorConstants.PipelineNodeTypes.LoopFromTool,
  FlowEditorConstants.PipelineNodeTypes.Tool,
];

export const DeprecatedOrInvisibleNode = [
  ...DeprecatedNodes.map(nodeType => FlowEditorConstants.PipelineNodeTypeNames[nodeType]),
  FlowEditorConstants.PipelineNodeTypeNames[FlowEditorConstants.PipelineNodeTypes.End],
  FlowEditorConstants.PipelineNodeTypeNames[FlowEditorConstants.PipelineNodeTypes.Ghost],
  FlowEditorConstants.PipelineNodeTypeNames[FlowEditorConstants.PipelineNodeTypes.Default],
];
