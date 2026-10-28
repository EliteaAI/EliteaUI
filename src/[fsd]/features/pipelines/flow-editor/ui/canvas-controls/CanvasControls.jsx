import { memo, useCallback, useRef, useState } from 'react';

import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import { Box } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import CanvasArrangeMenu from '@/[fsd]/features/pipelines/flow-editor/ui/canvas-controls/CanvasArrangeMenu';
import CanvasControlButton from '@/[fsd]/features/pipelines/flow-editor/ui/canvas-controls/CanvasControlButton';
import FitViewIcon from '@/assets/full-screen-icon.svg?react';
import LockIcon from '@/assets/lock-icon.svg?react';
import MinusIcon from '@/assets/minus-icon.svg?react';
import PlusIcon from '@/assets/plus-icon.svg?react';
import ArrangeIcon from '@/assets/polyline-outline-icon.svg?react';
import { Panel, useReactFlow } from '@xyflow/react';

const ZOOM_DURATION = 150;

const CanvasControls = memo(props => {
  const {
    isLocked,
    onToggleLock,
    orientation,
    onArrange,
    canArrange = true,
    isMinimapVisible,
    onToggleMinimap,
  } = props;

  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const arrangeButtonRef = useRef(null);
  const [arrangeAnchorEl, setArrangeAnchorEl] = useState(null);

  const handleZoomIn = useCallback(() => zoomIn({ duration: ZOOM_DURATION }), [zoomIn]);
  const handleZoomOut = useCallback(() => zoomOut({ duration: ZOOM_DURATION }), [zoomOut]);
  const handleFitView = useCallback(
    () => fitView({ ...FlowEditorConstants.FIT_VIEW_OPTIONS, duration: ZOOM_DURATION }),
    [fitView],
  );

  const handleOpenArrange = useCallback(() => setArrangeAnchorEl(arrangeButtonRef.current), []);
  const handleCloseArrange = useCallback(() => setArrangeAnchorEl(null), []);

  const styles = canvasControlsStyles();

  return (
    <Panel position="bottom-left">
      <Box
        sx={styles.root}
        data-testid="pipeline-canvas-controls"
      >
        <CanvasControlButton
          title="Zoom in"
          icon={<PlusIcon />}
          onClick={handleZoomIn}
          testId="pipeline-canvas-zoom-in"
        />
        <CanvasControlButton
          title="Zoom out"
          icon={<MinusIcon />}
          onClick={handleZoomOut}
          testId="pipeline-canvas-zoom-out"
        />
        <CanvasControlButton
          title="Fit view"
          icon={<FitViewIcon />}
          onClick={handleFitView}
          testId="pipeline-canvas-fit-view"
        />
        <CanvasControlButton
          title={isLocked ? 'Unlock canvas' : 'Lock canvas'}
          icon={isLocked ? <LockIcon /> : <LockOpenOutlinedIcon />}
          onClick={onToggleLock}
          isActive={isLocked}
          aria-pressed={isLocked}
          testId="pipeline-canvas-lock"
          data-locked={isLocked || undefined}
        />
        <CanvasControlButton
          ref={arrangeButtonRef}
          title="Auto-arrange"
          icon={<ArrangeIcon />}
          onClick={handleOpenArrange}
          disabled={!canArrange}
          isActive={Boolean(arrangeAnchorEl)}
          aria-haspopup="menu"
          testId="pipeline-canvas-arrange"
        />
        <CanvasControlButton
          title={isMinimapVisible ? 'Hide minimap' : 'Show minimap'}
          icon={<MapOutlinedIcon />}
          onClick={onToggleMinimap}
          isActive={isMinimapVisible}
          aria-pressed={isMinimapVisible}
          testId="pipeline-canvas-minimap-toggle"
        />
      </Box>
      <CanvasArrangeMenu
        anchorEl={arrangeAnchorEl}
        orientation={orientation}
        onArrange={onArrange}
        onClose={handleCloseArrange}
      />
    </Panel>
  );
});

CanvasControls.displayName = 'CanvasControls';

/** @type {MuiSx} */
const canvasControlsStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    padding: '0.25rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: palette.background.paper,
  }),
});

export default CanvasControls;
