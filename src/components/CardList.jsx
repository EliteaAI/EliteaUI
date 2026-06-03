import { memo, useMemo } from 'react';

import { Box } from '@mui/material';

import DataTable from '@/[fsd]/widgets/data-table';
import { RIGHT_PANEL_WIDTH } from '@/common/constants';
import EmptyListBox from '@/components/EmptyListBox';
import useIsTableView from '@/hooks/useIsTableView';
import useShouldCollapseRightToolbar from '@/hooks/useShouldCollapseRightToolbar';

import DataCards from './DataCards';
import RightPanel from './RightPanel';

const CardList = memo(props => {
  const {
    cardList,
    rightPanelOffset,
    rightPanelContent,
    emptyListPlaceHolder,
    customEmptyState,
    isError,
    headerHeight = '70px',
    emptyListSX,
    isFullWidth = false,
    cardHeight,
    cardWidthOverride,
    disableTableView = false,
    resetPageOnSort,
    ...rest
  } = props;

  const isTableView = useIsTableView();
  const { shouldCollapseRightToolbar } = useShouldCollapseRightToolbar();
  const isEmptyList = useMemo(() => cardList.length === 0, [cardList.length]);
  const shouldShowRightPanel = Boolean(rightPanelContent) && !shouldCollapseRightToolbar;
  const isListFullWidth = isFullWidth || !shouldShowRightPanel;
  const shouldRenderTable = isTableView && !disableTableView;

  const showEmptyOrError = !rest.isLoading && (isError || isEmptyList);
  const showCustomEmptyState = showEmptyOrError && customEmptyState && !isError;
  const showDefaultEmptyState = showEmptyOrError && !showCustomEmptyState;
  const showTable = !showEmptyOrError && shouldRenderTable;
  const showCards = !showEmptyOrError && !shouldRenderTable;

  const styles = cardListStyles(isListFullWidth, RIGHT_PANEL_WIDTH, headerHeight);

  const renderContent = () => {
    if (showCustomEmptyState) {
      return <Box sx={styles.customEmptyContainer}>{customEmptyState}</Box>;
    }

    if (showDefaultEmptyState) {
      return (
        <EmptyListBox
          emptyListPlaceHolder={emptyListPlaceHolder}
          headerHeight={headerHeight}
          showErrorMessage={!!isError}
          isFullWidth={isListFullWidth}
          sx={emptyListSX}
        />
      );
    }

    if (showTable) {
      return (
        <DataTable
          data={cardList}
          isFullWidth={isListFullWidth}
          page={rest.page}
          pageSize={rest.pageSize}
          setPage={rest.setPage}
          resetPageOnSort={resetPageOnSort}
          {...rest}
        />
      );
    }

    if (showCards) {
      return (
        <DataCards
          data={cardList}
          isFullWidth={isListFullWidth}
          cardHeight={cardHeight}
          cardWidthOverride={cardWidthOverride}
          {...rest}
        />
      );
    }

    return null;
  };

  return (
    <>
      {renderContent()}
      {shouldShowRightPanel && <RightPanel offsetFromTop={rightPanelOffset}>{rightPanelContent}</RightPanel>}
    </>
  );
});

const cardListStyles = (isListFullWidth, rightPanelWidth, headerHeight) => ({
  customEmptyContainer: {
    width: isListFullWidth ? '100%' : `calc(100% - ${rightPanelWidth + 16}px)`,
    height: `calc(100vh - ${headerHeight})`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

CardList.displayName = 'CardList';

export default CardList;
