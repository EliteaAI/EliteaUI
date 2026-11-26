import { memo, useCallback, useState } from 'react';

import { Box, Tooltip } from '@mui/material';

import { useNodeAiButtonState } from '@/[fsd]/features/pipelines/node-ai-draft/lib/hooks';
import NodeAiDraftModal from '@/[fsd]/features/pipelines/node-ai-draft/ui/NodeAiDraftModal';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import SparkleIcon from '@/assets/ai-sparkle-icon.svg?react';

/** Node panel sparkle button: Build with AI for an empty node, Edit with AI for a configured one */
const NodeAiButton = memo(props => {
  const { yamlNode, NodeComponent } = props;
  const { visible, enabled, mode, label, tooltip } = useNodeAiButtonState(yamlNode);
  const [openMode, setOpenMode] = useState(null);

  // The mode is fixed when the modal opens and doesn't follow later edits (AC-29c)
  const onOpen = useCallback(() => setOpenMode(mode), [mode]);
  const onClose = useCallback(() => setOpenMode(null), []);

  if (!visible) return null;

  const styles = nodeAiButtonStyles();

  return (
    <>
      <Tooltip
        title={tooltip}
        placement="top"
      >
        <Box component="span">
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.special}
            startIcon={<SparkleIcon />}
            disabled={!enabled}
            onClick={onOpen}
            sx={styles.button}
            aria-label={label}
            data-testid="pipeline-node-panel-build-with-ai"
          />
        </Box>
      </Tooltip>
      {openMode && (
        <NodeAiDraftModal
          open
          mode={openMode}
          yamlNode={yamlNode}
          NodeComponent={NodeComponent}
          onClose={onClose}
        />
      )}
    </>
  );
});

NodeAiButton.displayName = 'NodeAiButton';

/** @type {MuiSx} */
const nodeAiButtonStyles = () => ({
  // A disabled sparkle keeps its colours so it still reads as the AI action
  button: ({ palette }) => ({
    '&.Mui-disabled': {
      backgroundColor: palette.components.button.background.split.default,
      color: palette.components.split.text.default,
    },
  }),
});

export default NodeAiButton;
