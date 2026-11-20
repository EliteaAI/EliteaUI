import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

import ArrowRightIcon from '@/components/Icons/ArrowRightIcon';

const GroupHeader = memo(props => {
  const { title, isExpanded, onToggle } = props;

  const handleKeyDown = useCallback(
    event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      onToggle();
    },
    [onToggle],
  );

  const styles = groupHeaderStyles(isExpanded);

  return (
    <Box
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      sx={styles.root}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
    >
      <Box
        component="span"
        sx={styles.arrow}
      >
        <ArrowRightIcon />
      </Box>
      <Typography
        variant="subtitle2"
        sx={styles.title}
      >
        {title}
      </Typography>
    </Box>
  );
});

GroupHeader.displayName = 'GroupHeader';

/** @type {MuiSx} */
const groupHeaderStyles = isExpanded => ({
  root: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.25rem',
    marginBottom: '0.25rem',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: palette.action.hover,
    },
    '&:focus-visible': {
      outline: `0.0625rem solid ${palette.border.focus}`,
    },
  }),
  arrow: ({ palette }) => ({
    display: 'flex',
    padding: '0 0.25rem',
    transform: isExpanded ? 'rotate(90deg)' : 'none',
    transition: 'transform 0.15s',
    '& svg': {
      width: '1rem',
      height: '1rem',
      fill: palette.icon.default,
    },
  }),
  title: {
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
    textTransform: 'none',
    color: 'inherit',
  },
});

export default GroupHeader;
