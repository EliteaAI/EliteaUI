import { memo } from 'react';

import { Link } from '@mui/material';

const DimensionSectionHeader = memo(props => {
  const { onManageDimensions } = props;

  const handleClick = event => {
    event.stopPropagation();
    onManageDimensions?.();
  };

  const styles = dimensionSectionHeaderStyles();

  return (
    <Link
      component="button"
      variant="bodySmall"
      onClick={handleClick}
      sx={styles.manageLink}
    >
      Manage Dimensions
    </Link>
  );
});

DimensionSectionHeader.displayName = 'DimensionSectionHeader';

/** @type {MuiSx} */
const dimensionSectionHeaderStyles = () => ({
  manageLink: ({ palette }) => ({
    color: palette.text.primary,
    textDecoration: 'underline',
    textDecorationStyle: 'solid',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
    border: 'none',
    background: 'none',
    padding: 0,
    '&:hover': {
      textDecoration: 'underline',
      color: palette.text.secondary,
    },
  }),
});

export default DimensionSectionHeader;
