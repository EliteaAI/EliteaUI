import RouteDefinitions, { PathSessionMap } from '@/routes';

/**
 * Breadcrumb trail declarations keyed by route pattern — a page joins the trail by adding one entry here.
 * `fallbackLabel` applies only while its crumb is the current one; an ancestor whose label cannot be
 * resolved yet is hidden together with its separator, preserving how the per-page breadcrumbs behaved.
 */
export const BREADCRUMB_REGISTRY = {
  [RouteDefinitions.ToolkitsWithTab]: { label: PathSessionMap[RouteDefinitions.Toolkits] },
  [RouteDefinitions.MCPsWithTab]: { label: 'MCPs' },

  [RouteDefinitions.ToolkitDetail]: {
    parent: RouteDefinitions.ToolkitsWithTab,
    entityName: true,
    fallbackLabel: 'Edit Toolkit',
    testId: 'toolkit-detail-title',
  },
  [RouteDefinitions.ToolkitRunHistory]: {
    parent: RouteDefinitions.ToolkitDetail,
    label: 'Run History',
  },
  [RouteDefinitions.ToolkitTest]: {
    parent: RouteDefinitions.ToolkitDetail,
    label: 'Test Toolkit',
  },
  [RouteDefinitions.ToolkitIndexNew]: {
    parent: RouteDefinitions.ToolkitDetail,
    label: 'New Index',
  },
  [RouteDefinitions.ToolkitIndex]: {
    parent: RouteDefinitions.ToolkitDetail,
    getLabel: params => params.indexName ?? '',
    fallbackLabel: 'Index',
  },
  [RouteDefinitions.ToolkitIndexHistory]: {
    parent: RouteDefinitions.ToolkitIndex,
    label: 'History',
  },
  [RouteDefinitions.ToolkitIndexSearch]: {
    parent: RouteDefinitions.ToolkitIndex,
    label: 'Search',
  },

  [RouteDefinitions.MCPDetail]: {
    parent: RouteDefinitions.MCPsWithTab,
    entityName: true,
    fallbackLabel: 'Edit MCP',
    testId: 'toolkit-detail-title',
  },
  [RouteDefinitions.MCPRunHistory]: {
    parent: RouteDefinitions.MCPDetail,
    label: 'Run History',
  },
  [RouteDefinitions.MCPTest]: {
    parent: RouteDefinitions.MCPDetail,
    label: 'Test MCP',
  },
  [RouteDefinitions.ApplicationsWithTab]: { label: PathSessionMap[RouteDefinitions.Applications] },
  [RouteDefinitions.CreateApplication]: { parent: RouteDefinitions.ApplicationsWithTab, label: 'New Agent' },
  [RouteDefinitions.ApplicationsDetail]: {
    parent: RouteDefinitions.ApplicationsWithTab,
    entityName: true,
    fallbackLabel: 'Edit Agent',
    testId: 'agent-detail-title',
  },
  [RouteDefinitions.ApplicationsEvaluate]: {
    parent: RouteDefinitions.ApplicationsDetail,
    label: 'Evaluation',
  },

  [RouteDefinitions.SkillsWithTab]: { label: PathSessionMap[RouteDefinitions.Skills] },
  [RouteDefinitions.CreateSkill]: { parent: RouteDefinitions.SkillsWithTab, label: 'New Skill' },
  [RouteDefinitions.SkillsDetail]: {
    parent: RouteDefinitions.SkillsWithTab,
    entityName: true,
    fallbackLabel: 'Edit Skill',
    testId: 'skill-detail-title',
  },

  [RouteDefinitions.PipelinesWithTab]: { label: PathSessionMap[RouteDefinitions.Pipelines] },
  [RouteDefinitions.CreatePipeline]: { parent: RouteDefinitions.PipelinesWithTab, label: 'New Pipeline' },
  [RouteDefinitions.PipelineDetail]: {
    parent: RouteDefinitions.PipelinesWithTab,
    entityName: true,
    fallbackLabel: 'Edit Pipeline',
    testId: 'pipeline-detail-title',
  },
};
