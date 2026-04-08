import { memo } from 'react';

import UserAvatar from '@/components/UserAvatar';

const VersionAuthorAvatar = memo(({ name, avatar, ...restProps }) => {
  return (
    <UserAvatar
      name={name}
      avatar={avatar}
      {...restProps}
    />
  );
});

VersionAuthorAvatar.displayName = 'VersionAuthorAvatar';

export default VersionAuthorAvatar;
