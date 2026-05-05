import { memo, useMemo } from 'react';

import { Box, Link, Skeleton, Typography } from '@mui/material';

import { LinkHelpers } from '@/[fsd]/shared/lib/helpers';
import { useGetResourcesConfigQuery, useGetSystemInfoQuery } from '@/api/resources';
import InfoIcon from '@/assets/info.svg?react';

import ResourceCard, { RESOURCE_CARD_CONFIGS } from './ui/ResourceCard';

const { openExternalLink } = LinkHelpers;

const ResourcesPage = memo(() => {
  const { data: systemInfo, isLoading: isSystemInfoLoading } = useGetSystemInfoQuery();
  const { data: resourcesConfig, isLoading: isConfigLoading } = useGetResourcesConfigQuery();

  const configValues = resourcesConfig?.values ?? {};
  const styles = resourcesPageStyles();

  const plugins = useMemo(() => systemInfo?.plugins ?? [], [systemInfo?.plugins]);

  return (
    <Box sx={styles.page}>
      <Box sx={styles.header}>
        <Typography
          variant="headingMedium"
          color="text.secondary"
        >
          Resources
        </Typography>
      </Box>

      <Box sx={styles.content}>
        {configValues.resources_information_enabled !== false && (
          <ResourceCard
            icon={
              <InfoIcon
                width="1.5rem"
                height="1.5rem"
              />
            }
            title="Information"
            description="Installed ELITEA environment details"
          >
            {isSystemInfoLoading ? (
              <>
                <Skeleton
                  variant="text"
                  width="60%"
                />
                <Skeleton
                  variant="text"
                  width="50%"
                />
                <Skeleton
                  variant="text"
                  width="70%"
                />
              </>
            ) : (
              <>
                {configValues.resources_information_version && (
                  <Box sx={styles.infoRow}>
                    <Typography
                      variant="bodySmall"
                      color="text.secondary"
                    >
                      Release Version
                    </Typography>
                    <Typography
                      variant="bodySmallBold"
                      color="text.primary"
                    >
                      {configValues.resources_information_version}
                    </Typography>
                  </Box>
                )}
                {configValues.resources_information_upgrade_date && (
                  <Box sx={styles.infoRow}>
                    <Typography
                      variant="bodySmall"
                      color="text.secondary"
                    >
                      Released on
                    </Typography>
                    <Typography
                      variant="bodySmallBold"
                      color="text.primary"
                    >
                      {configValues.resources_information_upgrade_date}
                    </Typography>
                  </Box>
                )}
                {plugins.map(plugin => (
                  <Box
                    key={plugin.name}
                    sx={styles.infoRow}
                  >
                    <Typography
                      variant="bodySmall"
                      color="text.secondary"
                    >
                      {plugin.name}:
                    </Typography>
                    <Typography
                      variant="bodySmallBold"
                      color="text.primary"
                    >
                      {plugin.version || '—'}
                    </Typography>
                  </Box>
                ))}
                {!systemInfo && (
                  <Typography
                    variant="bodySmall"
                    color="text.disabled"
                  >
                    Version information unavailable
                  </Typography>
                )}
              </>
            )}
          </ResourceCard>
        )}
        <Box sx={styles.grid}>
          {RESOURCE_CARD_CONFIGS.filter(config => configValues[config.enabledKey] !== false).map(config => {
            const links = configValues[config.linksKey];
            const hasLinks = Array.isArray(links) && links.length > 0;

            return (
              <ResourceCard
                key={config.enabledKey}
                title={configValues[config.titleKey] || config.defaultTitle}
                description={configValues[config.descriptionKey] || config.defaultDescription}
                icon={
                  <config.Icon
                    width="1.5rem"
                    height="1.5rem"
                  />
                }
              >
                {isConfigLoading ? (
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
                ) : hasLinks ? (
                  links.map((link, idx) =>
                    link.url ? (
                      <Link
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={openExternalLink}
                        underline="always"
                        sx={idx === 0 ? styles.linkPrimary : styles.link}
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
                  )
                ) : (
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
  header: ({ palette, spacing }) => ({
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    // alignItems: 'start',
    gap: '1rem',
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: '0.5rem',
  },
  linkPrimary: ({ palette }) => ({
    color: palette.primary.main,
    cursor: 'pointer',
    display: 'block',
    textDecorationColor: 'currentColor',
  }),
  link: ({ palette }) => ({
    color: palette.text.metrics,
    cursor: 'pointer',
    display: 'block',
    textDecorationColor: 'currentColor',
  }),
  linkUndefined: ({ palette }) => ({
    color: palette.text.disabled,
    display: 'block',
    fontStyle: 'italic',
  }),
});

export default ResourcesPage;
