import { memo } from 'react';

import { Box, Divider, Typography } from '@mui/material';

const CardTagSectionItem = memo(props => {
  const { text, showDivider = false, paddingLeft = true, onClick, hoverHighlight, icon = false } = props;
  const styles = cardTagSectionItemStyles(paddingLeft, icon, hoverHighlight);

  return (
    <Box
      component="span"
      onClick={onClick}
      sx={styles.item}
    >
      <Typography
        variant="bodySmall"
        sx={styles.text}
      >
        {text}
      </Typography>
      {showDivider && (
        <Divider
          orientation="vertical"
          flexItem
          sx={styles.divider}
        />
      )}
    </Box>
  );
});
CardTagSectionItem.displayName = 'CardTagSectionItem';

/** @type {MuiSx} */
const cardTagSectionItemStyles = (paddingLeft, icon, hoverHighlight) => ({
  item: ({ palette }) => ({
    cursor: 'pointer',
    caretColor: 'transparent',
    textWrap: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    height: '1.75rem',
    color: palette.text.primary,
    '&:hover': {
      color: hoverHighlight ? palette.text.secondary : null,
    },
  }),
  text: {
    transform: icon ? 'translateY(-0.125rem)' : undefined,
    paddingLeft: paddingLeft ? '0.5rem' : 0,
    paddingRight: '0.5rem',
    color: 'inherit',
  },
  divider: {
    height: '0.9375rem',
    alignSelf: 'center',
  },
});

export default CardTagSectionItem;
