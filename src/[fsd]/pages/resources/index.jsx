import { memo, useMemo } from 'react';

import { Box, Link, Skeleton, Typography } from '@mui/material';

import { useGetResourcesConfigQuery, useGetSystemInfoQuery } from '@/api/resources';
import InfoIcon from '@/assets/info.svg?react';

import ResourceCard, { RESOURCE_CARD_CONFIGS } from './ui/ResourceCard';

const ResourcesPage = memo(() => {
  const { data: systemInfo, isLoading: isSystemInfoLoading } = useGetSystemInfoQuery();
  const { data: resourcesConfig, isLoading: isConfigLoading } = useGetResourcesConfigQuery();

  const configValues = resourcesConfig?.values ?? {};
  const styles = resourcesPageStyles();

  const pylons = useMemo(() => systemInfo?.pylons ?? [], [systemInfo?.pylons]);

  return (
    <Box sx={styles.page}>
      <Box sx={styles.header}>
        <Typography
          variant="headingSmall"
          color="text.secondary"
        >
          Resources
        </Typography>
      </Box>

      <Box sx={styles.content}>
        {configValues.resources_information_enabled !== false && (
          <ResourceCard
            icon={<InfoIcon />}
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
                {systemInfo?.elitea_version && (
                  <Box sx={styles.infoRow}>
                    <Typography
                      variant="bodySmall"
                      color="text.secondary"
                    >
                      ELITEA version:
                    </Typography>
                    <Typography
                      variant="bodySmallBold"
                      color="text.primary"
                    >
                      {systemInfo.elitea_version}
                    </Typography>
                  </Box>
                )}
                {systemInfo?.pylon_version && (
                  <Box sx={styles.infoRow}>
                    <Typography
                      variant="bodySmall"
                      color="text.secondary"
                    >
                      Pylon version:
                    </Typography>
                    <Typography
                      variant="bodySmallBold"
                      color="text.primary"
                    >
                      {systemInfo.pylon_version}
                    </Typography>
                  </Box>
                )}
                {pylons.map(pylon => (
                  <Box
                    key={pylon.pylon_id}
                    sx={styles.infoRow}
                  >
                    <Typography
                      variant="bodySmall"
                      color="text.secondary"
                    >
                      {pylon.name}:
                    </Typography>
                    <Typography
                      variant="bodySmallBold"
                      color="text.primary"
                    >
                      {pylon.core_version ?? '—'}
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
                icon={<config.Icon />}
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
                  links.map((link, idx) => (
                    <Link
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="always"
                      sx={idx === 0 ? styles.linkPrimary : styles.link}
                      variant="bodyMedium"
                    >
                      {link.title}
                    </Link>
                  ))
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
    px: spacing(2),
    height: '3.3rem',
    minHeight: '3.3rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: palette.background.tabPanel,
  }),
  content: ({ spacing }) => ({
    flex: 1,
    overflowY: 'auto',
    px: spacing(2),
    py: spacing(2),
    display: 'flex',
    flexDirection: 'column',
    gap: spacing(2),
  }),
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
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
  }),
  link: ({ palette }) => ({
    color: palette.text.metrics,
    cursor: 'pointer',
    display: 'block',
  }),
});

export default ResourcesPage;
