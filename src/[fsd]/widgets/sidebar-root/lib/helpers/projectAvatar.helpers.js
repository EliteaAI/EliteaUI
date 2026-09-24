import { PROJECT_AVATAR_COLORS, PROJECT_AVATAR_DEFAULT_COLOR } from '@/[fsd]/shared/config/theme';

export const getProjectAvatarColor = projectName => {
  const letter = (projectName || '')[0]?.toUpperCase();
  if (!letter) return PROJECT_AVATAR_DEFAULT_COLOR;
  const group = PROJECT_AVATAR_COLORS.find(g => g.letters.includes(letter));
  return group?.color ?? PROJECT_AVATAR_DEFAULT_COLOR;
};
