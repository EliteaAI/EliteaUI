import { memo, useCallback, useEffect, useMemo } from 'react';

import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { EmptyStatePage } from '@/[fsd]/entities/empty-state-page';
import { useLoadSkills } from '@/[fsd]/features/skill/lib/hooks';
import skillsDarkImage from '@/assets/images/Skills_Dark_1.png';
import skillsLightImage from '@/assets/images/Skills_Light_1.png';
import { ContentType, ViewMode } from '@/common/constants';
import { buildErrorMessage, uniqueArrayByProp } from '@/common/utils';
import CardList from '@/components/CardList';
import RightInfoPanel from '@/components/RightInfoPanel';
import useCardList from '@/hooks/useCardList';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';

import PrivateSkillsListEmptyState from './PrivateSkillsListEmptyState';

const PrivateSkillsList = memo(props => {
  const {
    rightPanelOffset,
    sortBy = 'created_at',
    sortOrder = 'desc',
    cardContentType = ContentType.SkillAll,
  } = props;

  const { query } = useSelector(state => state.search);
  const { renderCard } = useCardList(ViewMode.Owner);
  const navigate = useNavigate();

  const {
    onLoadMoreSkills,
    data,
    isSkillsError,
    isMoreSkillsError,
    isSkillsFirstFetching,
    isSkillsFetching,
    skillsError,
    tagList,
    page,
    pageSize,
    setPage,
  } = useLoadSkills(sortBy, sortOrder, false);

  const { total } = data || {};
  const uniqueDataList = useMemo(() => uniqueArrayByProp(data?.rows || [], 'id'), [data?.rows]);

  const loadMore = useCallback(() => {
    const existsMore = total && uniqueDataList.length < total && (page + 1) * pageSize < total;
    if (!existsMore || isSkillsFetching || isSkillsFirstFetching) return;
    onLoadMoreSkills();
  }, [
    total,
    uniqueDataList.length,
    page,
    pageSize,
    isSkillsFetching,
    isSkillsFirstFetching,
    onLoadMoreSkills,
  ]);

  const { toastError } = useToast();
  useEffect(() => {
    if (isMoreSkillsError) {
      toastError(buildErrorMessage(skillsError));
    }
  }, [skillsError, isMoreSkillsError, toastError]);

  const EmptyStateConfig = useMemo(
    () => ({
      title: 'No skills yet',
      description:
        'Create your first skill to get started. Skills are reusable, markdown-based instructions you can attach to your agents.',
      imageDark: skillsDarkImage,
      imageLight: skillsLightImage,
      onCreateClick: () => navigate(RouteDefinitions.CreateSkill),
    }),
    [navigate],
  );

  return (
    <CardList
      hideStatusColumn
      key={cardContentType}
      cardList={uniqueDataList}
      total={total}
      isLoading={isSkillsFirstFetching}
      isError={isSkillsError}
      rightPanelOffset={rightPanelOffset}
      resetPageOnSort={() => setPage(0)}
      rightPanelContent={
        <RightInfoPanel
          tagList={tagList}
          entityType="skill"
        />
      }
      renderCard={renderCard}
      isLoadingMore={isSkillsFetching}
      loadMoreFunc={loadMore}
      cardType={cardContentType}
      customEmptyState={<EmptyStatePage {...EmptyStateConfig} />}
      emptyListPlaceHolder={<PrivateSkillsListEmptyState query={query} />}
    />
  );
});

PrivateSkillsList.displayName = 'PrivateSkillsList';

export default PrivateSkillsList;
