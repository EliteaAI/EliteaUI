import { useCallback } from 'react';

import { useLikeApplicationCard } from '@/[fsd]/shared/lib/hooks';
import { isApplicationCard, isPipelineCard } from '@/common/checkCardType';
import { ContentType, ViewMode } from '@/common/constants';

export const useApplicationLike = ({ data, type = ContentType.ApplicationAll, viewMode, onSuccess }) => {
  const { id, name, likes = 0, is_liked: isLiked = false, cardType } = data;
  const { handleLikeApplicationClick, isLoading } = useLikeApplicationCard({
    id,
    name,
    is_liked: isLiked,
    type,
    viewMode,
    onSuccess,
  });

  const handleLikeClick = useCallback(
    event => {
      event.stopPropagation();
      event.preventDefault();

      if (isApplicationCard(cardType || type) || isPipelineCard(cardType || type)) {
        handleLikeApplicationClick();
      }
    },
    [cardType, handleLikeApplicationClick, type],
  );

  return {
    isLiked,
    likes,
    isLoading,
    disabled: viewMode !== ViewMode.Public,
    onClick: handleLikeClick,
  };
};
