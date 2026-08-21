import { memo } from 'react';

import { Box } from '@mui/material';

import { IndexDetailsTabs } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import { ToolkitLayoutConstants } from '@/[fsd]/features/toolkits/lib/constants';
import { Tab } from '@/[fsd]/shared/ui';

const { PANEL_GUTTER, PANEL_HEADER_HEIGHT } = ToolkitLayoutConstants;

const TABS = [
  {
    value: IndexDetailsTabs.configuration,
    label: 'Configuration',
    tooltip: 'Configuration',
  },
  {
    value: IndexDetailsTabs.activity,
    label: 'Activity',
    tooltip: 'Activity',
  },
];

const IndexDetailsTabsBand = memo(props => {
  const { activeTab, onChangeTab } = props;
  const styles = indexDetailsTabsBandStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="index-details-tabs"
    >
      <Tab.TabGroupButton
        arrayBtn={TABS}
        value={activeTab}
        onChange={onChangeTab}
        aria-label="Index details view"
      />
    </Box>
  );
});

IndexDetailsTabsBand.displayName = 'IndexDetailsTabsBand';

/** @type {MuiSx} */
const indexDetailsTabsBandStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    height: PANEL_HEADER_HEIGHT,
    padding: `0 ${PANEL_GUTTER}`,
    background: palette.background.section,
    borderBottom: `0.0625rem solid ${palette.border.table}`,
  }),
});

export default IndexDetailsTabsBand;
