import { memo } from 'react';

import { Box } from '@mui/material';

import { ToolkitLayoutConstants } from '@/[fsd]/features/toolkits/lib/constants';
import { Button } from '@/[fsd]/shared/ui';
import IndexingIcon from '@/assets/indexing.svg?react';

import IndexDetailsFooterAction from './IndexDetailsFooterAction';

const { PANEL_FOOTER_HEIGHT } = ToolkitLayoutConstants;

const IndexDetailsFooterBand = memo(props => {
  const {
    isRunActive,
    isStoppingIndexing,
    canStopIndexing = true,
    onStop,
    reindexDisabled = false,
    reindexTooltip,
    onReindex,
    isDirty = false,
    isSaving = false,
    saveDisabled = false,
    saveTooltip,
    onSave,
  } = props;
  const styles = indexDetailsFooterBandStyles();

  const runIsStoppable = canStopIndexing && !isStoppingIndexing;
  const stopLabel = isStoppingIndexing ? 'Stopping...' : canStopIndexing ? 'Stop' : 'Starting...';

  return (
    <Box sx={styles.root}>
      {isRunActive ? (
        <IndexDetailsFooterAction
          data-testid="index-details-footer-stop"
          variant={Button.BUTTON_VARIANTS.alarm}
          disabled={!runIsStoppable}
          onClick={onStop}
        >
          {stopLabel}
        </IndexDetailsFooterAction>
      ) : (
        <>
          {isDirty && (
            <IndexDetailsFooterAction
              data-testid="index-details-footer-save"
              variant={Button.BUTTON_VARIANTS.secondary}
              tooltip={saveTooltip}
              disabled={saveDisabled || isSaving}
              onClick={onSave}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </IndexDetailsFooterAction>
          )}
          <IndexDetailsFooterAction
            data-testid="index-details-footer-reindex"
            variant={Button.BUTTON_VARIANTS.elitea}
            tooltip={reindexTooltip}
            disabled={reindexDisabled || isSaving}
            onClick={onReindex}
            startIcon={<IndexingIcon />}
          >
            {isDirty ? 'Save & Reindex' : 'Reindex'}
          </IndexDetailsFooterAction>
        </>
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
    gap: '0.75rem',
    flexShrink: 0,
    width: '100%',
    height: PANEL_FOOTER_HEIGHT,
    padding: '0.5rem 1rem',
    background: palette.background.section,
    borderTop: `0.0625rem solid ${palette.border.table}`,
  }),
});

export default IndexDetailsFooterBand;
