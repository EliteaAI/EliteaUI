import UserAvatar from '@/components/UserAvatar';

export function VersionAuthorAvatar({ name, avatar, ...restProps }) {
  return (
    <UserAvatar
      name={name}
      avatar={avatar}
      {...restProps}
    />
  );
}
