import { Box, Grid } from '@mui/material';

import { DiscoverySearchBar, useDiscoverySearchState } from '@/[fsd]/features/discovery-search';
import { useListLayout } from '@/[fsd]/shared/lib/context';
import { useSearchBar } from '@/[fsd]/shared/lib/hooks';
import {
  NAV_BAR_HEIGHT_TABLET,
  PAGE_PADDING,
  RIGHT_PANEL_HEIGHT_OFFSET,
  RIGHT_PANEL_WIDTH_OF_CARD_LIST_PAGE,
} from '@/common/constants';
import { filterProps } from '@/common/utils';

export const FixedGrid = styled(
  Grid,
  filterProps('offsetFromTop'),
)(({ offsetFromTop, theme }) => ({
  position: 'fixed',
  right: `${PAGE_PADDING}px`,
  width: `${RIGHT_PANEL_WIDTH_OF_CARD_LIST_PAGE}px`,
  paddingLeft: '1rem',
  top: offsetFromTop,
  [theme.breakpoints.down('tablet')]: {
    top: NAV_BAR_HEIGHT_TABLET,
  },
  zIndex: 1000,
}));

const ContainerBox = styled(
  Box,
  filterProps('offsetFromTop'),
)(() => ({
  maxHeight: `calc(100vh - 32px)`,
  width: `${RIGHT_PANEL_WIDTH_OF_CARD_LIST_PAGE}px`,
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
}));

export default function RightPanel({ children, offsetFromTop = RIGHT_PANEL_HEIGHT_OFFSET }) {
  const listLayout = useListLayout();
  const { showSearchBar, isPipelinesPage } = useSearchBar();
  const { searchString, setSearchString, searchTags, setSearchTags, onClear } = useDiscoverySearchState();

  const top = listLayout ? `${listLayout.rightPanelTop}px` : offsetFromTop;
  const showSearch = showSearchBar && !listLayout?.isSearchInToolbar;

  return (
    <FixedGrid
      size={{ xs: 3 }}
      offsetFromTop={top}
      sx={listLayout ? rightPanelStyles.sectionFrame(top) : undefined}
    >
      <ContainerBox
        offsetFromTop={top}
        sx={listLayout ? rightPanelStyles.sectionContainer(top) : undefined}
      >
        {showSearch && (
          <DiscoverySearchBar
            searchString={searchString}
            setSearchString={setSearchString}
            searchTags={searchTags}
            setSearchTags={setSearchTags}
            onClear={onClear}
            testId={isPipelinesPage ? 'pipeline-search-input' : 'agent-search-input'}
          />
        )}
        {children}
      </ContainerBox>
    </FixedGrid>
  );
}

/** @type {MuiSx} */
const rightPanelStyles = {
  // Under a section page's toolbar on every width, not under the old tablet nav bar; its right edge
  // follows the page padding, so the panel ends where the toolbar's «+ Add» ends
  sectionFrame:
    top =>
    ({ breakpoints }) => ({
      right: '1.5rem',
      [breakpoints.down('tablet')]: { top },
    }),
  sectionContainer: top => ({
    height: `calc(100vh - ${top} - 1rem)`,
    maxHeight: 'none',
    overflow: 'hidden',
    '& > *': { minHeight: 0, maxHeight: '100%' },
  }),
};
