import { memo, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { useNodeYamlEditor } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { YamlCodeEditor } from '@/[fsd]/features/pipelines/yaml-editor/ui';

const NodeYamlView = memo(props => {
  const { flowNodeId, onRenamed, isReadOnly } = props;

  const { draft, error, onChangeCode, onEditorBlur } = useNodeYamlEditor({
    flowNodeId,
    onRenamed,
    isReadOnly,
  });
  const [isFullScreen, setIsFullScreen] = useState(false);

  const styles = nodeYamlViewStyles();

  // Shown under the editor in the panel, or under the full screen editor while it is open
  const errorText = error ? (
    <Typography
      variant="bodySmall"
      sx={styles.error}
      data-testid="pipeline-node-panel-yaml-error"
    >
      {error}
    </Typography>
  ) : null;

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
          copyMessage="Copied"
          copyButtonTestId="pipeline-node-panel-yaml-copy"
          fullScreenButtonTestId="pipeline-node-panel-yaml-full-screen"
          fullScreenModalTestId="pipeline-node-panel-yaml-full-screen-modal"
          fullScreenAfterContent={errorText}
          onFullScreenChange={setIsFullScreen}
        />
      </Box>
      {!isFullScreen && errorText}
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
    flex: 1,
    minHeight: 0,
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
    overflow: 'hidden',
  }),
  error: ({ palette }) => ({
    color: palette.text.error,
  }),
});

export default NodeYamlView;
