import { memo, useCallback, useMemo, useRef } from 'react';

import { LikeButton } from '@/[fsd]/entities/like';
import { useLikeSkillMutation, useUnlikeSkillMutation } from '@/[fsd]/features/skill-hub/api';
import { SkillHubHelpers } from '@/[fsd]/features/skill-hub/lib/helpers';
import { useSkillHubContext } from '@/[fsd]/shared/lib/context';
import { ViewMode } from '@/common/constants';

/**
 * Skill catalog like button. Unlike application/pipeline likes, this calls the skill social
 * like/unlike mutations directly and mirrors the optimistic update into the
 * skillHub slice + SkillHubContext.
 */
const SkillHubLike = memo(props => {
  const { viewMode = ViewMode.Public, data } = props;
  const { updateSkillInState, addToMyLiked, removeFromMyLiked } = useSkillHubContext();

  const [likeSkill, { isLoading: isLiking }] = useLikeSkillMutation();
  const [unlikeSkill, { isLoading: isUnliking }] = useUnlikeSkillMutation();

  const dataRef = useRef(data);
  dataRef.current = data;

  const id = data?.id;
  const isLiked = !!data?.is_liked;
  const likes = useMemo(() => data?.likes ?? data?.likes_count ?? 0, [data]);

  const isLoading = isLiking || isUnliking;

  const applyOptimisticUpdate = useCallback(
    nextLiked => {
      const current = dataRef.current;
      const currentLikes = current?.likes ?? current?.likes_count ?? 0;
      const newLikesCount = SkillHubHelpers.calculateNewLikesCount(0, nextLiked, currentLikes);

      updateSkillInState?.(id, {
        is_liked: nextLiked,
        likes: newLikesCount,
        likes_count: newLikesCount,
      });

      if (nextLiked) {
        addToMyLiked?.({ ...current, is_liked: true, likes: newLikesCount, likes_count: newLikesCount });
      } else {
        removeFromMyLiked?.(id);
      }
    },
    [id, updateSkillInState, addToMyLiked, removeFromMyLiked],
  );

  const handleLikeClick = useCallback(
    async event => {
      event.stopPropagation();
      event.preventDefault();

      if (!id || viewMode !== ViewMode.Public || isLoading) return;

      const nextLiked = !isLiked;
      applyOptimisticUpdate(nextLiked);

      try {
        if (nextLiked) {
          await likeSkill(id).unwrap();
        } else {
          await unlikeSkill(id).unwrap();
        }
      } catch {
        // Revert on failure.
        applyOptimisticUpdate(isLiked);
      }
    },
    [id, viewMode, isLoading, isLiked, applyOptimisticUpdate, likeSkill, unlikeSkill],
  );

  return (
    <LikeButton
      isLiked={isLiked}
      likes={likes}
      isLoading={isLoading}
      disabled={viewMode !== ViewMode.Public}
      onClick={handleLikeClick}
    />
  );
});

SkillHubLike.displayName = 'SkillHubLike';

export default SkillHubLike;
