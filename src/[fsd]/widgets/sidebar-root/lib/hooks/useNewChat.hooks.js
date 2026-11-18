import { useCallback, useMemo } from 'react';

import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { useDisablePersonalSpace } from '@/[fsd]/widgets/sidebar-root/lib/hooks/useDisablePersonalSpace.hooks';
import { PERMISSIONS, SearchParams, ViewMode } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';
import RouteDefinitions from '@/routes';

const REPLACE_PAGE_PATTERNS = [
  /\/agents\/\d+/,
  /\/pipelines\/\d+/,
  /\/toolkits\/\d+/,
  /\/credentials\/edit\/\d+/,
];

export const useNewChat = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { checkPermission } = useCheckPermission();
  const { shouldDisablePersonalSpace } = useDisablePersonalSpace();
  const isCreatingNewConversation = useSelector(state => state.chat.isCreatingNewConversation);

  const canCreateChat = useMemo(
    () => checkPermission(PERMISSIONS.chat.folders.create) || checkPermission(PERMISSIONS.chat.create),
    [checkPermission],
  );

  const isDisabled = shouldDisablePersonalSpace || !canCreateChat || !!isCreatingNewConversation;

  const createNewChat = useCallback(() => {
    // Detail and create pages are replaced, as the create button did, so Back does not reopen them
    const replace =
      pathname.includes('/create') || REPLACE_PAGE_PATTERNS.some(pattern => pattern.test(pathname));

    navigate(
      { pathname: RouteDefinitions.Chat, search: `${SearchParams.CreateConversation}=1` },
      {
        replace,
        state: {
          routeStack: [{ breadCrumb: 'Chat', viewMode: ViewMode.Owner, pagePath: RouteDefinitions.Chat }],
        },
      },
    );
  }, [navigate, pathname]);

  return { createNewChat, isDisabled };
};
