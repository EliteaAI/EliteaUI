const USER_INVOCABLE_KEY = 'user-invocable';
const USER_INVOCABLE_META = 'user_invocable';

export const userInvocableMeta = versionDetails =>
  versionDetails?.meta?.frontmatter?.[USER_INVOCABLE_KEY] === false ? { [USER_INVOCABLE_META]: false } : {};

export const withSkillVersionInvocation = (meta, versionDetails) => ({
  ...Object.fromEntries(Object.entries(meta || {}).filter(([key]) => key !== USER_INVOCABLE_META)),
  ...userInvocableMeta(versionDetails),
});

export const isUserInvocable = item => item?.[USER_INVOCABLE_META] !== false;
