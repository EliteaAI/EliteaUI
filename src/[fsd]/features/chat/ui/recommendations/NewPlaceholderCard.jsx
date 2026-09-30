import { memo } from 'react';

import { Skeleton } from '@mui/material';

const NewPlaceholderCard = memo(props => {
  const { width } = props;

  const styles = newPlaceholderCardStyles();

  return (
    <Skeleton
      variant="rectangular"
      width={width || 250}
      height={56}
      sx={styles.root}
    />
  );
});

NewPlaceholderCard.displayName = 'NewPlaceholderCard';

/** @type {MuiSx} */
const newPlaceholderCardStyles = () => ({
  root: ({ palette }) => ({
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
  }),
});

export default NewPlaceholderCard;
