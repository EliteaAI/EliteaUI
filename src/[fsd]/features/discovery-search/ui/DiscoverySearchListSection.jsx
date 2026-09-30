import { memo, useCallback, useMemo, useState } from 'react';

import { CircularProgress, ListItem } from '@mui/material';

import { DiscoverySearchHelpers } from '@/[fsd]/features/discovery-search/lib/helpers';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button';
import { BaseListSubheader } from '@/[fsd]/shared/ui/list';
import { SUGGESTION_PAGE_SIZE } from '@/common/constants';

import DiscoverySearchListItem from './DiscoverySearchListItem';

const DiscoverySearchListSection = memo(props => {
  const { sectionTitle, isFetching, data = [], total, renderItem, fetchMoreData } = props;
  const [visibleCount, setVisibleCount] = useState(SUGGESTION_PAGE_SIZE);
  const styles = discoverySearchListSectionStyles();

  const handleShowMore = useCallback(() => {
    const nextVisibleCount = visibleCount + SUGGESTION_PAGE_SIZE;
    setVisibleCount(nextVisibleCount);

    if (DiscoverySearchHelpers.shouldFetchMoreSuggestions(data.length, nextVisibleCount, total)) {
      fetchMoreData?.();
    }
  }, [data.length, fetchMoreData, total, visibleCount]);

  const { remainedCount, nextCount } = useMemo(
    () => DiscoverySearchHelpers.getShowMoreCounts(total, visibleCount),
    [total, visibleCount],
  );

  return (
    <>
      <BaseListSubheader
        className="discovery-search-list-subheader"
        sx={styles.subHeader}
      >
        {sectionTitle}
        {isFetching ? (
          <CircularProgress
            size="1rem"
            sx={styles.progress}
          />
        ) : null}
      </BaseListSubheader>
      {data.length > 0 ? (
        <>
          {data.slice(0, visibleCount).map(renderItem)}
          {total > visibleCount && fetchMoreData && (
            <ListItem disablePadding>
              <Button.BaseBtn
                variant={BUTTON_VARIANTS.auxiliary}
                onClick={handleShowMore}
                sx={styles.showMoreButton}
              >
                {`Show ${nextCount} more (${remainedCount})`}
              </Button.BaseBtn>
            </ListItem>
          )}
        </>
      ) : (
        <DiscoverySearchListItem disabled>{`No ${sectionTitle} Match`}</DiscoverySearchListItem>
      )}
    </>
  );
});

DiscoverySearchListSection.displayName = 'DiscoverySearchListSection';

/** @type {MuiSx} */
const discoverySearchListSectionStyles = () => ({
  subHeader: ({ palette, typography }) => ({
    ...typography.subtitle,
    height: '2.5rem',
    boxSizing: 'border-box',
    padding: '0.75rem 1rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
    color: palette.text.primary,
  }),
  progress: {
    marginLeft: '0.5rem',
  },
  showMoreButton: () => ({
    width: '100%',
    minWidth: 0,
    height: '2.5rem',
    justifyContent: 'flex-start',
    padding: '0.5rem 1rem',
    borderRadius: 0,
  }),
});

export default DiscoverySearchListSection;
