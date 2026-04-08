import { useCallback, useMemo, useState } from 'react';

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const usePagination = options => {
  const {
    totalRows = 0,
    defaultPage = 0,
    defaultPageSize = 10,
    pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  } = options || {};

  const [page, setPage] = useState(defaultPage);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const totalPages = useMemo(() => Math.ceil(totalRows / pageSize), [totalRows, pageSize]);

  const isFirstPage = page === 0;
  const isLastPage = page >= totalPages - 1;

  const startIndex = page * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRows);

  const startRow = startIndex + 1;
  const endRow = endIndex;

  const handlePageChange = useCallback(
    newPage => {
      if (newPage >= 0 && newPage < totalPages) {
        setPage(newPage);
      }
    },
    [totalPages],
  );

  const handleNextPage = useCallback(() => {
    if (!isLastPage) {
      setPage(prev => prev + 1);
    }
  }, [isLastPage]);

  const handlePrevPage = useCallback(() => {
    if (!isFirstPage) {
      setPage(prev => prev - 1);
    }
  }, [isFirstPage]);

  const handlePageSizeChange = useCallback(newPageSize => {
    setPageSize(newPageSize);
    setPage(0);
  }, []);

  const resetPagination = useCallback(() => {
    setPage(defaultPage);
    setPageSize(defaultPageSize);
  }, [defaultPage, defaultPageSize]);

  const paginateData = useCallback(
    data => {
      if (!data || data.length === 0) {
        return [];
      }
      return data.slice(startIndex, endIndex);
    },
    [startIndex, endIndex],
  );

  const pageSizeSelectOptions = useMemo(
    () =>
      pageSizeOptions.map(size => ({
        label: size.toString(),
        value: size,
      })),
    [pageSizeOptions],
  );

  return {
    page,
    pageSize,
    totalRows,
    totalPages,
    isFirstPage,
    isLastPage,
    startIndex,
    endIndex,
    startRow,
    endRow,
    handlePageChange,
    handleNextPage,
    handlePrevPage,
    handlePageSizeChange,
    resetPagination,
    paginateData,
    pageSizeOptions,
    pageSizeSelectOptions,
  };
};
