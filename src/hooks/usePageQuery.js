import { useCallback, useEffect, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useTags from '@/hooks/useTags';

const usePageQuery = (specifiedProjectId, extraParams) => {
  const pageSizeFromRedux = useSelector(state => state.settings.pageSize);
  const { query: queryFromRedux } = useSelector(state => state.search);
  const { tagList } = useSelector(state => state.tags);
  const { selectedTagIds: selectedTagIdsFromUrl, calculateTagsWidthOnCard } = useTags(tagList);
  const selectedProjectId = useSelectedProjectId();
  const projectId = useMemo(
    () => specifiedProjectId || selectedProjectId,
    [selectedProjectId, specifiedProjectId],
  );

  const [requestParams, setRequestParams] = useState({
    page: 0,
    pageSize: pageSizeFromRedux,
    selectedTagIds: selectedTagIdsFromUrl,
    query: queryFromRedux,
    projectId,
    extraParams,
  });

  const setPage = useCallback(page => {
    setRequestParams(prev => ({
      ...prev,
      page,
    }));
  }, []);

  useEffect(() => {
    setRequestParams(prev => ({
      ...prev,
      query: queryFromRedux,
      page: 0,
    }));
  }, [queryFromRedux]);

  useEffect(() => {
    setRequestParams(prev => ({
      ...prev,
      page: 0,
      pageSize: pageSizeFromRedux,
    }));
  }, [pageSizeFromRedux]);

  useEffect(() => {
    setRequestParams(prev => ({
      ...prev,
      page: 0,
      selectedTagIds: selectedTagIdsFromUrl,
    }));
  }, [selectedTagIdsFromUrl]);

  useEffect(() => {
    if (projectId) {
      setRequestParams(prev => ({
        ...prev,
        page: 0,
        projectId,
      }));
    }
  }, [projectId]);

  useEffect(() => {
    setRequestParams(prev => ({
      ...prev,
      page: 0,
      extraParams,
    }));
  }, [extraParams]);

  return { ...requestParams, setPage, tagList, calculateTagsWidthOnCard };
};

export default usePageQuery;
