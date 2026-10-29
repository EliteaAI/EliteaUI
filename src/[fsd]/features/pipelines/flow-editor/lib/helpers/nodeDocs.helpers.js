import { DeprecatedTips } from '@/[fsd]/features/pipelines/flow-editor/lib/constants/deprecated.constants';
import {
  PipelineNodeDisplayNames,
  PipelineNodeTypes,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants/flowEditor.constants';
import {
  CUSTOM_NODE_DOCS_URL,
  MIGRATION_GUIDE_TOOLTIP,
  NODE_DOCS_URLS,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants/nodeDocs.constants';

export const getNodeDocsLink = type => {
  const migrationGuideUrl = DeprecatedTips[type]?.linkUrl;
  if (migrationGuideUrl) return { url: migrationGuideUrl, tooltip: MIGRATION_GUIDE_TOOLTIP };

  const url = type === PipelineNodeTypes.Custom ? CUSTOM_NODE_DOCS_URL : NODE_DOCS_URLS[type];
  if (!url) return null;

  return { url, tooltip: `Open ${PipelineNodeDisplayNames[type] || type} node documentation` };
};
