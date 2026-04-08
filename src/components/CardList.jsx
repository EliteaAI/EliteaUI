import { useMemo } from 'react';

import DataTable from '@/[fsd]/widgets/DataTable';
import EmptyListBox from '@/components/EmptyListBox';
import useIsTableView from '@/hooks/useIsTableView';

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
    resetPageOnSort,
    ...rest
  } = props;

  const isTableView = useIsTableView();
  const isEmptyList = useMemo(() => cardList.length === 0, [cardList.length]);

  return (
    <>
      {!rest.isLoading && (isError || isEmptyList) ? (
        <EmptyListBox
          emptyListPlaceHolder={emptyListPlaceHolder}
          headerHeight={headerHeight}
          showErrorMessage={!!isError}
          isFullWidth={!rightPanelContent}
          sx={emptyListSX}
        />
      ) : isTableView ? (
        <DataTable
          data={cardList}
          isFullWidth={!rightPanelContent}
          page={rest.page}
          pageSize={rest.pageSize}
          setPage={rest.setPage}
          resetPageOnSort={resetPageOnSort}
          {...rest}
        />
      ) : (
        <DataCards
          data={cardList}
          {...rest}
        />
      )}
      <RightPanel offsetFromTop={rightPanelOffset}>{rightPanelContent}</RightPanel>
    </>
  );
};

export default CardList;
