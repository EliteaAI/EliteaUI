import { memo, useCallback, useMemo } from 'react';

import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';
import { BreadcrumbsOrTitle } from '@/[fsd]/shared/ui';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import RouteDefinitions from '@/routes';

import { useEvalSuitesQuery } from '../../api';
import { buildSuiteMenuItems, resolveActiveSuiteId } from '../../lib/helpers';

const MENU_HEADER = 'Navigate to...';
const PREVIOUS_BADGE = 'Previous';

/**
 * Breadcrumbs for every evaluation screen. On a child page such as Manage Datasets the
 * `Evaluation (Beta)` crumb opens the agent's suites instead of navigating up, so the user gets back
 * to the suite they came from without a back button or a bent crumb hierarchy. On the evaluation and
 * suite screens that crumb is the current one, so it stays plain text and the menu never opens.
 */
const EvaluationBreadcrumbs = memo(props => {
  const { title } = props;
  const { agentId, tab } = useParams();
  const [searchParams] = useSearchParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const projectId = useSelectedProjectId();

  const applicationId = useMemo(() => (agentId ? parseInt(agentId, 10) : null), [agentId]);

  const { data: suites = [], isLoading } = useEvalSuitesQuery(
    { projectId, applicationId },
    { skip: !projectId || !applicationId },
  );

  const activeSuiteId = useMemo(() => resolveActiveSuiteId(searchParams), [searchParams]);

  const items = useMemo(
    () => buildSuiteMenuItems(suites, activeSuiteId, PREVIOUS_BADGE),
    [suites, activeSuiteId],
  );

  const handleSelectSuite = useCallback(
    item => {
      const pathname = NavigationHelpers.buildRoute(RouteDefinitions.ApplicationsEvaluateSuite, {
        tab,
        agentId,
        suiteId: item.id,
      });
      navigate({ pathname, search: NavigationHelpers.pickPersistentSearch(search) });
    },
    [navigate, tab, agentId, search],
  );

  const menus = useMemo(
    () => ({
      [RouteDefinitions.ApplicationsEvaluate]: {
        items,
        activeId: activeSuiteId,
        onSelect: handleSelectSuite,
        header: MENU_HEADER,
        emptyLabel: 'No suites created yet',
        isLoading,
      },
    }),
    [items, activeSuiteId, handleSelectSuite, isLoading],
  );

  return (
    <BreadcrumbsOrTitle
      title={title}
      menus={menus}
    />
  );
});

EvaluationBreadcrumbs.displayName = 'EvaluationBreadcrumbs';

export default EvaluationBreadcrumbs;
