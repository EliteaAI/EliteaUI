import { memo } from 'react';

import { Box } from '@mui/material';

import { RunIndexBanner } from '@/[fsd]/features/toolkits/indexes/ui';

import SelectSearchTool from './SelectSearchTool';

const SuccessPanel = memo(props => {
  const { banner, showBanner, onSelectSearchTool, selectedSearchTool, searchToolOptions } = props;
  const styles = getStyles();

  return (
    <>
      {showBanner && (
        <RunIndexBanner
          banner={banner}
          isIndexing={false}
          isStoppingIndexing={false}
        />
      )}
      <Box sx={styles.body}>
        <SelectSearchTool
          searchToolOptions={searchToolOptions}
          selectedSearchTool={selectedSearchTool}
          onSelectSearchTool={onSelectSearchTool}
        />
      </Box>
    </>
  );
});

SuccessPanel.displayName = 'SuccessPanel';

/** @type {MuiSx} */
const getStyles = () => ({
  body: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    alignItems: 'center',
    flex: 1,
    minHeight: 0,
  },
});

export default SuccessPanel;
