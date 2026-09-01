import { memo } from 'react';

import { Link } from '@mui/material';

const DatasetSectionHeader = memo(props => {
  const { onManageDatasets } = props;

  const handleClick = event => {
    event.stopPropagation();
    onManageDatasets?.();
  };

  const styles = datasetSectionHeaderStyles();

  return (
    <Link
      component="button"
      variant="bodySmall"
      onClick={handleClick}
      sx={styles.manageLink}
    >
      Manage Datasets
    </Link>
  );
});

DatasetSectionHeader.displayName = 'DatasetSectionHeader';

/** @type {MuiSx} */
const datasetSectionHeaderStyles = () => ({
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

export default DatasetSectionHeader;
