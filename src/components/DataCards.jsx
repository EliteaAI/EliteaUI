import { memo, useEffect } from 'react';

import { useSelector } from 'react-redux';

import { Grid, Skeleton } from '@mui/material';

import ListInfiniteMoreLoader from '@/ComponentsLib/ListInfiniteMoreLoader';
import {
  CARD_LIST_WIDTH,
  CARD_LIST_WIDTH_FULL,
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
    isFullWidth = false,
    cardHeight = '7rem',
    cardWidthOverride,
  } = props;

  const { tagList } = useSelector(state => state.tags);
  const { calculateTagsWidthOnCard, setGetElement } = useTags(tagList);
  const { componentRef: gridRef, componentWidth: cardListWidth } = useGetComponentWidth();

  const isDefaultCardHeight = cardHeight === '7rem';

  const layoutCardWidth = useCardLayout(cardListWidth, cardList.length, isFullWidth);
  const cardWidth = cardWidthOverride || layoutCardWidth;

  const styles = dataCardStyles(cardWidth, isFullWidth, cardHeight, isDefaultCardHeight);

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
const dataCardStyles = (cardWidth, isFullWidth, cardHeight, isDefaultCardHeight) => ({
  cardListContainer: {
    flexGrow: 1,
    width: isFullWidth ? CARD_LIST_WIDTH_FULL : CARD_LIST_WIDTH,
    overflowY: 'hidden',
    marginRight: `-${MARGIN_COMPENSATION}`,
    padding: '1.25rem 0 0 1.5rem',
    gap: '1rem',
  },
  loadingSkeleton: {
    width: '100%',
    height: cardHeight,
    borderRadius: '0.75rem',
  },
  card: ({ palette }) => ({
    ...getCardGradientStyles(palette),
    minWidth: MIN_CARD_WIDTH,
    width: cardWidth,
    height: cardHeight,
    maxHeight: cardHeight,
    display: 'flex',
    alignItems: isDefaultCardHeight ? 'center' : 'stretch',
    flexGrow: '0',
  }),
});

export default DataCards;
