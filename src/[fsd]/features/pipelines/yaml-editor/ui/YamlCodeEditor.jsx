import React, { memo, useEffect, useRef } from 'react';

import { useSelector } from 'react-redux';

import { Box } from '@mui/material';

import { useLanguageLinter } from '@/[fsd]/shared/lib/hooks';
import { Field } from '@/[fsd]/shared/ui';
import { selectActivePipeline } from '@/slices/pipeline';

const YamlCodeEditor = memo(props => {
  const { code, onChangeCode, disabled } = props;

  const editorRef = useRef();

  const { extensions } = useLanguageLinter('yaml');

  const {
    resetFlag,
    initState: { yamlCode },
  } = useSelector(selectActivePipeline);

  useEffect(() => {
    if (resetFlag) {
      editorRef.current?.setCode(yamlCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetFlag]);

  const styles = yamlCodeEditorStyles();

  return (
    <Box
      sx={styles.container}
      data-testid="pipeline-yaml-editor"
    >
      <Field.CodeMirrorEditor
        className="nopan nodrag nowheel"
        value={code}
        extensions={extensions}
        height="100%"
        minHeight="25rem"
        notifyChange={onChangeCode}
        ref={editorRef}
        readOnly={disabled}
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
      backgroundColor: palette.background.errorBkg,
      background: palette.background.errorBkg,
    },
  }),
});

export default YamlCodeEditor;
