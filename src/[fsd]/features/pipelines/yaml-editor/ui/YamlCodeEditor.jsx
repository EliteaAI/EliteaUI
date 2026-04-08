import React, { memo, useEffect, useRef } from 'react';

import { useSelector } from 'react-redux';

import { Box, styled } from '@mui/material';

import { Field } from '@/[fsd]/shared/ui';
import { useLanguageLinter } from '@/hooks/useCodeMirrorLanguageExtensions';

const StyledCodeMirrorEditor = styled(Field.CodeMirrorEditor)({
  '& .error_yaml_code': {
    backgroundColor: 'rgba(215, 22, 22, 0.20)',
    background: 'rgba(215, 22, 22, 0.20)',
  },
});

const YamlCodeEditor = memo(props => {
  const { code, onChangeCode, disabled } = props;

  const editorRef = useRef();

  const { extensions } = useLanguageLinter('yaml');

  const {
    resetFlag,
    initState: { yamlCode },
  } = useSelector(state => state.pipeline);

  useEffect(() => {
    if (resetFlag) {
      editorRef.current?.setCode(yamlCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetFlag]);

  return (
    <Box sx={styles.container}>
      <StyledCodeMirrorEditor
        className="nopan nodrag nowheel"
        value={code}
        extensions={extensions}
        height="100%"
        minHeight="400px"
        notifyChange={onChangeCode}
        ref={editorRef}
        readOnly={disabled}
      />
    </Box>
  );
});

YamlCodeEditor.displayName = 'YamlCodeEditor';

const styles = {
  container: {
    width: '100%',
    maxWidth: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
  },
};

export default YamlCodeEditor;
