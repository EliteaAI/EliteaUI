import { useCallback, useMemo } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { NotificationType, SearchParams } from '@/common/constants';
import RouteDefinitions from '@/routes';

const useNotificationNavigate = ({ viewMode, id, event_type, name, replace = false, indexName }) => {
  const { state } = useLocation();
  const { routeStack = [] } = useMemo(() => state || { routeStack: [] }, [state]);
  const navigate = useNavigate();
  const doNavigate = useCallback(() => {
    // const query = `?${SearchParams.ViewMode}=${viewMode}&${SearchParams.Name}=${encodeURIComponent(name)}`;
    const urlMap = {
      // [NotificationType.PromptModeratorApproval]:
      //   `${RouteDefinitions.Prompts}/latest/${id}/${encodeURIComponent(version_name)}`,
      // [NotificationType.PromptModeratorReject]:
      //   `${RouteDefinitions.Prompts}/all/${id}/${encodeURIComponent(version_name)}`,
      [NotificationType.ChatUserAdded]: `${RouteDefinitions.Chat}`,
      [NotificationType.IndexDataChanged]: RouteDefinitions.ToolkitDetail.replace(':tab', 'indexes').replace(
        ':toolkitId',
        id,
      ),
    };
    const searchMap = {
      // [NotificationType.PromptModeratorApproval]: query,
      // [NotificationType.PromptModeratorReject]: query,
      [NotificationType.ChatUserAdded]: `?${SearchParams.Conversation}=${id}`,
      [NotificationType.IndexDataChanged]: indexName
        ? `?${SearchParams.IndexName}=${encodeURIComponent(indexName)}`
        : '',
    };
    const newRouteStack = [...routeStack];
    const pagePath = `${urlMap[event_type]}${searchMap[event_type]}`;
    if (replace) {
      newRouteStack.splice(routeStack.length - 1, 1, {
        breadCrumb: name,
        viewMode,
        pagePath,
      });
    } else {
      newRouteStack.push({
        breadCrumb: name,
        viewMode,
        pagePath,
      });
    }
    navigate(
      {
        pathname: urlMap[event_type],
        search: searchMap[event_type],
      },
      {
        replace,
        state: {
          routeStack: newRouteStack,
        },
      },
    );
  }, [viewMode, name, id, routeStack, event_type, replace, navigate, indexName]);
  return doNavigate;
};

export default useNotificationNavigate;
