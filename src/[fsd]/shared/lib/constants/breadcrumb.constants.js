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
    label: 'New index',
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

  [RouteDefinitions.MCPDetail]: {
    parent: RouteDefinitions.MCPsWithTab,
    entityName: true,
    fallbackLabel: 'Edit MCP',
    testId: 'toolkit-detail-title',
  },
  [RouteDefinitions.MCPTest]: {
    parent: RouteDefinitions.MCPDetail,
    label: 'Test MCP',
  },
};
