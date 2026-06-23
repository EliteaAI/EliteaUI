import { memo } from 'react';

import { Box, Link, Skeleton, Typography } from '@mui/material';

import { RESOURCES_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants/resourcesTourTargets.constants';
import { LinkHelpers } from '@/[fsd]/shared/lib/helpers';
import { useGetResourcesConfigQuery, useGetSystemInfoQuery } from '@/api/resources';
import FileIcon from '@/assets/file.svg?react';
import RocketIcon from '@/assets/rocket-icon.svg?react';
import TutorialsIcon from '@/assets/tutorials-icon.svg?react';
import VideoIcon from '@/assets/video-icon.svg?react';

import ResourceCard from './ui/ResourceCard';
import ResourceVersionInfo from './ui/ResourceVersionInfo';

const RESOURCE_CARD_CONFIGS = [
  {
    enabledKey: 'resources_documentation_enabled',
    titleKey: 'resources_documentation_title',
    descriptionKey: 'resources_documentation_description',
    defaultTitle: 'Documentation',
    defaultDescription: 'API reference, guides, and platform concepts',
    Icon: FileIcon,
    linksKey: 'resources_documentation_links',
    colorScheme: 'blue',
    tourTargetId: RESOURCES_TOUR_TARGET_IDS.documentationCard,
  },
  {
    enabledKey: 'resources_release_notes_enabled',
    titleKey: 'resources_release_notes_title',
    descriptionKey: 'resources_release_notes_description',
    defaultTitle: 'Release Notes',
    defaultDescription: 'Product updates, improvements, and fixes',
    Icon: RocketIcon,
    linksKey: 'resources_release_notes_links',
    colorScheme: 'orange',
    tourTargetId: RESOURCES_TOUR_TARGET_IDS.releaseNotesCard,
  },
  {
    enabledKey: 'resources_video_library_enabled',
    titleKey: 'resources_video_library_title',
    descriptionKey: 'resources_video_library_description',
    defaultTitle: 'Video Library',
    defaultDescription: 'Product walkthroughs and recorded sessions',
    Icon: VideoIcon,
    linksKey: 'resources_video_library_links',
    colorScheme: 'purple',
    tourTargetId: RESOURCES_TOUR_TARGET_IDS.videoLibraryCard,
  },
  {
    enabledKey: 'resources_tutorials_enabled',
    titleKey: 'resources_tutorials_title',
    descriptionKey: 'resources_tutorials_description',
    defaultTitle: 'Tutorials',
    defaultDescription: 'Step-by-step guides and use cases',
    Icon: TutorialsIcon,
    linksKey: 'resources_tutorials_links',
    colorScheme: 'green',
    tourTargetId: RESOURCES_TOUR_TARGET_IDS.tutorialsCard,
  },
  {
    enabledKey: 'resources_interactive_tours_enabled',
    titleKey: 'resources_interactive_tours_title',
    descriptionKey: 'resources_interactive_tours_description',
    defaultTitle: 'Interactive Tours',
    defaultDescription: 'Guided tours to explore key features and workflows',
    Icon: VideoIcon,
    linksKey: 'resources_interactive_tours_links',
    colorScheme: 'pink',
    tourTargetId: RESOURCES_TOUR_TARGET_IDS.interactiveToursCard,
  },
];

const { openExternalLink } = LinkHelpers;

const ResourcesPage = memo(() => {
  const { data: systemInfo, isLoading: isSystemInfoLoading } = useGetSystemInfoQuery();
  const { data: resourcesConfig, isLoading: isConfigLoading } = useGetResourcesConfigQuery();

  const configValues = resourcesConfig?.values ?? {};
  const styles = resourcesPageStyles();

  return (
    <Box
      data-tour={RESOURCES_TOUR_TARGET_IDS.page}
      sx={styles.page}
    >
      <ResourceVersionInfo
        configValues={configValues}
        isConfigLoading={isConfigLoading}
        systemInfo={systemInfo}
        isSystemInfoLoading={isSystemInfoLoading}
      />

      <Box sx={styles.content}>
        <Box sx={styles.intro}>
          <Typography variant="headingLarge">Explore Help Center</Typography>
          <Typography variant="bodyMedium">
            Guides, documentation, and release notes to support your work.
          </Typography>
        </Box>
        <Box sx={styles.grid}>
          {RESOURCE_CARD_CONFIGS.filter(config => configValues[config.enabledKey] !== false).map(config => {
            const links = configValues[config.linksKey];
            const hasLinks = Array.isArray(links) && links.length > 0;

            return (
              <ResourceCard
                key={config.enabledKey}
                title={configValues[config.titleKey] || config.defaultTitle}
                description={configValues[config.descriptionKey] || config.defaultDescription}
                colorScheme={config.colorScheme}
                tourTargetId={config.tourTargetId}
                icon={
                  <config.Icon
                    width="1.5rem"
                    height="1.5rem"
                  />
                }
              >
                {isConfigLoading && (
                  <>
                    <Skeleton
                      variant="text"
                      width="70%"
                    />
                    <Skeleton
                      variant="text"
                      width="55%"
                    />
                    <Skeleton
                      variant="text"
                      width="65%"
                    />
                  </>
                )}
                {!isConfigLoading &&
                  hasLinks &&
                  links.map((link, idx) =>
                    link.url ? (
                      <Link
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={openExternalLink}
                        underline="always"
                        sx={styles.link}
                        variant="bodyMedium"
                      >
                        {link.title}
                      </Link>
                    ) : (
                      <Typography
                        key={idx}
                        variant="bodyMedium"
                        sx={styles.linkUndefined}
                      >
                        {link.title} (undefined)
                      </Typography>
                    ),
                  )}
                {!isConfigLoading && !hasLinks && (
                  <Typography
                    variant="bodySmall"
                    color="text.disabled"
                  >
                    No links configured
                  </Typography>
                )}
              </ResourceCard>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
});

ResourcesPage.displayName = 'ResourcesPage';

/** @type {MuiSx} */
const resourcesPageStyles = () => ({
  page: ({ palette }) => ({
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: palette.background.tabPanel,
  }),
  content: ({ spacing }) => ({
    flex: 1,
    overflowY: 'auto',
    px: spacing(3),
    py: spacing(2),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: spacing(2),
  }),
  intro: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    textAlign: 'center',
    py: '1rem',
    color: palette.text.secondary,
    width: '100%',
  }),
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(23.75rem, 31.25rem))',
    gap: '1rem',
    justifyContent: 'center',
  },
  link: ({ palette }) => ({
    color: palette.text.metrics,
    cursor: 'pointer',
    alignSelf: 'flex-start',
    textDecorationColor: 'currentColor',
    '&:hover': {
      color: palette.primary.main,
    },
  }),
  linkUndefined: ({ palette }) => ({
    color: palette.text.disabled,
    display: 'block',
    fontStyle: 'italic',
  }),
});

export default ResourcesPage;
