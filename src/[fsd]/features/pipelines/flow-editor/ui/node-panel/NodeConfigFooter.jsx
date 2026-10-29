import { memo, useCallback, useContext } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { useNodeToolNames } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { FlowEditorContext } from '@/[fsd]/shared/lib/context';
import { useToast } from '@/[fsd]/shared/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import CopyIcon from '@/components/Icons/CopyIcon';
import DeleteIcon from '@/components/Icons/DeleteIcon';

const { PipelineNodeTypes } = FlowEditorConstants;

const DEPRECATED_DUPLICATE_TOOLTIP = "Deprecated nodes can't be duplicated";

const NodeConfigFooter = memo(props => {
  const {
    id,
    type,
    isEntrypoint,
    canMakeEntrypoint: canMakeEntrypointProp = true,
    canDuplicate = true,
  } = props;
  const { setYamlJsonObject, handleDeleteNode, handleDuplicateNode } = useContext(FlowEditorContext);
  const { toastSuccess } = useToast();
  const toolNames = useNodeToolNames();

  const canBeEntrypoint =
    canMakeEntrypointProp && type !== PipelineNodeTypes.Condition && type !== PipelineNodeTypes.Decision;

  const onMakeEntrypoint = useCallback(() => {
    setYamlJsonObject(prev => ({ ...prev, entry_point: id }));
    toastSuccess(`${id} is set as entrypoint`);
  }, [id, setYamlJsonObject, toastSuccess]);

  const onDelete = useCallback(() => {
    handleDeleteNode(id);
  }, [handleDeleteNode, id]);

  const onDuplicate = useCallback(() => {
    handleDuplicateNode?.(id, toolNames);
  }, [handleDuplicateNode, id, toolNames]);

  const styles = nodeConfigFooterStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="pipeline-node-panel-footer"
    >
      <Box>
        {isEntrypoint && (
          <Box
            sx={styles.entrypointState}
            data-testid="pipeline-node-panel-entrypoint-state"
          >
            <Typography
              variant="labelSmall"
              color="text.secondary"
            >
              Entrypoint
            </Typography>
          </Box>
        )}
        {!isEntrypoint && canBeEntrypoint && (
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.secondary}
            onClick={onMakeEntrypoint}
            data-testid="pipeline-node-panel-make-entrypoint"
          >
            Make Entrypoint
          </Button.BaseBtn>
        )}
      </Box>
      <Box sx={styles.actions}>
        {handleDuplicateNode && (
          <Tooltip
            title={canDuplicate ? 'Duplicate node' : DEPRECATED_DUPLICATE_TOOLTIP}
            placement="top"
          >
            <Box component="span">
              <Button.BaseBtn
                variant={BUTTON_VARIANTS.secondary}
                startIcon={<CopyIcon sx={styles.icon} />}
                onClick={onDuplicate}
                disabled={!canDuplicate}
                aria-label="Duplicate node"
                data-testid="pipeline-node-panel-duplicate"
              />
            </Box>
          </Tooltip>
        )}
        <Tooltip
          title="Delete"
          placement="top"
        >
          <Box component="span">
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.secondary}
              startIcon={<DeleteIcon sx={styles.icon} />}
              onClick={onDelete}
              aria-label="Delete node"
              data-testid="pipeline-node-panel-delete"
            />
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );
});

NodeConfigFooter.displayName = 'NodeConfigFooter';

/** @type {MuiSx} */
const nodeConfigFooterStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.5rem',
    borderTop: `0.0625rem solid ${palette.border.lines}`,
    flexShrink: 0,
  }),
  entrypointState: ({ palette }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    height: '1.75rem',
    padding: '0 1rem',
    boxSizing: 'border-box',
    borderRadius: '1rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    cursor: 'default',
  }),
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  icon: {
    fontSize: '1rem',
  },
});

export default NodeConfigFooter;
