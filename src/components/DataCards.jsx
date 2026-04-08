import { memo, useEffect } from 'react';

import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { Grid, Skeleton } from '@mui/material';

import ListInfiniteMoreLoader from '@/ComponentsLib/ListInfiniteMoreLoader';
import {
  CARD_LIST_WIDTH,
  CARD_LIST_WIDTH_FULL,
  FULL_WIDTH_FLEX_GRID_PAGE,
  MARGIN_COMPENSATION,
  MIN_CARD_WIDTH,
} from '@/common/constants';
import { useCardLayout } from '@/hooks/useCardLayout';
import useGetComponentWidth from '@/hooks/useGetComponentWidth';
import useTags from '@/hooks/useTags';
import { getCardGradientStyles } from '@/utils/cardStyles';

const DataCards = memo(props => {
  const {
    data: cardList,
    isLoading,
    renderCard,
    isLoadingMore,
    loadMoreFunc,
    cardType,
    dynamicTags,
    total,
  } = props;

  const { pathname } = useLocation();
  const { tagList } = useSelector(state => state.tags);
  const { calculateTagsWidthOnCard, setGetElement } = useTags(tagList);
  const { componentRef: gridRef, componentWidth: cardListWidth } = useGetComponentWidth();

  const isFullWidthPage = FULL_WIDTH_FLEX_GRID_PAGE.includes(pathname);

  const cardWidth = useCardLayout(cardListWidth, cardList.length, isFullWidthPage);

  const styles = dataCardStyles(cardWidth, isFullWidthPage);

  useEffect(() => {
    if (isLoading) return;
    calculateTagsWidthOnCard();
    setGetElement(false);
  }, [calculateTagsWidthOnCard, isLoading, setGetElement]);

  const renderSkeletons = count =>
    Array.from({ length: count }).map((_, index) => (
      <Grid
        key={index}
        sx={styles.card}
      >
        <Skeleton
          animation="wave"
          variant="rectangular"
          sx={styles.loadingSkeleton}
        />
      </Grid>
    ));

  return (
    <Grid
      ref={gridRef}
      container
      sx={styles.cardListContainer}
    >
      {isLoading
        ? renderSkeletons(10)
        : cardList.length
          ? cardList.map((cardData, index) => (
              <Grid
                key={cardData.id + (cardData.cardType || cardType)}
                sx={styles.card}
              >
                {renderCard(cardData, cardData.cardType || cardType, index, dynamicTags)}
              </Grid>
            ))
          : null}

      {isLoadingMore && renderSkeletons(8)}

      <ListInfiniteMoreLoader
        listCurrentSize={cardList?.length}
        totalAvailableCount={total}
        onLoadMore={loadMoreFunc}
        isLoading={isLoading || isLoadingMore}
        resetPageDependencies={undefined}
      />
    </Grid>
  );
});

DataCards.displayName = 'DataCards';

/** @type {MuiSx} */
const dataCardStyles = (cardWidth, isFullWidthPage) => ({
  cardListContainer: {
    flexGrow: 1,
    width: isFullWidthPage ? CARD_LIST_WIDTH_FULL : CARD_LIST_WIDTH,
    overflowY: 'hidden',
    marginRight: `-${MARGIN_COMPENSATION}`,
    padding: '0.3125rem 0 0 1.5rem',
  },
  loadingSkeleton: {
    width: '100%',
    height: '100%',
    borderRadius: '0.75rem',
  },
  card: ({ palette }) => ({
    ...getCardGradientStyles(palette),
    margin: '0 1rem 1rem 0',
    minWidth: MIN_CARD_WIDTH,
    width: cardWidth,
    height: '7rem',
    maxHeight: '7rem',
    display: 'flex',
    alignItems: 'center',
    flexGrow: '0',
  }),
});

export default DataCards;
