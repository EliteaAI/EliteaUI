import { useEffect, useMemo, useRef } from 'react';

import { useIsFrom } from '@/hooks/useIsFromSpecificPageHooks';
import RouteDefinitions from '@/routes';

const CONTEXT_EXECUTION_ENTITIES = {
  AGENT: 'agent',
  PIPELINE: 'pipeline',
  TOOLKIT: 'toolkit',
  CHAT: 'chat',
  UNKNOWN: 'unknown',
};

export const useContextExecutionEntity = () => {
  const isFromAgents = useIsFrom(RouteDefinitions.Applications);
  const isFromPipelines = useIsFrom(RouteDefinitions.Pipelines);
  const isFromToolkits = useIsFrom(RouteDefinitions.Toolkits);
  const isFromChat = useIsFrom(RouteDefinitions.Chat);

  const contextExecutionValue = useMemo(() => {
    if (isFromAgents) return CONTEXT_EXECUTION_ENTITIES.AGENT;
    if (isFromPipelines) return CONTEXT_EXECUTION_ENTITIES.PIPELINE;
    if (isFromToolkits) return CONTEXT_EXECUTION_ENTITIES.TOOLKIT;
    if (isFromChat) return CONTEXT_EXECUTION_ENTITIES.CHAT;

    return CONTEXT_EXECUTION_ENTITIES.UNKNOWN;
  }, [isFromAgents, isFromChat, isFromPipelines, isFromToolkits]);

  const contextExecutionRef = useRef(contextExecutionValue);

  useEffect(() => {
    contextExecutionRef.current = contextExecutionValue;
  }, [contextExecutionValue]);

  return {
    contextExecutionEntity: contextExecutionRef.current,
  };
};
