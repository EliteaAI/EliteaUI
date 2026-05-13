import { useMemo } from 'react';

import DataTable from '@/[fsd]/widgets/DataTable';
import EmptyListBox from '@/components/EmptyListBox';
import useIsTableView from '@/hooks/useIsTableView';
import useShouldCollapseRightToolbar from '@/hooks/useShouldCollapseRightToolbar';

import DataCards from './DataCards';
import RightPanel from './RightPanel';

const CardList = props => {
  const {
    cardList,
    rightPanelOffset,
    rightPanelContent,
    emptyListPlaceHolder,
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

  return (
    <>
      {!rest.isLoading && (isError || isEmptyList) ? (
        <EmptyListBox
          emptyListPlaceHolder={emptyListPlaceHolder}
          headerHeight={headerHeight}
          showErrorMessage={!!isError}
          isFullWidth={isListFullWidth}
          sx={emptyListSX}
        />
      ) : shouldRenderTable ? (
        <DataTable
          data={cardList}
          isFullWidth={isListFullWidth}
          page={rest.page}
          pageSize={rest.pageSize}
          setPage={rest.setPage}
          resetPageOnSort={resetPageOnSort}
          {...rest}
        />
      ) : (
        <DataCards
          data={cardList}
          isFullWidth={isListFullWidth}
          cardHeight={cardHeight}
          cardWidthOverride={cardWidthOverride}
          {...rest}
        />
      )}
      {shouldShowRightPanel && <RightPanel offsetFromTop={rightPanelOffset}>{rightPanelContent}</RightPanel>}
    </>
  );
};

export default CardList;
