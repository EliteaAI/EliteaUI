import { memo } from 'react';

import { Box } from '@mui/material';

const YamlMergeEditor = memo(props => {
  const { hostRef } = props;
  const styles = yamlMergeEditorStyles();

  return (
    <Box
      ref={hostRef}
      sx={styles.host}
      data-testid="compare-yaml-merge-view"
    />
  );
});

YamlMergeEditor.displayName = 'YamlMergeEditor';

/** @type {MuiSx} */
const yamlMergeEditorStyles = () => ({
  host: ({ palette }) => ({
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    overflow: 'hidden',
    // The merge view scrolls both editors together, so unchanged lines stay on the same row
    '& .cm-mergeView': {
      flex: 1,
      minHeight: 0,
      overflowY: 'auto',
    },
    '& .cm-mergeViewEditor': {
      minWidth: 0,
    },
    '& .cm-mergeViewEditor + .cm-mergeViewEditor': {
      borderLeft: `0.0625rem solid ${palette.border.lines}`,
    },
    '& .cm-editor.cm-focused': {
      outline: `0.125rem solid ${palette.primary.main}`,
      outlineOffset: '-0.125rem',
    },
  }),
});

export default YamlMergeEditor;
