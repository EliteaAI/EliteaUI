import { memo, useCallback, useRef } from 'react';

import { useAgentHubContext } from '@/[fsd]/app/providers';
import { AgentHubHelpers } from '@/[fsd]/features/agent-hub/lib/helpers';
import { ContentType } from '@/common/constants';
import Like from '@/components/Like';

const AgentHubLike = memo(props => {
  const { viewMode, data } = props;
  const { updateApplicationInState, addToMyLiked, removeFromMyLiked } = useAgentHubContext();

  const dataRef = useRef(data);
  dataRef.current = data;

  const updateMyLikedCategory = useCallback(
    (isLiked, newLikesCount, applicationId) => {
      const currentData = dataRef.current;
      if (isLiked && addToMyLiked) {
        addToMyLiked({ ...currentData, is_liked: true, likes: newLikesCount });
      } else if (!isLiked && removeFromMyLiked) {
        removeFromMyLiked(applicationId);
      }
    },
    [addToMyLiked, removeFromMyLiked],
  );

  const handleLikeSuccess = useCallback(
    (applicationId, isLiked, likesCount) => {
      if (updateApplicationInState) {
        const currentData = dataRef.current;
        const currentLikes = currentData?.likes || 0;
        const newLikesCount = AgentHubHelpers.calculateNewLikesCount(likesCount, isLiked, currentLikes);

        updateApplicationInState(applicationId, app => ({
          ...app,
          is_liked: isLiked,
          likes: newLikesCount,
        }));

        updateMyLikedCategory(isLiked, newLikesCount, applicationId);
      }
    },
    [updateApplicationInState, updateMyLikedCategory],
  );

  return (
    <Like
      viewMode={viewMode}
      type={ContentType.ApplicationAll}
      data={data}
      onLikeSuccess={handleLikeSuccess}
    />
  );
});

AgentHubLike.displayName = 'AgentHubLike';

export default AgentHubLike;
