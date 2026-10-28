import { memo, useCallback } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { useNodeYamlEditor } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { YamlCodeEditor } from '@/[fsd]/features/pipelines/yaml-editor/ui';
import { useToast } from '@/[fsd]/shared/lib/hooks';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { handleCopy } from '@/common/utils';
import CopyIcon from '@/components/Icons/CopyIcon';

const NodeYamlView = memo(props => {
  const { flowNodeId, onRenamed, isReadOnly } = props;
  const { toastInfo } = useToast();

  const { draft, error, onChangeCode, onEditorBlur } = useNodeYamlEditor({
    flowNodeId,
    onRenamed,
    isReadOnly,
  });

  const onCopy = useCallback(() => {
    handleCopy(draft);
    toastInfo('Copied');
  }, [draft, toastInfo]);

  const styles = nodeYamlViewStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="pipeline-node-panel-yaml"
    >
      <Box sx={styles.editor}>
        <YamlCodeEditor
          code={draft}
          onChangeCode={onChangeCode}
          onBlur={onEditorBlur}
          disabled={isReadOnly}
          syncWithPipelineReset={false}
          minHeight="100%"
          data-testid="pipeline-node-panel-yaml-editor"
          contentTestId="pipeline-node-panel-yaml-content"
        />
        <Tooltip
          title="Copy YAML"
          placement="top"
        >
          <Box
            component="span"
            sx={styles.copy}
          >
            <Button.BaseBtn
              variant={BUTTON_VARIANTS.tertiary}
              startIcon={<CopyIcon sx={styles.copyIcon} />}
              onClick={onCopy}
              aria-label="Copy YAML"
              data-testid="pipeline-node-panel-yaml-copy"
            />
          </Box>
        </Tooltip>
      </Box>
      {error && (
        <Typography
          variant="bodySmall"
          sx={styles.error}
          data-testid="pipeline-node-panel-yaml-error"
        >
          {error}
        </Typography>
      )}
    </Box>
  );
});

NodeYamlView.displayName = 'NodeYamlView';

/** @type {MuiSx} */
const nodeYamlViewStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
    minHeight: '20rem',
  },
  editor: ({ palette }) => ({
    position: 'relative',
    flex: 1,
    minHeight: 0,
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
    overflow: 'hidden',
  }),
  copy: {
    position: 'absolute',
    top: '0.25rem',
    right: '0.25rem',
    zIndex: 1,
  },
  copyIcon: {
    fontSize: '1rem',
  },
  error: ({ palette }) => ({
    color: palette.text.error,
  }),
});

export default NodeYamlView;
