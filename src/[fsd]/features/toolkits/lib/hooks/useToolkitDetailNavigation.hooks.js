import { useCallback } from 'react';

import { useMatch, useNavigate, useParams } from 'react-router-dom';

import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import RouteDefinitions from '@/routes';

const DEFAULT_TAB = 'all';

/**
 * Sub-page navigation from a toolkit or MCP detail page.
 *
 * Test and Run History each have a route per entity type, so they stay in the namespace they were
 * opened from and carry the current tab through.
 *
 * `canTest` is false wherever a Test page would have nowhere to return to: the Apps and user-public
 * detail pages share this form but live in other route namespaces, and the create routes match the
 * detail patterns because `:tab` also accepts the literal `create`.
 */
export const useToolkitDetailNavigation = ({ toolkitId, isMCP }) => {
  const navigate = useNavigate();
  const { tab } = useParams();

  const toolkitDetailMatch = useMatch(RouteDefinitions.ToolkitDetail);
  const mcpDetailMatch = useMatch(RouteDefinitions.MCPDetail);
  const toolkitCreateMatch = useMatch(RouteDefinitions.CreateToolkitType);
  const mcpCreateMatch = useMatch(RouteDefinitions.CreateMCPType);

  const canTest = Boolean((toolkitDetailMatch || mcpDetailMatch) && !toolkitCreateMatch && !mcpCreateMatch);

  const goToRunHistory = useCallback(() => {
    const route = isMCP ? RouteDefinitions.MCPRunHistory : RouteDefinitions.ToolkitRunHistory;
    navigate(
      NavigationHelpers.buildRoute(route, {
        tab: tab ?? DEFAULT_TAB,
        toolkitId,
        mcpId: toolkitId,
      }),
    );
  }, [isMCP, navigate, tab, toolkitId]);

  const goToTest = useCallback(() => {
    const route = isMCP ? RouteDefinitions.MCPTest : RouteDefinitions.ToolkitTest;
    navigate(
      NavigationHelpers.buildRoute(route, {
        tab: tab ?? DEFAULT_TAB,
        toolkitId,
        mcpId: toolkitId,
      }),
    );
  }, [isMCP, navigate, tab, toolkitId]);

  return { goToRunHistory, goToTest: canTest ? goToTest : undefined };
};
