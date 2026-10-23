import { memo, useCallback, useRef, useState } from 'react';

import { Box, Typography, useTheme } from '@mui/material';

import { NodeTypeSelector } from '@/[fsd]/features/pipelines/flow-editor/ui/add-node';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import emptyCanvasLightIllustration from '@/assets/images/Applications_Light_1.png';
import emptyCanvasDarkIllustration from '@/assets/pipeline-empty-canvas-dark.svg';
import PlusIcon from '@/assets/plus-icon.svg?react';

const CENTER_ORIGIN = { vertical: 'center', horizontal: 'center' };

const FlowEmptyState = memo(props => {
  const { onAddNode, disabled } = props;
  const theme = useTheme();
  const cardRef = useRef(null);
  const overlayRef = useRef(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const handleOpen = useCallback(event => {
    event.stopPropagation();
    setIsSelectorOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsSelectorOpen(false);
  }, []);

  const styles = flowEmptyStateStyles(isSelectorOpen);

  return (
    <Box
      ref={overlayRef}
      sx={styles.overlay}
    >
      <Box
        ref={cardRef}
        sx={styles.card}
        data-testid="pipeline-empty-state"
      >
        <Box
          component="img"
          src={theme.palette.mode === 'dark' ? emptyCanvasDarkIllustration : emptyCanvasLightIllustration}
          alt=""
          sx={styles.illustration}
        />
        <Typography
          variant="bodyMedium"
          color="text.secondary"
        >
          Start by adding your first node to the canvas!
        </Typography>
        {!disabled && (
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.special}
            startIcon={<PlusIcon />}
            onClick={handleOpen}
            data-testid="pipeline-empty-state-add-node-button"
          >
            Add Node
          </Button.BaseBtn>
        )}
      </Box>
      <NodeTypeSelector
        open={isSelectorOpen}
        anchorEl={cardRef.current}
        boundaryEl={overlayRef.current}
        onClose={handleClose}
        onSelect={onAddNode}
        anchorOrigin={CENTER_ORIGIN}
        transformOrigin={CENTER_ORIGIN}
      />
    </Box>
  );
});

FlowEmptyState.displayName = 'FlowEmptyState';

/** @type {MuiSx} */
const flowEmptyStateStyles = isSelectorOpen => ({
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
    zIndex: 5,
  },
  card: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    width: '26.25rem',
    maxWidth: 'calc(100% - 2rem)',
    padding: '2rem 2.5rem 1.5rem',
    boxSizing: 'border-box',
    borderRadius: '0.75rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: palette.background.default.secondary,
    pointerEvents: 'auto',
    visibility: isSelectorOpen ? 'hidden' : 'visible',
  }),
  illustration: {
    width: '12.3125rem',
    height: '7.6875rem',
    objectFit: 'contain',
  },
});

export default FlowEmptyState;
