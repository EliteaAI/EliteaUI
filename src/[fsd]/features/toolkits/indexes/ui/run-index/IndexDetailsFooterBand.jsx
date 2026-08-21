import { memo } from 'react';

import { Box } from '@mui/material';

import { ToolkitLayoutConstants } from '@/[fsd]/features/toolkits/lib/constants';
import { Button } from '@/[fsd]/shared/ui';
import IndexingIcon from '@/assets/indexing.svg?react';

const { PANEL_FOOTER_HEIGHT } = ToolkitLayoutConstants;

const IndexDetailsFooterBand = memo(props => {
  const {
    isRunActive,
    isStoppingIndexing,
    canStopIndexing = true,
    onStop,
    reindexDisabled = false,
    onReindex,
  } = props;
  const styles = indexDetailsFooterBandStyles();

  return (
    <Box sx={styles.root}>
      {isRunActive ? (
        <Button.BaseBtn
          data-testid="index-details-footer-action"
          variant={Button.BUTTON_VARIANTS.alarm}
          disabled={isStoppingIndexing || !canStopIndexing}
          onClick={onStop}
        >
          {isStoppingIndexing ? 'Stopping...' : canStopIndexing ? 'Stop' : 'Starting...'}
        </Button.BaseBtn>
      ) : (
        <Button.BaseBtn
          data-testid="index-details-footer-action"
          variant={Button.BUTTON_VARIANTS.elitea}
          disabled={reindexDisabled}
          onClick={onReindex}
          startIcon={<IndexingIcon />}
        >
          Reindex
        </Button.BaseBtn>
      )}
    </Box>
  );
});

IndexDetailsFooterBand.displayName = 'IndexDetailsFooterBand';

/** @type {MuiSx} */
const indexDetailsFooterBandStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '100%',
    height: PANEL_FOOTER_HEIGHT,
    padding: '0.5rem 1rem',
    background: palette.background.section,
    borderTop: `0.0625rem solid ${palette.border.table}`,
  }),
});

export default IndexDetailsFooterBand;
