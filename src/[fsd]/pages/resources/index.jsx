import { memo, useCallback, useMemo } from 'react';

import { Box, Link, Skeleton, Tooltip, Typography, useTheme } from '@mui/material';

import { RESOURCES_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants/resourcesTourTargets.constants';
import { LinkHelpers } from '@/[fsd]/shared/lib/helpers';
import { BaseBtn } from '@/[fsd]/shared/ui/button';
import { useGetResourcesConfigQuery, useGetSystemInfoQuery } from '@/api/resources';
import FileIcon from '@/assets/file.svg?react';
import InfoIcon from '@/assets/info.svg?react';
import RocketIcon from '@/assets/rocket-icon.svg?react';
import TutorialsIcon from '@/assets/tutorials-icon.svg?react';
import VideoIcon from '@/assets/video-icon.svg?react';
import CopyIcon from '@/components/Icons/CopyIcon';
import useToast from '@/hooks/useToast';

import ResourceCard from './ui/ResourceCard';

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
  const { toastInfo } = useToast();
  const theme = useTheme();

  const configValues = resourcesConfig?.values ?? {};
  const styles = resourcesPageStyles();

  const plugins = useMemo(() => systemInfo?.plugins ?? [], [systemInfo?.plugins]);

  const versionLabel = useMemo(() => {
    const version = configValues.resources_information_version;
    const date = configValues.resources_information_upgrade_date;
    if (!version && !date) return null;
    const parts = [version && `Version: ${version}`, date && `(${date})`].filter(Boolean);
    return parts.join(' ');
  }, [configValues.resources_information_version, configValues.resources_information_upgrade_date]);

  const onCopyToClipboard = useCallback(async () => {
    if (!systemInfo) return;
    try {
      const version = configValues.resources_information_version;
      const date = configValues.resources_information_upgrade_date;
      const versionInfo = version ? `Version: ${version}${date ? ` (${date})` : ''}` : '';
      const infoToCopy =
        `${versionInfo}\n` + plugins.map(p => `${p.name}: ${p.version || '\u2014'}`).join('\n');
      await navigator.clipboard.writeText(infoToCopy);
      toastInfo('The version information has been copied to clipboard');
    } catch {
      // Optionally, handle copy failure (e.g., show an error toast)
    }
  }, [
    systemInfo,
    configValues.resources_information_version,
    configValues.resources_information_upgrade_date,
    plugins,
    toastInfo,
  ]);

  return (
    <Box
      data-tour={RESOURCES_TOUR_TARGET_IDS.page}
      sx={styles.page}
    >
      <Box sx={styles.header}>
        <Typography
          variant="headingMedium"
          color="text.secondary"
        >
          Resources
        </Typography>
        <Box sx={styles.headerRight}>
          {isConfigLoading ? (
            <Skeleton
              variant="text"
              width="12rem"
            />
          ) : (
            configValues.resources_information_enabled !== false &&
            versionLabel && (
              <Box sx={styles.headerVersionInfo}>
                <Typography
                  variant="bodyMedium"
                  color="text.secondary"
                >
                  {versionLabel}
                </Typography>
                <Tooltip
                  placement="bottom-end"
                  title={
                    isSystemInfoLoading ? (
                      <Skeleton
                        variant="text"
                        width="8rem"
                      />
                    ) : plugins.length > 0 ? (
                      <Box sx={styles.tooltipContent}>
                        {plugins.map(plugin => (
                          <Box
                            key={plugin.name}
                            sx={styles.tooltipRow}
                          >
                            <Typography variant="bodySmall">{plugin.name}:</Typography>
                            <Typography variant="bodySmallBold">{plugin.version || '\u2014'}</Typography>
                          </Box>
                        ))}
                        <BaseBtn
                          variant="icon"
                          size="small"
                          onClick={onCopyToClipboard}
                          aria-label="copy version info"
                          sx={styles.copyButton}
                        >
                          <CopyIcon
                            sx={styles.icon}
                            fill={theme.palette.text.link}
                          />
                        </BaseBtn>
                      </Box>
                    ) : null
                  }
                >
                  <Box
                    component="span"
                    sx={styles.infoIcon}
                  >
                    <Box
                      component={InfoIcon}
                      sx={styles.infoIconSvg}
                    />
                  </Box>
                </Tooltip>
              </Box>
            )
          )}
        </Box>
      </Box>

      <Box sx={styles.content}>
        <Box sx={styles.intro}>
          <Typography variant="headingLarge">Explore Resources</Typography>
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
  headerRight: {
    display: 'flex',
    alignItems: 'center',
  },
  headerVersionInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
  infoIcon: ({ palette }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,
    cursor: 'pointer',
    color: palette.text.primary,
  }),
  infoIconSvg: {
    width: '0.875rem',
    height: '0.875rem',
    display: 'block',
  },
  tooltipContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '0.125rem 0',
  },
  tooltipRow: {
    display: 'flex',
    gap: '0.25rem',
    alignItems: 'baseline',
  },
  header: ({ palette, spacing }) => ({
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    px: spacing(3),
    height: '3.75rem',
    minHeight: '3.75rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
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
  copyButton: {
    justifySelf: 'end',
    alignSelf: 'end',
  },
  icon: {
    fontSize: '1rem',
  },
});

export default ResourcesPage;
