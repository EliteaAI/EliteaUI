import { memo, useCallback, useMemo, useRef } from 'react';

import { IconButton, Typography } from '@mui/material';

import { useSkillHubContext } from '@/[fsd]/app/providers';
import { useLikeSkillMutation, useUnlikeSkillMutation } from '@/[fsd]/features/skill-hub/api';
import { SkillHubHelpers } from '@/[fsd]/features/skill-hub/lib/helpers';
import { ViewMode } from '@/common/constants';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import HeartActiveIcon from '@/components/Icons/HeartActiveIcon';
import HeartIcon from '@/components/Icons/HeartIcon';

/**
 * Skill catalog like button. Unlike the shared Like component (whose click
 * handler only routes application/pipeline cards), this calls the skill social
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

  const styles = skillHubLikeStyles();

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
    <IconButton
      variant="elitea"
      color="tertiaryCount"
      disabled={viewMode !== ViewMode.Public || isLoading}
      onClick={handleLikeClick}
    >
      {isLiked ? <HeartActiveIcon width={16} /> : <HeartIcon sx={styles.icon} />}
      <Typography variant="bodySmall">{likes || 0}</Typography>
      {isLoading && <StyledCircleProgress size={20} />}
    </IconButton>
  );
});

SkillHubLike.displayName = 'SkillHubLike';

/** @type {MuiSx} */
const skillHubLikeStyles = () => ({
  icon: { fontSize: '1rem' },
});

export default SkillHubLike;
