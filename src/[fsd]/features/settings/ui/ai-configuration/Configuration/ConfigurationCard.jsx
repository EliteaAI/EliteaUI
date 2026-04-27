import { memo, useCallback, useMemo } from 'react';

import { Box, Typography, useTheme } from '@mui/material';

import { ConfigurationHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { useConfigurationNavigation } from '@/[fsd]/features/settings/lib/hooks';
import { BORDER_RADIUS, HEIGHTS, SPACING } from '@/common/designTokens';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import ConfigurationIcon from './ConfigurationIcon';

const { getConfigurationDisplayName, getConfigurationStatus, isConfigurationEditable } = ConfigurationHelpers;

const ConfigurationCard = memo(({ configuration, canEdit, locationState, isDefault }) => {
  const theme = useTheme();
  const styles = getStyles();
  const projectId = useSelectedProjectId();
  const { navigateToConfiguration } = useConfigurationNavigation();

  const isShared = configuration.shared === true;

  const disabled = useMemo(
    () => !isConfigurationEditable(configuration, projectId, canEdit),
    [canEdit, configuration, projectId],
  );

  const displayName = useMemo(() => getConfigurationDisplayName(configuration), [configuration]);

  const statusText = useMemo(
    () => getConfigurationStatus(configuration, isShared),
    [configuration, isShared],
  );

  const handleCardClick = useCallback(() => {
    if (!disabled) {
      navigateToConfiguration(configuration.id, locationState);
    }
  }, [disabled, configuration.id, locationState, navigateToConfiguration]);

  return (
    <Box
      onClick={handleCardClick}
      sx={styles.cardContainer(disabled)}
    >
      <Box sx={styles.content}>
        <Box sx={styles.iconContainer(theme)}>
          <ConfigurationIcon
            name={configuration.name}
            type={configuration.type}
            label={configuration.label}
          />
        </Box>
        <Box sx={styles.textContainer}>
          <Typography
            variant="bodyMedium"
            color="text.secondary"
            sx={styles.displayName}
          >
            {displayName}
          </Typography>
          <Typography
            component={Box}
            variant="bodySmall"
            color="text.default"
            sx={styles.statusText}
          >
            {statusText}
            {configuration.data?.high_tier && (
              <Typography
                component={Box}
                variant="bodySmall"
                color="text.secondary"
                sx={styles.high_tier}
              >
                High-Tier
              </Typography>
            )}
            {configuration.data?.low_tier && (
              <Typography
                component={Box}
                variant="bodySmall"
                color="text.secondary"
                sx={styles.high_tier}
              >
                Low-Tier
              </Typography>
            )}
            {isDefault && (
              <Typography
                component={Box}
                variant="bodySmall"
                color="text.secondary"
                sx={styles.high_tier}
              >
                Default
              </Typography>
            )}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
});

ConfigurationCard.displayName = 'ConfigurationCard';

/** @type {MuiSx} */
const getStyles = () => ({
  cardContainer:
    disabled =>
    ({ palette, breakpoints }) => ({
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flex: '0 0 calc((100% - 1.5rem) / 3)',
      maxWidth: 'calc((100% - 1.5rem) / 3)',
      minWidth: '20rem',
      borderRadius: '.5rem',
      [breakpoints.down('prompt_list_md')]: {
        flex: '0 0 calc((100% - 1.5rem) / 2)',
        maxWidth: 'calc((100% - 1.5rem) / 2)',
      },
      [breakpoints.down('tablet')]: {
        flex: '0 0 100%',
        maxWidth: '100%',
      },
      padding: SPACING.SM,
      border: `0.0625rem solid ${palette.border.table}`,
      background: !disabled ? palette.background.secondary : palette.background.tabPanel,
      cursor: disabled ? 'default' : 'pointer',
      '&:hover': !disabled && {
        border: `0.0625rem solid ${palette.border.lines}`,
        backgroundColor: palette.background.default,
        boxShadow: palette.boxShadow.default,
      },
      height: '4.4375rem',
    }),
  container: {
    cursor: 'default',
  },
  containerClickable: ({ palette }) => ({
    cursor: 'pointer',
    '&:hover': {
      border: `0.0625rem solid ${palette.border.lines}`,
      backgroundColor: palette.background.default,
      boxShadow: palette.boxShadow.default,
    },
  }),
  content: {
    display: 'flex',
    padding: `${SPACING.MD} ${SPACING.SM}`,
    gap: SPACING.MD,
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: ({ palette }) => ({
    width: HEIGHTS.iconContainer,
    height: HEIGHTS.iconContainer,
    borderRadius: BORDER_RADIUS.XXL,
    padding: '0.5rem',
    boxSizing: 'border-box',
    background: palette.background.button.default,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: HEIGHTS.iconContainer,
  }),
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 1,
    minWidth: 0,
    height: '100%',
  },
  displayName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: 500,
  },
  statusText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'flex',
    gap: '0.625rem',
    alignItems: 'center',
  },
  high_tier: {
    height: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '1.25rem',
    padding: '0.125rem 0.5rem',
    backgroundColor: ({ palette }) => palette.icon.fill.is_default,
  },
});

export default ConfigurationCard;
