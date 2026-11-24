import { memo, useCallback, useMemo } from 'react';

import { Box } from '@mui/material';

import { ApplicationCatalog } from '@/[fsd]/features/apps';
import { APPLICATIONS_TOUR_ID, APPLICATIONS_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours';
import ToolkitsList from '@/[fsd]/features/toolkits/ui/list/ToolkitsList';
import { SECTION_PAGE_KEYS, SectionPage } from '@/[fsd]/widgets/section-page';
import { ContentType } from '@/common/constants';

const MODE_TAB_TOUR_IDS = {
  project: APPLICATIONS_TOUR_TARGET_IDS.applicationsTab,
  discover: APPLICATIONS_TOUR_TARGET_IDS.catalogTab,
};

// Configured applications of the project (Yours / Team) and the App Catalog (Discover)
const Apps = memo(() => {
  const styles = appsStyles();

  const projectContent = useMemo(
    () => (
      <Box data-tour={APPLICATIONS_TOUR_TARGET_IDS.applicationsList}>
        <ToolkitsList
          isApplication
          cardContentType={ContentType.AppAll}
          disableEmptyRedirect
          showFolders={false}
        />
      </Box>
    ),
    [],
  );

  const renderDiscover = useCallback(({ query }) => <ApplicationCatalog query={query} />, []);

  return (
    <Box
      data-tour={APPLICATIONS_TOUR_TARGET_IDS.page}
      sx={styles.page}
    >
      <SectionPage
        sectionKey={SECTION_PAGE_KEYS.applications}
        projectContent={projectContent}
        renderDiscover={renderDiscover}
        modeTabTourIds={MODE_TAB_TOUR_IDS}
        modeTourId={APPLICATIONS_TOUR_ID}
      />
    </Box>
  );
});

Apps.displayName = 'Apps';

/** @type {MuiSx} */
const appsStyles = () => ({
  page: {
    height: '100%',
    display: 'flex',
    minWidth: 0,
  },
});

export default Apps;
