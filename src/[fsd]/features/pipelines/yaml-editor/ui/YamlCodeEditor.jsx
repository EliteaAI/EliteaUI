import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useSelector } from 'react-redux';

import { Box } from '@mui/material';

import { useLanguageLinter } from '@/[fsd]/shared/lib/hooks';
import { Field } from '@/[fsd]/shared/ui';
import { selectActivePipeline } from '@/slices/pipeline';
import { openSearchPanel } from '@codemirror/search';
import { Prec } from '@codemirror/state';
import { keymap } from '@codemirror/view';

// Ctrl/Cmd+F is bound by the editor; these open the same panel, which has the replace field
const replaceKeymap = Prec.high(
  keymap.of([
    { key: 'Mod-h', run: openSearchPanel, preventDefault: true },
    { key: 'Mod-Alt-f', run: openSearchPanel, preventDefault: true },
  ]),
);

const YamlCodeEditor = memo(props => {
  const {
    code,
    onChangeCode,
    onBlur,
    disabled,
    // The single-node editor must not load the whole pipeline YAML on a pipeline reset
    syncWithPipelineReset = true,
    minHeight = '25rem',
    contentTestId,
    'data-testid': dataTestId = 'pipeline-yaml-editor',
  } = props;

  const editorRef = useRef();

  const { extensions: lintExtensions } = useLanguageLinter('yaml');
  const extensions = useMemo(() => [replaceKeymap, ...lintExtensions], [lintExtensions]);

  const {
    resetFlag,
    initState: { yamlCode },
  } = useSelector(selectActivePipeline);

  useEffect(() => {
    if (resetFlag && syncWithPipelineReset) {
      editorRef.current?.setCode(yamlCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetFlag]);

  const styles = yamlCodeEditorStyles();

  return (
    <Box
      sx={styles.container}
      data-testid={dataTestId}
    >
      <Field.CodeMirrorEditor
        className="nopan nodrag nowheel"
        value={code}
        extensions={extensions}
        height="100%"
        minHeight={minHeight}
        notifyChange={onChangeCode}
        onBlur={onBlur}
        ref={editorRef}
        readOnly={disabled}
        contentTestId={contentTestId}
      />
    </Box>
  );
});

YamlCodeEditor.displayName = 'YamlCodeEditor';

/** @type {MuiSx} */
const yamlCodeEditorStyles = () => ({
  container: ({ palette }) => ({
    width: '100%',
    maxWidth: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    '& .error_yaml_code': {
      backgroundColor: palette.alert.error.background,
      background: palette.alert.error.background,
    },
  }),
});

export default YamlCodeEditor;
