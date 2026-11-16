import { useMatch } from 'react-router-dom';

import RouteDefinitions from '@/routes';

const AGENT_ROUTES = {
  evaluate: RouteDefinitions.ApplicationsEvaluate,
  suite: RouteDefinitions.ApplicationsEvaluateSuite,
  datasets: RouteDefinitions.ApplicationsEvaluateDatasets,
  dimensions: RouteDefinitions.ApplicationsEvaluateDimensions,
  history: RouteDefinitions.ApplicationsEvaluateHistory,
  historyAnalytics: RouteDefinitions.ApplicationsEvaluateHistoryAnalytics,
};

const PIPELINE_ROUTES = {
  evaluate: RouteDefinitions.PipelineEvaluate,
  suite: RouteDefinitions.PipelineEvaluateSuite,
  datasets: RouteDefinitions.PipelineEvaluateDatasets,
  dimensions: RouteDefinitions.PipelineEvaluateDimensions,
  history: RouteDefinitions.PipelineEvaluateHistory,
  historyAnalytics: RouteDefinitions.PipelineEvaluateHistoryAnalytics,
};

// Built once, so a caller that depends on the returned object doesn't re-run on every render
const AGENT_EVAL_ROUTES = { ...AGENT_ROUTES, isPipeline: false };
const PIPELINE_EVAL_ROUTES = { ...PIPELINE_ROUTES, isPipeline: true };

/**
 * The evaluation screens serve agents and pipelines alike; this picks the route set of the section
 * the user came from, so every link inside the screens stays under /agents or /pipelines.
 * `isPipeline` tells the screens which of the two they are on.
 */
export const useEvalRoutes = () => {
  const isPipeline = !!useMatch({ path: `${RouteDefinitions.PipelineEvaluate}/*` });

  return isPipeline ? PIPELINE_EVAL_ROUTES : AGENT_EVAL_ROUTES;
};
