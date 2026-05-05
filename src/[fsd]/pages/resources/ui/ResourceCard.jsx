import { memo } from 'react';

import { Box, Divider, Typography } from '@mui/material';

import { GradientIconWrapper } from '@/[fsd]/shared/ui/icon';
import { getCardGradientStyles } from '@/utils/cardStyles';

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
    flexShrink: 0,
    minWidth: '23.75rem',
    minHeight: '14.25rem',
  }),
  cardHeader: () => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '1rem',
    px: '1rem',
    py: '0.75rem',
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
