import { memo, useMemo } from 'react';

import { Box } from '@mui/material';

import { IndexDetailsTabs } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import { ToolkitLayoutConstants } from '@/[fsd]/features/toolkits/lib/constants';
import { Tab } from '@/[fsd]/shared/ui';

const { PANEL_GUTTER, PANEL_HEADER_HEIGHT } = ToolkitLayoutConstants;

const IndexDetailsTabsBand = memo(props => {
  const { activeTab, onChangeTab, configurationDisabled = false } = props;
  const styles = indexDetailsTabsBandStyles();

  const tabs = useMemo(
    () => [
      {
        value: IndexDetailsTabs.configuration,
        label: 'Configuration',
        tooltip: configurationDisabled ? 'Coming soon' : 'Configuration',
        buttonProps: { disabled: configurationDisabled },
      },
      {
        value: IndexDetailsTabs.activity,
        label: 'Activity',
        tooltip: 'Activity',
      },
    ],
    [configurationDisabled],
  );

  return (
    <Box
      sx={styles.root}
      data-testid="index-details-tabs"
    >
      <Tab.TabGroupButton
        arrayBtn={tabs}
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
