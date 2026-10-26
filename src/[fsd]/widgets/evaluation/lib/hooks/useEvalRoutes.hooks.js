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

/**
 * The evaluation screens serve agents and pipelines alike; this picks the route set of the section
 * the user came from, so every link inside the screens stays under /agents or /pipelines.
 */
export const useEvalRoutes = () => {
  const isPipeline = useMatch({ path: `${RouteDefinitions.PipelineEvaluate}/*` });

  return isPipeline ? PIPELINE_ROUTES : AGENT_ROUTES;
};
