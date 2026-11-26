import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { NodeYamlHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { NodeDraftDiffHelpers } from '@/[fsd]/features/pipelines/node-ai-draft/lib/helpers';

const MARKERS = { added: '+', removed: '−', same: ' ' };

/** Edit mode: the draft YAML against the node as it was, line by line with +/− markers (spec AC-13) */
const NodeDraftYamlDiff = memo(props => {
  const { original, node } = props;
  const lines = useMemo(
    () =>
      NodeDraftDiffHelpers.diffYamlLines(
        NodeYamlHelpers.dumpNodeYaml(original),
        NodeYamlHelpers.dumpNodeYaml(node),
      ),
    [original, node],
  );
  const styles = nodeDraftYamlDiffStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="node-ai-yaml-diff"
    >
      {lines.map((line, index) => (
        <Box
          // Lines repeat, so the index is part of the key
          key={`${index}-${line.kind}`}
          sx={styles.line(line.kind)}
          data-kind={line.kind}
        >
          <Typography
            component="span"
            variant="bodySmall"
            sx={styles.marker}
          >
            {MARKERS[line.kind]}
          </Typography>
          <Typography
            component="span"
            variant="bodySmall"
            sx={styles.text}
          >
            {line.text}
          </Typography>
        </Box>
      ))}
    </Box>
  );
});

NodeDraftYamlDiff.displayName = 'NodeDraftYamlDiff';

/** @type {MuiSx} */
const nodeDraftYamlDiffStyles = () => ({
  root: ({ palette }) => ({
    fontFamily: 'monospace',
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
    padding: '0.5rem 0',
    maxHeight: '16rem',
    overflow: 'auto',
  }),
  line:
    kind =>
    ({ palette }) => ({
      display: 'flex',
      gap: '0.5rem',
      padding: '0 0.75rem',
      backgroundColor: kind === 'same' ? 'transparent' : palette.diff[kind],
    }),
  marker: {
    width: '0.75rem',
    flexShrink: 0,
    fontFamily: 'inherit',
  },
  text: {
    whiteSpace: 'pre-wrap',
    fontFamily: 'inherit',
  },
});

export default NodeDraftYamlDiff;
