import { memo } from 'react';

import { Box, Card, CardContent } from '@mui/material';

import { Tooltip } from '@/[fsd]/shared/ui';

const CategoryItemCard = memo(props => {
  const { itemKey, label, icon, onClick } = props;
  const styles = getStyles();

  return (
    <Card
      key={itemKey}
      sx={styles.itemCard}
      onClick={onClick}
    >
      <CardContent sx={styles.itemCardContent}>
        <Box sx={styles.itemIconContainer}>{icon}</Box>
        <Tooltip.TypographyWithConditionalTooltip
          title={label}
          placement="top"
          variant="bodyMedium"
          sx={styles.itemLabel}
        >
          {label}
        </Tooltip.TypographyWithConditionalTooltip>
      </CardContent>
    </Card>
  );
});

CategoryItemCard.displayName = 'CategoryItemCard';

/** @type {MuiSx} */
const getStyles = () => ({
  itemCard: ({ palette }) => ({
    cursor: 'pointer',
    backgroundColor: palette.background.secondary,
    border: `0.0625rem solid ${palette.border.cardsOutlines}`,
    backgroundImage: 'none',
    borderRadius: '0.5rem',
    padding: '0.5rem 1.25rem',
    width: '12.75rem',
    height: '2.5rem',
    minHeight: '2.5rem',
    maxHeight: '2.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    transition: 'all 0.2s ease-in-out',
    boxSizing: 'border-box',
    flexShrink: 0,
    flexGrow: 0,
    boxShadow: 'none',
    '&:hover': {
      backgroundColor: palette.mode === 'dark' ? palette.background.tabPanel : palette.background.default,
      boxShadow: palette.boxShadow.default,
      border: `0.0625rem solid ${palette.border.lines}`,
      transform: 'none',
    },
  }),
  itemCardContent: {
    padding: '0 !important',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    width: '100%',
    height: '100%',
  },
  itemIconContainer: {
    width: '1.25rem',
    height: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    '& svg': {
      width: '100%',
      height: '100%',
    },
  },
  itemLabel: ({ palette }) => ({
    color: palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  }),
});

export default CategoryItemCard;
