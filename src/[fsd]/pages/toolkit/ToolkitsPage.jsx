import { memo, useMemo } from 'react';

import ToolkitsList from '@/[fsd]/features/toolkits/ui/list/ToolkitsList';
import { SECTION_PAGE_KEYS, SectionPage } from '@/[fsd]/widgets/section-page';
import { ContentType } from '@/common/constants';

// Toolkits & Indexes, or MCPs with `isMCP`
const ToolkitsPage = memo(props => {
  const { isMCP = false } = props;

  const projectContent = useMemo(
    () => (
      <ToolkitsList
        isMCP={isMCP}
        cardContentType={isMCP ? ContentType.MCPAll : ContentType.ToolkitAll}
      />
    ),
    [isMCP],
  );

  return (
    <SectionPage
      key={isMCP ? SECTION_PAGE_KEYS.mcps : SECTION_PAGE_KEYS.toolkits}
      sectionKey={isMCP ? SECTION_PAGE_KEYS.mcps : SECTION_PAGE_KEYS.toolkits}
      projectContent={projectContent}
    />
  );
});

ToolkitsPage.displayName = 'ToolkitsPage';

export default ToolkitsPage;
