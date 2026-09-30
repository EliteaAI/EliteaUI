import { memo, useCallback, useRef } from 'react';

import { LikeButton, useApplicationLike } from '@/[fsd]/entities/like';
import { AgentHubHelpers } from '@/[fsd]/features/agent-hub/lib/helpers';
import { useAgentHubContext } from '@/[fsd]/shared/lib/context';
import { ContentType } from '@/common/constants';

const AgentHubLike = memo(props => {
  const { viewMode, type = ContentType.ApplicationAll, data, testId } = props;
  const { updateApplicationInState, addToMyLiked, removeFromMyLiked } = useAgentHubContext();

  const dataRef = useRef(data);
  dataRef.current = data;

  const updateMyLikedCategory = useCallback(
    (nextLiked, newLikesCount, applicationId) => {
      const currentData = dataRef.current;
      if (nextLiked && addToMyLiked) {
        addToMyLiked({ ...currentData, is_liked: true, likes: newLikesCount });
      } else if (!nextLiked && removeFromMyLiked) {
        removeFromMyLiked(applicationId);
      }
    },
    [addToMyLiked, removeFromMyLiked],
  );

  const handleLikeSuccess = useCallback(
    (applicationId, nextLiked, likesCount) => {
      if (updateApplicationInState) {
        const currentData = dataRef.current;
        const currentLikes = currentData?.likes || 0;
        const newLikesCount = AgentHubHelpers.calculateNewLikesCount(likesCount, nextLiked, currentLikes);

        updateApplicationInState(applicationId, nextLiked, newLikesCount);

        updateMyLikedCategory(nextLiked, newLikesCount, applicationId);
      }
    },
    [updateApplicationInState, updateMyLikedCategory],
  );

  const likeProps = useApplicationLike({
    data,
    type,
    viewMode,
    onSuccess: handleLikeSuccess,
  });

  return (
    <LikeButton
      {...likeProps}
      testId={testId}
    />
  );
});

AgentHubLike.displayName = 'AgentHubLike';

export default AgentHubLike;
