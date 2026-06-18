import { memo, useCallback, useState } from 'react';

import { Box, IconButton, Tooltip, Typography } from '@mui/material';

import RefreshIcon from '@/assets/refresh-icon.svg?react';
import ArrowDownIcon from '@/components/Icons/ArrowDownIcon';
import { useTheme } from '@emotion/react';

const ParticipantsAccordion = memo(props => {
  const { title, children, onRefresh, collapsed = false, defaultExpanded = true } = props;

  const theme = useTheme();

  const styles = participantsAccordionStyles();

  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleToggle = useCallback(() => {
    if (!collapsed) setExpanded(!expanded);
  }, [collapsed, expanded]);

  const handleRefresh = useCallback(
    event => {
      event.stopPropagation();
      event.preventDefault();

      if (onRefresh) onRefresh();
    },
    [onRefresh],
  );

  return (
    <Box sx={styles.root}>
      <Box
        onClick={handleToggle}
        sx={styles.header}
      >
        <ArrowDownIcon
          width={16}
          height={16}
          fill={theme.palette.icon.main}
          style={{
            transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.2s ease-in-out',
          }}
        />
        <Box sx={styles.headerWrapper}>
          <Typography
            variant="labelSmall"
            color="text.default"
            sx={styles.title}
          >
            {title}
          </Typography>
          {onRefresh && (
            <Tooltip
              title={`Refresh the ${title.toLowerCase()}`}
              placement="top"
            >
              <IconButton
                variant="elitea"
                color="tertiary"
                onClick={handleRefresh}
              >
                <RefreshIcon
                  width={12}
                  height={12}
                />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {expanded && <Box sx={styles.content}>{children}</Box>}
    </Box>
  );
});

ParticipantsAccordion.displayName = 'ParticipantsAccordion';

const participantsAccordionStyles = () => ({
  root: { width: '100%', marginBottom: '.5rem' },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '.75rem',
    padding: '.75rem .5rem',
    cursor: 'pointer',
    userSelect: 'none',

    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
      borderRadius: '.25rem',
    },
  },
  headerWrapper: { display: 'flex', alignItems: 'center', flexGrow: 1, gap: '.375rem' },
  title: { textTransform: 'uppercase', fontSize: '.75rem' },
  content: {
    paddingLeft: '.5rem',
    paddingRight: '.5rem',
    paddingTop: '.25rem',
  },
});

export default ParticipantsAccordion;
