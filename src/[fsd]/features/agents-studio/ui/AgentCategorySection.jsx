import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import {
  Box,
  CircularProgress,
  IconButton,
  Skeleton,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import RefreshIcon from '@/assets/refresh-icon.svg?react';
import { INITIAL_CARD_DISPLAY_COUNT } from '@/common/constants';

import AgentCard from './AgentCard';

const AgentCategorySection = memo(props => {
  const {
    category,
    items,
    totalCount = 0,
    isLoading = false,
    isLoadingMore = false,
    onSelectItem,
    onLoadMore,
    onRefresh,
  } = props;

  const theme = useTheme();
  const styles = agentCategorySectionStyles();
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('prompt_list_xl'));

  const initialDisplayCount = isLargeScreen
    ? INITIAL_CARD_DISPLAY_COUNT.LARGE_SCREEN
    : INITIAL_CARD_DISPLAY_COUNT.DEFAULT;

  const [displayCount, setDisplayCount] = useState(initialDisplayCount);

  useEffect(() => {
    if (!items.length) {
      setDisplayCount(initialDisplayCount);
    }
  }, [items, initialDisplayCount]);

  const visibleItems = useMemo(() => items.slice(0, displayCount), [items, displayCount]);
  const hasMoreLocally = useMemo(() => items.length > displayCount, [items.length, displayCount]);
  const canShowMore = useMemo(
    () => hasMoreLocally || items.length < totalCount,
    [hasMoreLocally, items.length, totalCount],
  );
  const isExpanded = useMemo(() => displayCount > initialDisplayCount, [displayCount, initialDisplayCount]);
  const shouldShowButton = useMemo(
    () => (canShowMore || isExpanded) && !isLoadingMore,
    [canShowMore, isExpanded, isLoadingMore],
  );

  const handleShowMore = useCallback(() => {
    const newDisplayCount = displayCount + initialDisplayCount;
    setDisplayCount(newDisplayCount);

    if (newDisplayCount > items.length && items.length < totalCount) {
      onLoadMore?.(category);
    }
  }, [displayCount, initialDisplayCount, items.length, totalCount, onLoadMore, category]);

  const handleShowLess = useCallback(() => {
    setDisplayCount(initialDisplayCount);
  }, [initialDisplayCount]);

  return (
    <Box sx={styles.container}>
      <Box sx={styles.headerContainer}>
        <Typography
          variant="headingMedium"
          sx={styles.categoryTitle}
        >
          {category}
        </Typography>
        {isLoading ? (
          <CircularProgress size={20} />
        ) : (
          <Tooltip
            title="Reload the category items"
            placement="top"
          >
            <IconButton
              variant="elitea"
              color="tertiary"
              onClick={() => onRefresh?.(category)}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Box sx={styles.grid}>
        {visibleItems
          .filter(item => item?.value)
          .map(item => {
            const application = item?.value;
            return (
              <AgentCard
                key={category + application.id}
                application={application}
                onSelectItem={onSelectItem}
              />
            );
          })}
        {isLoadingMore &&
          Array.from({
            length: Math.min(initialDisplayCount, totalCount - items.length),
          }).map((_, index) => (
            <Skeleton
              key={`skeleton-${index}`}
              variant="rounded"
              sx={styles.skeleton}
            />
          ))}
      </Box>

      {shouldShowButton && (
        <Box sx={styles.showMoreContainer}>
          <Typography
            variant="labelMedium"
            onClick={isExpanded ? handleShowLess : handleShowMore}
            sx={styles.showMoreButton}
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </Typography>
        </Box>
      )}
    </Box>
  );
});

AgentCategorySection.displayName = 'AgentCategorySection';

/** @type {MuiSx} */
const agentCategorySectionStyles = () => ({
  container: {
    width: '100%',
    maxWidth: '81.375rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    boxSizing: 'border-box',
  },
  headerContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  categoryTitle: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  grid: ({ breakpoints }) => ({
    display: 'grid',
    width: '100%',
    gridTemplateColumns: '1fr',
    gap: '1rem',
    [breakpoints.up('sm')]: {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    [breakpoints.up('prompt_list_full_width_sm')]: {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    [breakpoints.up('prompt_list_md')]: {
      gridTemplateColumns: 'repeat(3, 1fr)',
    },
    [breakpoints.up('prompt_list_xl')]: {
      gridTemplateColumns: 'repeat(4, 1fr)',
    },
  }),
  skeleton: {
    width: '100%',
    height: '7.25rem',
  },
  showMoreContainer: {
    display: 'flex',
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    height: '1.5rem',
    gap: '.5rem',
  },
  showMoreButton: ({ palette }) => ({
    cursor: 'pointer',
    color: palette.background.button.primary.hover,
    '&:hover': {
      color: palette.text.button.showMore,
    },
  }),
});

export default AgentCategorySection;
