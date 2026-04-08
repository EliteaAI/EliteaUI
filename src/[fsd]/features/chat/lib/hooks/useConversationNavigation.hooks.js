import { useCallback, useMemo } from 'react';

import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { SearchParams } from '@/common/constants';

export const useConversationNavigation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { conversationId } = useParams();

  const conversationIdFromUrl = useMemo(
    () => conversationId || searchParams.get(SearchParams.Conversation),
    [conversationId, searchParams],
  );

  const changeUrlByConversation = useCallback(
    (id, name) => {
      if (conversationIdFromUrl !== id) {
        const newSearchParams = new URLSearchParams();

        if (name) newSearchParams.append(SearchParams.Name, name);

        navigate({
          pathname: `/chat/${id}`,
          search: newSearchParams.toString(),
        });

        return;
      }

      if (name) {
        // If we're on the same conversation but need to update the name
        const newSearchParams = new URLSearchParams(searchParams);

        newSearchParams.delete(SearchParams.Name);
        newSearchParams.append(SearchParams.Name, name);

        navigate({
          pathname: `/chat/${id}`,
          search: newSearchParams.toString(),
        });
      }
    },
    [conversationIdFromUrl, navigate, searchParams],
  );

  const clearUrlConversation = useCallback(() => {
    navigate({
      pathname: '/chat',
      search: '',
    });
  }, [navigate]);

  const createNewConversation = useCallback(() => {
    const newSearchParams = new URLSearchParams();

    newSearchParams.append(SearchParams.CreateConversation, 1);
    navigate({
      pathname: '/chat',
      search: newSearchParams.toString(),
    });
  }, [navigate]);

  return {
    conversationIdFromUrl,
    changeUrlByConversation,
    clearUrlConversation,
    createNewConversation,
  };
};
