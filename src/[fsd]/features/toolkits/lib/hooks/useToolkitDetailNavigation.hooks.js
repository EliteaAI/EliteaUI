import { useCallback } from 'react';

import { useMatch, useNavigate, useParams } from 'react-router-dom';

import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import RouteDefinitions from '@/routes';

const DEFAULT_TAB = 'all';

/**
 * Sub-page navigation from a toolkit or MCP detail page.
 *
 * Test has a route per entity type, so it stays in the namespace it was opened from and can carry the
 * current tab through. Run History has only the toolkit route and MCPs reach it via `?isMCP`; an MCP
 * tab is not necessarily a valid toolkit tab, so that one keeps falling back to the default.
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
    const target = NavigationHelpers.buildRoute(RouteDefinitions.ToolkitRunHistory, {
      tab: DEFAULT_TAB,
      toolkitId,
    });
    navigate(`${target}?isMCP=${!!isMCP}`);
  }, [isMCP, navigate, toolkitId]);

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
