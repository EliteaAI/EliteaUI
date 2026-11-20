import { memo, useCallback, useMemo } from 'react';

import { AgentsTab } from '@/[fsd]/features/agent-hub/ui';
import { useSortQueryParamsFromUrl } from '@/[fsd]/shared/lib/hooks';
import { PUBLIC_VIEWS, SECTION_PAGE_KEYS, SectionPage } from '@/[fsd]/widgets/section-page';
import { ContentType, SortFields, SortOrderOptions } from '@/common/constants';
import { useTrendRange } from '@/components/DateRangeSelect';
import Latest from '@/pages/Applications/Latest';
import MyLiked from '@/pages/Applications/MyLiked';
import PrivateAgentsList from '@/pages/Applications/PrivateAgentsList';
import Trending from '@/pages/Applications/Trending';

const AgentsPage = memo(() => {
  const { sort_by: sortBy, sort_order: sortOrder } = useSortQueryParamsFromUrl({
    defaultSortBy: SortFields.CreatedAt,
    defaultSortOrder: SortOrderOptions.DESC,
  });
  const { trendRange } = useTrendRange();

  const projectContent = useMemo(
    () => (
      <PrivateAgentsList
        sortBy={sortBy}
        sortOrder={sortOrder}
        cardContentType={ContentType.ApplicationAll}
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
        <PrivateAgentsList
          sortBy={sortBy}
          sortOrder={sortOrder}
          cardContentType={ContentType.ApplicationAdmin}
        />
      ),
    }),
    [sortBy, sortOrder, trendRange],
  );

  const renderDiscover = useCallback(
    ({ query, showFilters, onFilterCountChange }) => (
      <AgentsTab
        query={query}
        showCategoryRail={showFilters}
        onSelectedCategoriesChange={onFilterCountChange}
      />
    ),
    [],
  );

  return (
    <SectionPage
      sectionKey={SECTION_PAGE_KEYS.agents}
      projectContent={projectContent}
      renderDiscover={renderDiscover}
      publicViews={publicViews}
    />
  );
});

AgentsPage.displayName = 'AgentsPage';

export default AgentsPage;
