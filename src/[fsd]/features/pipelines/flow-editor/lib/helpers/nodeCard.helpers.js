import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';

import { getNodeColor } from './node.helpers.jsx';

export const getNodeCardStatus = ({ isPerforming, hasRunError } = {}) => {
  if (isPerforming) return FlowEditorConstants.NodeCardStatus.running;
  if (hasRunError) return FlowEditorConstants.NodeCardStatus.error;
  return null;
};

// Run state wins over selection; selection is ignored while a pipeline runs (as before)
const isSelectedVisible = ({ selected, isRunningPipeline }) => Boolean(selected) && !isRunningPipeline;

export const getNodeCardBorderColor = ({ status, selected, isRunningPipeline }, palette) => {
  const { border } = palette.components.flowEditor.card;

  if (status) return border[status] ?? border.default;
  return isSelectedVisible({ selected, isRunningPipeline }) ? border.selected : border.default;
};

// The running node glows like a selected one
export const getNodeCardShadow = ({ status, selected, isRunningPipeline }, palette) => {
  const { shadow } = palette.components.flowEditor.card;

  if (status === FlowEditorConstants.NodeCardStatus.running) return shadow.selected;
  return !status && isSelectedVisible({ selected, isRunningPipeline }) ? shadow.selected : shadow.default;
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
