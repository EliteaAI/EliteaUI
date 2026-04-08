import { memo } from 'react';

import { Box } from '@mui/material';

import { Field } from '@/[fsd]/shared/ui';
import { getExtensionsByLang } from '@/hooks/useCodeMirrorLanguageExtensions';

const CodePreviewContent = memo(({ codeExample, editorLanguage, modelName }) => {
  const styles = getStyles();

  return (
    <Box sx={styles.codeEditorContainer}>
      <Field.CodeMirrorEditor
        key={`code-preview-${editorLanguage}-${modelName || 'default'}`}
        value={codeExample}
        language={editorLanguage}
        readOnly={true}
        extensions={getExtensionsByLang(editorLanguage)?.extensionWithoutLinter || []}
        autoHeight={true}
        maxHeight="none"
        variant="caption"
        width="100%"
      />
    </Box>
  );
});

CodePreviewContent.displayName = 'CodePreviewContent';

/** @type {MuiSx} */
const getStyles = () => ({
  codeEditorContainer: ({ palette }) => ({
    height: '100%',
    overflowY: 'auto',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    display: 'flex',
    flexDirection: 'column',
    // Enhanced CodeMirror styling for consistent background
    '&::-webkit-scrollbar': {
      width: '0.25rem',
      height: '0.25rem',
    },
    '&::-webkit-scrollbar-track': {
      background: palette.background.default,
    },
    '&::-webkit-scrollbar-thumb': {
      background: palette.border.lines,
      borderRadius: '0.125rem',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: palette.text.tertiary,
    },
    // Force CodeMirror to use consistent background
    '& .cm-editor': {
      height: 'auto !important',
      minHeight: '100%',
      maxHeight: 'none !important',
      backgroundColor: `${palette.background.default} !important`,
    },
    '& .cm-scroller': {
      overflow: 'visible !important',
      maxHeight: 'none !important',
      backgroundColor: `${palette.background.default} !important`,
    },
    '& .cm-content': {
      minHeight: 'auto',
      padding: '0.75rem',
      backgroundColor: `${palette.background.default} !important`,
    },
    '& .cm-focused': {
      outline: 'none',
      backgroundColor: `${palette.background.default} !important`,
    },
    // Override any CodeMirror theme background
    '& .cm-editor.cm-editor.cm-editor': {
      backgroundColor: `${palette.background.default} !important`,
    },
    '& .cm-theme-dark, & .cm-theme-light': {
      backgroundColor: `${palette.background.default} !important`,
    },
  }),
});

export default CodePreviewContent;
