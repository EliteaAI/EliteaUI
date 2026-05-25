import { buildTourSelector } from '../helpers/tourSelector.helpers';

export const PIPELINE_TOUR_TARGET_IDS = {
  workspace: 'pipeline-workspace',
  flowDesigner: 'pipeline-flow-designer',
  yamlEditor: 'pipeline-yaml-editor',
  nodes: 'pipeline-nodes',
  state: 'pipeline-state',
};

export const PIPELINE_TOUR_TARGETS = {
  workspace: buildTourSelector(PIPELINE_TOUR_TARGET_IDS.workspace),
  flowDesigner: buildTourSelector(PIPELINE_TOUR_TARGET_IDS.flowDesigner),
  yamlEditor: buildTourSelector(PIPELINE_TOUR_TARGET_IDS.yamlEditor),
  nodes: buildTourSelector(PIPELINE_TOUR_TARGET_IDS.nodes),
  state: buildTourSelector(PIPELINE_TOUR_TARGET_IDS.state),
};
