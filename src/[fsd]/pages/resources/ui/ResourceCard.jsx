import { memo } from 'react';

import { Box, Divider, Typography } from '@mui/material';

import { GradientIconWrapper } from '@/[fsd]/shared/ui/icon';
import { getCardGradientBorderBefore, getCardGradientStyles } from '@/utils/cardStyles';

const ResourceCard = memo(props => {
  const { title, description, icon, colorScheme, children } = props;
  const styles = resourceCardStyles(colorScheme);

  return (
    <Box sx={styles.card}>
      <Box sx={styles.cardHeader}>
        <GradientIconWrapper sx={styles.iconWrapper}>{icon}</GradientIconWrapper>
        <Box sx={styles.headerText}>
          <Typography
            variant="subtitle"
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
const resourceCardStyles = colorScheme => ({
  card: ({ palette }) => {
    const scheme = palette.background.resourceCard?.[colorScheme];
    return {
      ...getCardGradientStyles(palette, { enableHover: false }),
      borderRadius: '1rem',
      ...(scheme
        ? {
            background: scheme.card,
            '&::before': { ...getCardGradientBorderBefore(palette), background: scheme.borderGradient },
          }
        : {}),
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      minWidth: '23.75rem',
      maxWidth: '31.25rem',
      minHeight: '14.25rem',
    };
  },
  cardHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '1rem',
    px: '1rem',
    py: '0.75rem',
  },
  headerText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    flex: 1,
  },
  iconWrapper: ({ palette }) => {
    const scheme = palette.background.resourceCard?.[colorScheme];
    if (!scheme) return {};
    return {
      background: scheme.icon,
      color: scheme.iconColor,
      '&::before': { background: scheme.iconBorderGradient },
    };
  },
  divider: ({ palette }) => {
    const scheme = palette.background.resourceCard?.[colorScheme];
    return {
      borderColor: scheme?.divider ?? palette.border.cardsOutlines,
    };
  },
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
