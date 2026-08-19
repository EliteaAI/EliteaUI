import { useCallback, useMemo } from 'react';

import { useMatch, useSearchParams } from 'react-router-dom';

import { SearchParams } from '@/common/constants.js';
import { useIsFrom } from '@/hooks/useIsFromSpecificPageHooks';
import RouteDefinitions from '@/routes';

export const useToolkitView = () => {
  // const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isToolkitsPage = useIsFrom(RouteDefinitions.Toolkits);
  const isMcpsPage = useIsFrom(RouteDefinitions.MCPs);
  const isChatPage = useIsFrom(RouteDefinitions.Chat);

  // For toolkit editor, use accordion view when on toolkits page OR chat page
  const shouldUseAccordionView = useMemo(
    () => isToolkitsPage || isMcpsPage || isChatPage,
    [isToolkitsPage, isMcpsPage, isChatPage],
  );

  const toolkitDetailMatch = useMatch(RouteDefinitions.ToolkitDetail);
  const mcpDetailMatch = useMatch(RouteDefinitions.MCPDetail);
  const toolkitCreateMatch = useMatch(RouteDefinitions.CreateToolkitType);
  const mcpCreateMatch = useMatch(RouteDefinitions.CreateMCPType);

  const isDetailsRoute = !!toolkitDetailMatch || !!mcpDetailMatch;
  const isCreateRoute = !!toolkitCreateMatch || !!mcpCreateMatch;

  const shouldHideConfigurationHeader = isDetailsRoute && !isCreateRoute;

  const hasSaveActionParam = useCallback(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    return newSearchParams.has(SearchParams.SaveToolkit);
  }, [searchParams]);

  return {
    isToolkitsPage,
    isChatPage,
    shouldUseAccordionView,
    shouldHideConfigurationHeader,
    hasSaveActionParam,
  };
};
