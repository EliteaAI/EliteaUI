import { memo } from 'react';

import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { EditViewTabsEnum } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';

const IndexViewToggler = memo(props => {
  const { activeTab, onChangeTab, disableRunTabReason, disableHistoryTabReason } = props;
  const styles = indexViewTogglerStyles();

  return (
    <Box sx={styles.wrapper}>
      <ToggleButtonGroup
        size="small"
        value={activeTab}
        onChange={onChangeTab}
        exclusive={true}
        aria-label="Edit Index Toggler"
      >
        <Tooltip
          title={disableRunTabReason}
          placement="top"
        >
          <Box component="span">
            <ToggleButton
              variant="elitea"
              value={EditViewTabsEnum.run}
              key={EditViewTabsEnum.run}
              sx={[styles.toggleBtn, { borderRadius: '8px 0 0 8px' }]}
              disabled={!!disableRunTabReason}
            >
              {EditViewTabsEnum.run}
            </ToggleButton>
          </Box>
        </Tooltip>

        <ToggleButton
          variant="elitea"
          value={EditViewTabsEnum.configuration}
          key={EditViewTabsEnum.configuration}
          sx={styles.toggleBtn}
        >
          {EditViewTabsEnum.configuration}
        </ToggleButton>

        <Tooltip
          title={disableHistoryTabReason}
          placement="top"
        >
          <Box component="span">
            <ToggleButton
              variant="elitea"
              value={EditViewTabsEnum.history}
              key={EditViewTabsEnum.history}
              sx={[styles.toggleBtn, { borderRadius: '0 8px 8px 0' }]}
              disabled={!!disableHistoryTabReason}
            >
              {EditViewTabsEnum.history}
            </ToggleButton>
          </Box>
        </Tooltip>
      </ToggleButtonGroup>
    </Box>
  );
});

IndexViewToggler.displayName = 'IndexViewToggler';

/** @type {MuiSx} */
const indexViewTogglerStyles = () => ({
  wrapper: {
    marginBottom: '1.5rem',
  },

  toggleBtn: {
    textTransform: 'capitalize',
  },
});

export default IndexViewToggler;
