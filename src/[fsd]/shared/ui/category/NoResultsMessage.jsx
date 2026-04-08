import { memo } from 'react';

import { Box, Typography } from '@mui/material';

/**
 * A reusable component for displaying "no results" state with centered title and description.
 * Designed to be used with GroupedCategory's renderNoResults prop.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.title - Main title text
 * @param {string} props.description - Description text
 * @returns {JSX.Element} NoResultsMessage component
 */
const NoResultsMessage = memo(props => {
  const { title, description } = props;
  const styles = getStyles();

  return (
    <Box sx={styles.noResultsContainer}>
      <Typography
        variant="headingMedium"
        sx={styles.noResultsTitle}
      >
        {title}
      </Typography>
      <Typography
        variant="bodyMedium"
        sx={styles.noResultsDescription}
      >
        {description}
      </Typography>
    </Box>
  );
});

NoResultsMessage.displayName = 'NoResultsMessage';

/** @type {MuiSx} */
const getStyles = () => ({
  noResultsContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '12.5rem',
    gap: '1rem',
  },
  noResultsTitle: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  noResultsDescription: ({ palette }) => ({
    color: palette.text.disabled,
    textAlign: 'center',
    maxWidth: '25rem',
  }),
});

export default NoResultsMessage;
