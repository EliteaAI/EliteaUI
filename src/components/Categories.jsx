import * as React from 'react';

import { useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';

import { IconButton, Skeleton, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { useLazyTagListQuery } from '@/api/tags.js';
import { CollectionStatus, RIGHT_PANEL_WIDTH_OF_CARD_LIST_PAGE, SearchParams } from '@/common/constants';
import { debounce, filterProps, removeDuplicateObjects } from '@/common/utils';
import ClearIcon from '@/components/Icons/ClearIcon';
import { useIsFrom } from '@/hooks/useIsFromSpecificPageHooks';
import { useAuthorIdFromUrl } from '@/hooks/useSearchParamValue';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useTags from '@/hooks/useTags';
import RouteDefinitions from '@/routes';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';

import StyledChip from './DataDisplay/StyledChip';

const TITLE_MARGIN_SIZE = 16;

const TagsContainer = styled('div')(() => ({
  marginBottom: '24px',
  minHeight: '5.5em',
  overflowY: 'scroll',
  '::-webkit-scrollbar': {
    display: 'none',
  },
}));

const FixedContainer = styled('div')(() => ({
  width: `${RIGHT_PANEL_WIDTH_OF_CARD_LIST_PAGE}px`,
}));

const SkeletonContainer = styled('div')(() => ({
  display: 'flex',
  flexWrap: 'wrap',
  flexDirection: 'row',
  marginTop: `46px`,
}));

const ChipSkeleton = styled(
  Skeleton,
  filterProps([]),
)(() => ({
  margin: '0 0.5rem 0.5rem 0',
  padding: '0.5rem 1.25rem',
  borderRadius: '0.625rem',
  width: '100px',
  height: '32px',
}));

const useStatusesFromUrl = () => {
  const [searchParams] = useSearchParams();
  const statuses = React.useMemo(() => {
    const statusesFromUrl = searchParams.get(SearchParams.Statuses) || '';
    if (statusesFromUrl.includes(CollectionStatus.All)) {
      return undefined;
    }
    return statusesFromUrl.split(',');
  }, [searchParams]);
  return statuses;
};

const Categories = ({
  tagList,
  title = 'Tags',
  style,
  my_liked,
  specifiedStatus,
  customSelectedItems,
  customHandleClick,
  customHandleClear,
  maintainAlphabeticalOrder = false,
}) => {
  const theme = useTheme();
  const projectId = useSelectedProjectId();
  const [page, setPage] = React.useState(0);
  const [mergeTagListQuery, setMergeTagListQuery] = React.useState(false);
  const [cloneTagListParams, setCloneTagListParams] = React.useState({});
  const { author_id: myAuthorId } = useSelector(state => state.user);
  const { tagsOnVisibleCards = [], totalTags } = useSelector(state => state.tags);
  const { query } = useSelector(state => state.search);
  const authorId = useAuthorIdFromUrl();
  const statusesFromUrl = useStatusesFromUrl();
  const statuses = React.useMemo(() => statusesFromUrl, [statusesFromUrl]);
  const [getTagList, { isSuccess, isError, isLoading, isFetching }] = useLazyTagListQuery();

  // Use custom handlers if provided (for toolkit types), otherwise use useTags (for regular tags)
  // Only call useTags when no custom handlers are provided to avoid tag pollution
  const shouldUseCustomHandlers = customSelectedItems || customHandleClick || customHandleClear;
  const tagsInfoFromTagList = useTags(tagList);
  const tagsHook = shouldUseCustomHandlers ? null : tagsInfoFromTagList;

  const selectedTags = React.useMemo(() => {
    return customSelectedItems || (tagsHook ? tagsHook.selectedTags : []);
  }, [customSelectedItems, tagsHook]);

  const handleClickTag = React.useMemo(() => {
    return customHandleClick || (tagsHook ? tagsHook.handleClickTag : () => {});
  }, [customHandleClick, tagsHook]);

  const handleClear = React.useMemo(() => {
    return customHandleClear || (tagsHook ? tagsHook.handleClear : () => {});
  }, [customHandleClear, tagsHook]);

  const sortedTagList = React.useMemo(() => {
    if (maintainAlphabeticalOrder) {
      // For toolkit types and other cases where we want to maintain alphabetical order
      return tagList;
    } else {
      // Original behavior: selected tags first, then unselected
      const selected = selectedTags
        .map(tag =>
          removeDuplicateObjects([...tagsOnVisibleCards, ...tagList]).find(item => item.name === tag),
        )
        .filter(tag => tag);
      const unselected = tagList.filter(tag => !selectedTags.includes(tag.name));
      return [...selected, ...unselected];
    }
  }, [selectedTags, tagList, tagsOnVisibleCards, maintainAlphabeticalOrder]);

  const showClearButton = React.useMemo(() => {
    return isSuccess && selectedTags.length > 0;
  }, [selectedTags, isSuccess]);

  const [fixedHeight, setFixedHeight] = React.useState(0);
  const fixedRef = React.useRef(null);
  const tagsContainerRef = React.useRef(null);

  const updateHeight = React.useCallback(() => {
    setFixedHeight(fixedRef.current.offsetHeight + TITLE_MARGIN_SIZE);
  }, []);

  const handleClick = React.useCallback(
    tag => e => {
      handleClickTag(e, tag);
    },
    [handleClickTag],
  );

  const onScroll = debounce(() => {
    const tagsContainerDom = tagsContainerRef.current;
    const clientHeight = tagsContainerDom.clientHeight;
    const scrollHeight = tagsContainerDom.scrollHeight;
    const scrollTop = tagsContainerDom.scrollTop;

    const isReachBottom = scrollTop + clientHeight > scrollHeight - 10;
    if (isReachBottom) {
      const existsMore = tagList.length < totalTags;
      // if (!existsMore || isFetching) return;
      if (!existsMore) return;
      setPage(page + 1);
    }
  }, 300);

  React.useEffect(() => {
    const tagsContainerDom = tagsContainerRef.current;
    tagsContainerDom.addEventListener('scroll', onScroll);

    return () => {
      tagsContainerDom.removeEventListener('scroll', onScroll);
    };
  }, [onScroll, tagsContainerRef]);

  const isOnUserPublic = useIsFrom(RouteDefinitions.UserPublic);
  const isFromApplications = useIsFrom(RouteDefinitions.Applications);
  const isFromPipelines = useIsFrom(RouteDefinitions.Pipelines);
  const { tab } = useParams();

  React.useEffect(() => {
    updateHeight();
    window.addEventListener('resize', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
    };
  }, [updateHeight]);

  React.useEffect(() => {
    updateHeight();
  }, [showClearButton, updateHeight]);

  React.useEffect(() => {
    if (!projectId) {
      return;
    }
    const queryForTag = query || undefined;
    const tagListParams = { projectId, query: queryForTag, page };

    if (isOnUserPublic) {
      tagListParams.author_id = authorId;
      if (statuses) {
        tagListParams.statuses = statuses;
      }
      //tabs 'agents', 'pipelines'
      switch (tab) {
        case 'agents':
          tagListParams.entity_coverage = 'application';
          break;
        case 'pipelines':
          tagListParams.entity_coverage = 'pipeline';
          break;
        default:
          break;
      }
    } else if (isFromApplications) {
      tagListParams.statuses = specifiedStatus
        ? specifiedStatus === CollectionStatus.All
          ? undefined
          : specifiedStatus
        : 'published';
      tagListParams.entity_coverage = 'application';
      if (my_liked) {
        tagListParams.my_liked = my_liked;
      }
    } else if (isFromPipelines) {
      tagListParams.statuses = specifiedStatus
        ? specifiedStatus === CollectionStatus.All
          ? undefined
          : specifiedStatus
        : 'published';
      tagListParams.entity_coverage = 'pipeline';
      if (my_liked) {
        tagListParams.my_liked = my_liked;
      }
    }
    if (tagListParams.query && tagListParams.collection_phrase) {
      tagListParams.splitRequest = true;
      tagListParams.collection_phrase = queryForTag;
      getTagList(tagListParams);
      setCloneTagListParams({
        ...tagListParams,
        skipTotal: true,
      });
      setMergeTagListQuery(true);
    } else {
      getTagList(tagListParams);
    }
  }, [
    tab,
    myAuthorId,
    getTagList,
    isOnUserPublic,
    projectId,
    authorId,
    statuses,
    query,
    page,
    my_liked,
    isFromApplications,
    isFromPipelines,
    specifiedStatus,
  ]);

  React.useEffect(() => {
    if (mergeTagListQuery && !isFetching) {
      getTagList(cloneTagListParams);
      setMergeTagListQuery(false);
      setCloneTagListParams({});
    }
  }, [cloneTagListParams, getTagList, isFetching, mergeTagListQuery]);

  return (
    <>
      <FixedContainer ref={fixedRef}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingRight: '16px',
          }}
        >
          <Typography
            component="div"
            variant="subtitle"
            sx={{ mb: 1, mr: 2 }}
          >
            {title}
          </Typography>
          {showClearButton && (
            <Tooltip
              title="Clear all"
              placement="top"
            >
              <IconButton
                variant="alita"
                color="secondary"
                onClick={handleClear}
              >
                <ClearIcon
                  sx={{ fontSize: '16px' }}
                  fill={theme.palette.icon.fill.secondary}
                />
              </IconButton>
            </Tooltip>
          )}
        </div>
      </FixedContainer>
      <TagsContainer
        style={style}
        ref={tagsContainerRef}
      >
        {isLoading && (
          <SkeletonContainer fixedHeight={fixedHeight}>
            {Array.from({ length: 10 }).map((_, index) => (
              <ChipSkeleton
                variant="waved"
                key={index}
              />
            ))}
          </SkeletonContainer>
        )}

        {isSuccess && (
          <div>
            {sortedTagList.length > 0 ? (
              sortedTagList.map(tag => {
                const { id, name } = tag;
                return (
                  <StyledChip
                    key={id}
                    label={name}
                    onClick={handleClick(tag)}
                    isSelected={selectedTags.includes(name)}
                  />
                );
              })
            ) : (
              <Typography
                component="div"
                variant={'labelSmall'}
              >
                {`No ${title.toLowerCase()} to display.`}
              </Typography>
            )}
          </div>
        )}

        {isSuccess && sortedTagList.length > 0 && isFetching && page > 0 && (
          <div style={{ textAlign: 'center' }}>...</div>
        )}

        {isError && <Typography variant={'labelSmall'}>Failed to load.</Typography>}
      </TagsContainer>
    </>
  );
};

export default Categories;
