import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const IndexBreadcrumb = memo(props => {
  const { toolkitName, current, onToolkitsClick, onToolkitClick, indexName, onIndexClick } = props;
  const styles = indexBreadcrumbStyles();

  return (
    <Box sx={styles.wrapper}>
      <Typography
        variant="headingSmall"
        sx={styles.link}
        onClick={onToolkitsClick}
      >
        Toolkits
      </Typography>
      {toolkitName && (
        <>
          <Typography
            variant="headingSmall"
            sx={styles.separator}
          >
            /
          </Typography>
          <Typography
            variant="headingSmall"
            sx={styles.link}
            onClick={onToolkitClick}
          >
            {toolkitName}
          </Typography>
        </>
      )}
      {indexName && onIndexClick && (
        <>
          <Typography
            variant="headingSmall"
            sx={styles.separator}
          >
            /
          </Typography>
          <Typography
            variant="headingSmall"
            sx={styles.link}
            onClick={onIndexClick}
          >
            {indexName}
          </Typography>
        </>
      )}
      <Typography
        variant="headingSmall"
        sx={styles.separator}
      >
        /
      </Typography>
      <Typography
        variant="headingSmall"
        color="text.secondary"
      >
        {current}
      </Typography>
    </Box>
  );
});

IndexBreadcrumb.displayName = 'IndexBreadcrumb';

/** @type {MuiSx} */
const indexBreadcrumbStyles = () => ({
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    minWidth: 0,
    overflow: 'hidden',
  },
  separator: ({ palette }) => ({
    color: palette.text.secondary,
    marginX: '0.5rem',
    flexShrink: 0,
  }),
  link: ({ palette }) => ({
    color: palette.text.secondary,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    '&:hover': {
      color: palette.primary.main,
      textDecoration: 'underline',
    },
  }),
});

export default IndexBreadcrumb;
