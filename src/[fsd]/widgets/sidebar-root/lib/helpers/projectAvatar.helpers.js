import { PROJECT_AVATAR_COLORS } from '@/[fsd]/widgets/sidebar-root/lib/constants/projectAvatar.constants';

const DEFAULT_COLOR = '#757575';

export const getProjectAvatarColor = projectName => {
  const letter = (projectName || '')[0]?.toUpperCase();
  if (!letter) return DEFAULT_COLOR;
  const group = PROJECT_AVATAR_COLORS.find(g => g.letters.includes(letter));
  return group?.color ?? DEFAULT_COLOR;
};
