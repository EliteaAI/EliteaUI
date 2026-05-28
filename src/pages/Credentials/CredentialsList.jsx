import { memo, useEffect, useMemo } from 'react';

import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { Box } from '@mui/material';

import { AuthorInformation } from '@/[fsd]/entities/author/ui';
import { ContentType, PUBLIC_PROJECT_ID, ViewMode } from '@/common/constants';
import { buildErrorMessage, uniqueArrayByProp } from '@/common/utils';
import CardList from '@/components/CardList';
import TeamMates from '@/components/TeamMates';
import useCredentialTypes from '@/hooks/credentials/useCredentialTypes';
import { useLoadAllCredentials } from '@/hooks/credentials/useLoadAllCredentials';
import useCardList from '@/hooks/useCardList';
import useIsTableView from '@/hooks/useIsTableView';
import useQueryTrendingAuthor from '@/hooks/useQueryTrendingAuthor';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';

import CredentialsTypesPanel from './CredentialsTypesPanel';

const DEFAULT_CREDENTIALS_PATHNAME = RouteDefinitions.CredentialsWithTab.replace(':tab', 'all');

const EmptyListPlaceHolder = ({ query }) => {
  if (!query) {
    return <Box>{`You have no credentials.`}</Box>;
  } else {
    return (
      <Box>
        Nothing found. <br />
        Create yours now!
      </Box>
    );
  }
};

const CredentialsList = memo(props => {
  const { rightPanelOffset } = props;

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const selectedProjectId = useSelectedProjectId();
  const isTableView = useIsTableView();
  const { query } = useSelector(state => state.search);
  const { selectedTypes: urlSelectedTypes, handleClickType } = useCredentialTypes();
  const { renderCard } = useCardList(
    selectedProjectId != PUBLIC_PROJECT_ID ? ViewMode.Owner : ViewMode.Public,
    handleClickType,
  );
  const { toastError } = useToast();
  const styles = credentialsListStyles();

  const projectId = useSelectedProjectId();
  const { isLoadingAuthor, authorId } = useQueryTrendingAuthor(projectId);
  const { personal_project_id: privateProjectId } = useSelector(state => state.user);

  const {
    onLoadMore,
    data,
    isCredentialsError,
    isMoreCredentialsError,
    isCredentialsFirstFetching,
    isCredentialsFetching,
    credentialsError,
    totalCount,
    tagList,
    onRefetch,
    page,
    pageSize,
    setPage,
  } = useLoadAllCredentials({ isTableView, selectedTypeNames: urlSelectedTypes });

  const total = totalCount;

  const rightPanelContent = useMemo(
    () => (
      <Box sx={styles.rightInfoPanelStyle}>
        <CredentialsTypesPanel
          tagList={tagList}
          title="Types"
          style={{ flex: 1 }}
        />
        {selectedProjectId == privateProjectId || authorId ? (
          <AuthorInformation isLoading={isLoadingAuthor} />
        ) : (
          <TeamMates />
        )}
      </Box>
    ),
    [tagList, selectedProjectId, privateProjectId, authorId, isLoadingAuthor, styles],
  );

  useEffect(() => {
    onRefetch();
    if (pathname === DEFAULT_CREDENTIALS_PATHNAME) {
      onRefetch();
    }
  }, [pathname, onRefetch]);

  useEffect(() => {
    if (isMoreCredentialsError) {
      toastError(buildErrorMessage(credentialsError));
    }
  }, [credentialsError, isMoreCredentialsError, toastError]);

  // Navigate to New Credential page for private projects with no credentials
  useEffect(() => {
    const isPublic = selectedProjectId == PUBLIC_PROJECT_ID;
    const loading = isCredentialsFirstFetching || isCredentialsFetching;
    const hasError = !!isCredentialsError;
    const hasQuery = !!(query && String(query).trim());
    const hasTypeFilter = urlSelectedTypes.length > 0;

    // Don't redirect if filters are active - user may be filtering for non-existent types
    if (!isPublic && !loading && !hasError && !hasQuery && !hasTypeFilter && total === 0) {
      navigate(RouteDefinitions.CreateCredentialFromMain, { replace: true });
    }
  }, [
    selectedProjectId,
    isCredentialsFirstFetching,
    isCredentialsFetching,
    isCredentialsError,
    query,
    urlSelectedTypes,
    total,
    navigate,
  ]);

  const uniqueDataList = useMemo(() => {
    const getCredentialItemName = item => {
      if (item.label) {
        return item.label;
      }
      if (!item.name || item.name.trim() === '') {
        const fallbackName =
          item.elitea_title ||
          item.credential_name ||
          item.title ||
          item.type.charAt(0).toUpperCase() + item.type.slice(1);
        return fallbackName;
      }
      return item.name;
    };

    // Server-side filtering is now handled by the API via the type parameter
    // No need for client-side filtering - the API returns only matching credentials
    return uniqueArrayByProp(
      (data || []).map(item => ({
        ...item,
        name: getCredentialItemName(item),
      })),
      'id',
    );
  }, [data]);

  return (
    <Box sx={styles.wrapper}>
      <CardList
        key={ContentType.CredentialAll}
        cardList={uniqueDataList}
        total={total}
        isLoading={isCredentialsFirstFetching}
        isError={isCredentialsError}
        rightPanelOffset={rightPanelOffset}
        rightPanelContent={rightPanelContent}
        renderCard={renderCard}
        isLoadingMore={isCredentialsFetching}
        loadMoreFunc={onLoadMore}
        cardType={ContentType.CredentialAll}
        emptyListPlaceHolder={<EmptyListPlaceHolder query={query} />}
        page={page}
        pageSize={pageSize}
        setPage={setPage}
      />
    </Box>
  );
});

CredentialsList.displayName = 'CredentialsList';

export default CredentialsList;

/** @type {MuiSx} */
const credentialsListStyles = () => ({
  rightInfoPanelStyle: {
    height: `calc(100dvh - 4.375rem)`,
    display: 'flex',
    flexDirection: 'column',
  },
  wrapper: {
    width: '100%',
    '& > .MuiGrid-container': {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(18.75rem, 1fr))',
    },
    '& > .MuiGrid-container > .MuiGrid-root': {
      width: '100%',
      maxWidth: '100%',
    },
  },
});
