import * as React from 'react';

import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { Grid, Skeleton } from '@mui/material';

import ListInfiniteMoreLoader from '@/ComponentsLib/ListInfiniteMoreLoader';
import {
  CARD_FLEX_GRID,
  CARD_LIST_WIDTH,
  CARD_LIST_WIDTH_FULL,
  FULL_WIDTH_CARD_FLEX_GRID,
  FULL_WIDTH_FLEX_GRID_PAGE,
  MARGIN_COMPENSATION,
  MIN_CARD_WIDTH,
} from '@/common/constants';
import { debounce, filterProps } from '@/common/utils';
import useGetComponentWidth from '@/hooks/useGetComponentWidth';
import useTags from '@/hooks/useTags';

const CardListContainer = styled(
  Grid,
  filterProps('isFullWidth', 'sideBarCollapsed'),
)(({ isFullWidth }) => ({
  flexGrow: 1,
  width: isFullWidth ? CARD_LIST_WIDTH_FULL : CARD_LIST_WIDTH,
  overflowY: 'hidden',
  marginRight: `-${MARGIN_COMPENSATION}`,
  padding: '0.3125rem 0 0 1.5rem',
}));

export default function DataCards({
  data: cardList,
  isLoading,
  renderCard,
  isLoadingMore,
  loadMoreFunc,
  cardType,
  dynamicTags,
  total,
}) {
  const { pathname } = useLocation();
  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);
  const [cardWidth, setCardWidth] = React.useState(CARD_FLEX_GRID.MORE_THAN_THREE_CARDS);
  const [cardWidthXS, setCardWidthXS] = React.useState('');
  const [cardWidthSM, setCardWidthSM] = React.useState('');
  const [cardWidthFullWidthSM, setCardWidthFullWidthSM] = React.useState('');
  const [cardWidthMD, setCardWidthMD] = React.useState('');
  const [cardWidthLG, setCardWidthLG] = React.useState('');
  const [cardWidthXL, setCardWidthXL] = React.useState('');
  const [cardWidthXXL, setCardWidthXXL] = React.useState('');
  const [cardWidthXXXL, setCardWidthXXXL] = React.useState('');
  const [cardWidthXXXXL, setCardWidthXXXXL] = React.useState('');
  const [cardWidthXXXXXL, setCardWidthXXXXXL] = React.useState('');
  const [isFullWidthPage, setIsFullWidthPage] = React.useState(false);
  const { tagList } = useSelector(state => state.tags);
  const { calculateTagsWidthOnCard, setGetElement } = useTags(tagList);
  const { componentRef: gridRef, componentWidth: cardListWidth } = useGetComponentWidth();

  React.useEffect(() => {
    setIsFullWidthPage(FULL_WIDTH_FLEX_GRID_PAGE.includes(pathname));
  }, [pathname]);

  const isLoadingRef = React.useRef(isLoading);
  const isLoadingMoreRef = React.useRef(isLoadingMore);
  const totalRef = React.useRef(total);
  const listSizeRef = React.useRef(cardList.length);

  React.useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  React.useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore;
  }, [isLoadingMore]);

  React.useEffect(() => {
    totalRef.current = total;
  }, [total]);

  React.useEffect(() => {
    listSizeRef.current = cardList.length;
  }, [cardList.length]);

  React.useEffect(() => {
    const checkIfGridReachesBottom = debounce(() => {
      const gridPos =
        (gridRef.current?.getBoundingClientRect().top || 0) +
        window.scrollY +
        (gridRef.current?.scrollHeight || 0);
      const windowHeight = window.innerHeight;

      if (
        gridPos <= windowHeight &&
        !isLoadingRef.current &&
        !isLoadingMoreRef.current &&
        totalRef.current > listSizeRef.current
      ) {
        loadMoreFunc();
      }
    }, 500);

    checkIfGridReachesBottom();
    window.addEventListener('resize', checkIfGridReachesBottom);
    return () => window.removeEventListener('resize', checkIfGridReachesBottom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadMoreFunc]);

  React.useEffect(() => {
    const defaultGridSet = isFullWidthPage
      ? FULL_WIDTH_CARD_FLEX_GRID.MORE_THAN_THREE_CARDS
      : CARD_FLEX_GRID.MORE_THAN_THREE_CARDS;
    const styleSet = isFullWidthPage
      ? {
          1: FULL_WIDTH_CARD_FLEX_GRID.ONE_CARD,
          2: FULL_WIDTH_CARD_FLEX_GRID.TWO_CARDS,
          3: FULL_WIDTH_CARD_FLEX_GRID.THREE_CARDS,
        }
      : {
          1: CARD_FLEX_GRID.ONE_CARD,
          2: CARD_FLEX_GRID.TWO_CARDS,
          3: CARD_FLEX_GRID.THREE_CARDS,
        };
    setCardWidth(styleSet[cardList.length] || defaultGridSet);
    const { XXXXXL, XXXXL, XXXL, XXL, XL, LG, MD, SM, FW_SM, XS } = cardWidth;
    setCardWidthXXXXXL(XXXXXL);
    setCardWidthXXXXL(XXXXL);
    setCardWidthXXXL(XXXL);
    setCardWidthXXL(XXL);
    setCardWidthXL(XL);
    setCardWidthLG(LG);
    setCardWidthMD(MD);
    setCardWidthSM(SM);
    setCardWidthFullWidthSM(FW_SM);
    setCardWidthXS(XS);
  }, [cardList, cardWidth, isFullWidthPage]);

  const gridStyle = React.useCallback(
    theme => {
      const maxCols = Math.floor((cardListWidth + 16) / 316);
      const destWidth = `${300 + (cardListWidth - maxCols * 316) / maxCols}px`;
      return {
        background: theme.palette.background.card.default,
        '&:hover': {
          background: theme.palette.background.card.hover,
          border: `1px solid ${theme.palette.border.lines}`,
          '&:hover': {
            boxShadow: theme.palette.boxShadow.default,
          },
        },
        margin: isFullWidthPage ? '0 1rem 1rem 0' : '0 1rem 1rem 0',
        minWidth: MIN_CARD_WIDTH,
        width:
          cardList.length > 3
            ? destWidth
            : {
                prompt_list_xxxxxl: cardWidthXXXXXL,
                prompt_list_xxxxl: cardWidthXXXXL,
                prompt_list_xxxl: cardWidthXXXL,
                prompt_list_xxl: cardWidthXXL,
                prompt_list_xl: cardWidthXL,
                prompt_list_lg: cardWidthLG,
                prompt_list_md: cardWidthMD,
                prompt_list_full_width_sm: cardWidthFullWidthSM,
                prompt_list_sm: cardWidthSM,
                prompt_list_xs: cardWidthXS,
              },
        height: '132px',
        maxHeight: '132px',
        borderRadius: '8px',
        border: `1px solid ${theme.palette.border.cardsOutlines}`,
        display: 'flex',
        alignItems: 'center',
        flexGrow: '0',
      };
    },
    [
      cardWidthFullWidthSM,
      cardWidthLG,
      cardWidthMD,
      cardWidthSM,
      cardWidthXL,
      cardWidthXS,
      cardWidthXXL,
      cardWidthXXXL,
      cardWidthXXXXL,
      cardWidthXXXXXL,
      isFullWidthPage,
      cardListWidth,
      cardList.length,
    ],
  );

  React.useEffect(() => {
    if (isLoading) return;
    calculateTagsWidthOnCard();
    setGetElement(false);
  }, [calculateTagsWidthOnCard, isLoading, setGetElement]);

  return (
    <CardListContainer
      ref={gridRef}
      container
      isFullWidth={isFullWidthPage}
      sideBarCollapsed={sideBarCollapsed}
    >
      {isLoading
        ? Array.from({ length: 10 }).map((_, index) => (
            <Grid
              className="AlitaDataCard"
              key={index}
              sx={gridStyle}
            >
              <Skeleton
                animation="wave"
                variant="rectangular"
                width="100%"
                height="100%"
              />
            </Grid>
          ))
        : cardList.length
          ? cardList.map((cardData, index) => {
              return (
                <Grid
                  key={cardData.id + (cardData.cardType || cardType)}
                  sx={gridStyle}
                >
                  {renderCard(cardData, cardData.cardType || cardType, index, dynamicTags)}
                </Grid>
              );
            })
          : null}
      {isLoadingMore && (
        <>
          {Array.from({ length: 8 }).map((_, index) => (
            <Grid
              key={index}
              sx={gridStyle}
            >
              <Skeleton
                animation="wave"
                variant="rectangular"
                width={'100%'}
                height={132}
                style={{ borderRadius: 8 }}
              />
            </Grid>
          ))}
        </>
      )}
      <ListInfiniteMoreLoader
        listCurrentSize={cardList?.length}
        totalAvailableCount={total}
        onLoadMore={loadMoreFunc}
        isLoading={isLoading || isLoadingMore}
        resetPageDependencies={undefined}
      />
    </CardListContainer>
  );
}
