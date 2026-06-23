import { memo, useCallback, useMemo } from 'react';

import { Box, Skeleton, Tooltip, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import InfoIcon from '@/assets/info.svg?react';
import CopyIcon from '@/components/Icons/CopyIcon';
import useToast from '@/hooks/useToast';

const ResourceVersionInfo = memo(props => {
  const { configValues, isConfigLoading, systemInfo, isSystemInfoLoading } = props;
  const { toastInfo } = useToast();

  const styles = resourceVersionInfoStyles();
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
    <Box sx={styles.header}>
      <Typography
        variant="headingMedium"
        color="text.secondary"
      >
        Help Center
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
                      <Button.BaseBtn
                        variant={BUTTON_VARIANTS.tertiary}
                        size="small"
                        onClick={onCopyToClipboard}
                        aria-label="copy version info"
                        sx={styles.copyButton}
                      >
                        <Box
                          component={CopyIcon}
                          sx={styles.copyIcon}
                        />
                      </Button.BaseBtn>
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
  );
});

ResourceVersionInfo.displayName = 'ResourceVersionInfo';

/** @type {MuiSx} */
const resourceVersionInfoStyles = () => ({
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
    padding: '0.125rem',
  },
  tooltipRow: {
    display: 'flex',
    gap: '0.25rem',
    alignItems: 'baseline',
  },
  copyButton: ({ palette }) => ({
    justifySelf: 'end',
    alignSelf: 'end',
    borderRadius: '1rem',
    padding: '0',

    '&:hover': {
      backgroundColor: palette.mode === 'dark' ? 'rgba(61, 68, 86, 0.1)' : 'rgba(255, 255, 255, 0.1)',
    },
    '& svg path': {
      fill: palette.mode === 'dark' ? '#777A83' : 'rgb(169, 183, 193)',
    },

    '&:hover svg path': {
      fill: palette.mode === 'dark' ? palette.text.button.primary : '#fff',
    },
  }),
  copyIcon: {
    fontSize: '1rem',
  },
});

export default ResourceVersionInfo;
