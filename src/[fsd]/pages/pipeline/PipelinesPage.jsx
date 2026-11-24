import { memo, useMemo } from 'react';

import { useSortQueryParamsFromUrl } from '@/[fsd]/shared/lib/hooks';
import { PUBLIC_VIEWS, SECTION_PAGE_KEYS, SectionPage } from '@/[fsd]/widgets/section-page';
import { CollectionStatus, ContentType, SortFields, SortOrderOptions } from '@/common/constants';
import { useTrendRange } from '@/components/DateRangeSelect';
import Latest from '@/pages/Pipelines/Latest';
import MyLiked from '@/pages/Pipelines/MyLiked';
import PrivatePipelinesList from '@/pages/Pipelines/PrivatePipelinesList';
import Trending from '@/pages/Pipelines/Trending';

const ALL_STATUSES = [CollectionStatus.All];

const PipelinesPage = memo(() => {
  const { sort_by: sortBy, sort_order: sortOrder } = useSortQueryParamsFromUrl({
    defaultSortBy: SortFields.CreatedAt,
    defaultSortOrder: SortOrderOptions.DESC,
  });
  const { trendRange } = useTrendRange();

  const projectContent = useMemo(
    () => (
      <PrivatePipelinesList
        sortBy={sortBy}
        sortOrder={sortOrder}
        statuses={ALL_STATUSES}
        cardContentType={ContentType.PipelineAll}
      />
    ),
    [sortBy, sortOrder],
  );

  const publicViews = useMemo(
    () => ({
      [PUBLIC_VIEWS.latest]: <Latest />,
      [PUBLIC_VIEWS.myLiked]: <MyLiked />,
      [PUBLIC_VIEWS.trending]: <Trending trendRange={trendRange} />,
      [PUBLIC_VIEWS.admin]: (
        <PrivatePipelinesList
          sortBy={sortBy}
          sortOrder={sortOrder}
          statuses={ALL_STATUSES}
          cardContentType={ContentType.PipelineAdmin}
        />
      ),
    }),
    [sortBy, sortOrder, trendRange],
  );

  return (
    <SectionPage
      sectionKey={SECTION_PAGE_KEYS.pipelines}
      projectContent={projectContent}
      publicViews={publicViews}
    />
  );
});

PipelinesPage.displayName = 'PipelinesPage';

export default PipelinesPage;
