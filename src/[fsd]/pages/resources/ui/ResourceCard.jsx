import { memo } from 'react';

import { Box, Divider, Typography } from '@mui/material';

import { GradientIconWrapper } from '@/[fsd]/shared/ui/icon';
import FileIcon from '@/assets/file.svg?react';
import RocketIcon from '@/assets/rocket-icon.svg?react';
import TutorialsIcon from '@/assets/tutorials-icon.svg?react';
import VideoIcon from '@/assets/video-icon.svg?react';
import { getCardGradientStyles } from '@/utils/cardStyles';

export const RESOURCE_CARD_CONFIGS = [
  {
    enabledKey: 'resources_documentation_enabled',
    titleKey: 'resources_documentation_title',
    descriptionKey: 'resources_documentation_description',
    defaultTitle: 'Documentation',
    defaultDescription: 'API reference, guides, and platform concepts',
    Icon: FileIcon,
    linksKey: 'resources_documentation_links',
  },
  {
    enabledKey: 'resources_release_notes_enabled',
    titleKey: 'resources_release_notes_title',
    descriptionKey: 'resources_release_notes_description',
    defaultTitle: 'Release Notes',
    defaultDescription: 'Product updates, improvements, and fixes',
    Icon: RocketIcon,
    linksKey: 'resources_release_notes_links',
  },
  {
    enabledKey: 'resources_video_library_enabled',
    titleKey: 'resources_video_library_title',
    descriptionKey: 'resources_video_library_description',
    defaultTitle: 'Video Library',
    defaultDescription: 'Product walkthroughs and recorded sessions',
    Icon: VideoIcon,
    linksKey: 'resources_video_library_links',
  },
  {
    enabledKey: 'resources_tutorials_enabled',
    titleKey: 'resources_tutorials_title',
    descriptionKey: 'resources_tutorials_description',
    defaultTitle: 'Tutorials',
    defaultDescription: 'Step-by-step guides and use cases',
    Icon: TutorialsIcon,
    linksKey: 'resources_tutorials_links',
  },
];

const ResourceCard = memo(props => {
  const { title, description, icon, children } = props;
  const styles = resourceCardStyles();

  return (
    <Box sx={styles.card}>
      <Box sx={styles.cardHeader}>
        <GradientIconWrapper>{icon}</GradientIconWrapper>
        <Box sx={styles.headerText}>
          <Typography
            variant="bodyMediumBold"
            color="text.secondary"
          >
            {title}
          </Typography>
          <Typography
            variant="bodySmall"
            color="text.primary"
          >
            {description}
          </Typography>
        </Box>
      </Box>
      <Divider sx={styles.divider} />
      <Box sx={styles.body}>{children}</Box>
    </Box>
  );
});

ResourceCard.displayName = 'ResourceCard';

/** @type {MuiSx} */
const resourceCardStyles = () => ({
  card: ({ palette }) => ({
    ...getCardGradientStyles(palette, { enableHover: false }),
    display: 'flex',
    flexDirection: 'column',
    minWidth: '23.75rem',
    minHeight: '14.25rem',
    overflow: 'hidden',
  }),
  cardHeader: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '1rem',
    px: '1rem',
    py: '0.75rem',
    border: `0.0625rem solid ${palette.border.cardsOutlines}`,
  }),
  headerText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    flex: 1,
  },
  divider: ({ palette }) => ({
    borderColor: palette.border.cardsOutlines,
  }),
  body: ({ spacing }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: spacing(1),
    px: '1.5rem',
    py: '0.75rem',
    flex: 1,
  }),
});

export default ResourceCard;
