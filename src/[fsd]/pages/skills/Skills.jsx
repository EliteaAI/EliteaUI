import { memo, useCallback } from 'react';

import { PrivateSkillsList } from '@/[fsd]/features/skill';
import { SkillsTab } from '@/[fsd]/features/skill-hub/ui';
import { SECTION_PAGE_KEYS, SectionPage } from '@/[fsd]/widgets/section-page';
import { ContentType } from '@/common/constants';

const PROJECT_CONTENT = <PrivateSkillsList cardContentType={ContentType.SkillAll} />;

const Skills = memo(() => {
  const renderDiscover = useCallback(
    ({ query, showFilters, onFilterCountChange }) => (
      <SkillsTab
        query={query}
        showCategoryRail={showFilters}
        onSelectedCategoriesChange={onFilterCountChange}
      />
    ),
    [],
  );

  return (
    <SectionPage
      sectionKey={SECTION_PAGE_KEYS.skills}
      projectContent={PROJECT_CONTENT}
      renderDiscover={renderDiscover}
    />
  );
});

Skills.displayName = 'Skills';

export default Skills;
