import { useCallback, useEffect, useState } from 'react';

import Tooltip from '@/ComponentsLib/Tooltip';
import { useNavigateToAuthorPublicPage } from '@/[fsd]/shared/lib/hooks';
import { useForkedFromApplicationDetailsQuery } from '@/api/applications';
import { ViewMode } from '@/common/constants';
import UserAvatar from '@/components/UserAvatar';

export function ForkedVersionAuthorAvatar({
  forkedEntityId,
  forkedProjectId,
  forkedEntityType,
  ...restProps
}) {
  const { navigateToAuthorPublicPage } = useNavigateToAuthorPublicPage();
  const [entityDetails, setEntityDetails] = useState({});
  const applicationDetails = useForkedFromApplicationDetailsQuery(
    { projectId: forkedProjectId, applicationId: forkedEntityId },
    { skip: !forkedProjectId || !forkedEntityId || forkedEntityType !== 'agent' },
  );

  const updateEntityDetails = useCallback(
    (entityType, entityData) => {
      if (entityType === forkedEntityType && !entityData.isFetching && entityData.data) {
        setEntityDetails(entityData.data);
      }
    },
    [forkedEntityType],
  );

  useEffect(() => {
    updateEntityDetails('agent', applicationDetails);
  }, [forkedEntityType, updateEntityDetails, applicationDetails]);

  const author = entityDetails?.version_details?.author || {};
  const { id: authorId = '', name: authorName = '', avatar: authorAvatar = '' } = author;

  const handleAvatarClick = navigateToAuthorPublicPage(authorId, authorName, ViewMode.Public);

  return (
    <Tooltip
      title={authorName}
      placement="top"
    >
      <div style={{ cursor: 'pointer' }}>
        <UserAvatar
          onClick={handleAvatarClick}
          name={authorName}
          avatar={authorAvatar}
          {...restProps}
        />
      </div>
    </Tooltip>
  );
}
