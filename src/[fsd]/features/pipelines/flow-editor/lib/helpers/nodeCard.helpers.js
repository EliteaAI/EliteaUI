import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';

import { getNodeColor } from './node.helpers.jsx';

export const getNodeCardStatus = ({ isPerforming, hasRunError, hasConfigIssues } = {}) => {
  if (isPerforming) return FlowEditorConstants.NodeCardStatus.running;
  if (hasRunError) return FlowEditorConstants.NodeCardStatus.error;
  if (hasConfigIssues) return FlowEditorConstants.NodeCardStatus.needsConfiguration;
  return null;
};

// Run state wins over selection; selection is ignored while a pipeline runs (as before)
const isSelectedVisible = ({ selected, isRunningPipeline }) => Boolean(selected) && !isRunningPipeline;

const isRunStatus = status =>
  status === FlowEditorConstants.NodeCardStatus.running ||
  status === FlowEditorConstants.NodeCardStatus.error;

// Selection outranks "needs configuration" so the user still sees which card is selected
export const getNodeCardBorderColor = ({ status, selected, isRunningPipeline }, palette) => {
  const { border } = palette.components.flowEditor.card;

  if (isRunStatus(status)) return border[status];
  if (isSelectedVisible({ selected, isRunningPipeline })) return border.selected;
  return status ? (border[status] ?? border.default) : border.default;
};

// The running node glows like a selected one
export const getNodeCardShadow = ({ status, selected, isRunningPipeline }, palette) => {
  const { shadow } = palette.components.flowEditor.card;

  if (status === FlowEditorConstants.NodeCardStatus.running) return shadow.selected;
  return !isRunStatus(status) && isSelectedVisible({ selected, isRunningPipeline })
    ? shadow.selected
    : shadow.default;
};

// Hover styling only applies to a card in its resting state
export const hasNodeCardHover = ({ status, selected, isRunningPipeline }) =>
  !status && !isSelectedVisible({ selected, isRunningPipeline });

export const isMiniCardZoom = zoom => zoom < FlowEditorConstants.MINI_CARD_ZOOM;

/**
 * Mini cards (zoom < 60%) are only a view: layout, placement and the saved pipeline_settings
 * must keep the full card sizes. Nodes never measured at full size drop `measured`,
 * so consumers fall back to their type-based defaults.
 */
export const withFullNodeSizes = (nodes, fullSizes = {}) =>
  nodes.map(node => ({ ...node, measured: fullSizes[node.id] }));

export const getNodeCardHeaderColor = (type, theme) =>
  theme?.palette?.components?.flowEditor?.nodeTypeIcon?.background?.[type] ?? getNodeColor(type, theme);
