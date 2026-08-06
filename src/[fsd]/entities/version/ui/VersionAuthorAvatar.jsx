import { memo } from 'react';

import UserAvatar from '@/components/UserAvatar';

const VersionAuthorAvatar = memo(props => {
  const { name, avatar, ...restProps } = props;
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
