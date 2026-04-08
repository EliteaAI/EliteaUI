import { memo, useMemo } from 'react';

import { Box } from '@mui/material';

import { CodeExamplesConstants } from '@/[fsd]/features/settings/lib/constants';
import {
  CodePreviewContent,
  CodePreviewEmpty,
  CodePreviewHeader,
} from '@/[fsd]/features/settings/ui/ai-configuration/OpenAITemplate';

const { CODE_EXAMPLE_TYPES, CODE_EXAMPLE_LABELS } = CodeExamplesConstants;

const CodePreview = memo(props => {
  const {
    onClose,
    model,
    showCloseButton = true,
    sx,
    customHeaderActions = null,
    selectedLanguage,
    codeExample,
    editorLanguage,
    handleLanguageChange,
    models,
    selectedModel,
    onChangeModel,
  } = props;

  const styles = useMemo(() => codePreviewStyles(), []);
  const hasModelSelected = Boolean(model.integration_name && model.model_name);

  return (
    <Box sx={[styles.mainContainer, sx]}>
      <CodePreviewHeader
        selectedLanguage={selectedLanguage}
        onLanguageChange={handleLanguageChange}
        onClose={onClose}
        hasModelSelected={hasModelSelected}
        showCloseButton={showCloseButton}
        customHeaderActions={customHeaderActions}
        codeExampleTypes={CODE_EXAMPLE_TYPES}
        codeExampleLabels={CODE_EXAMPLE_LABELS}
        models={models}
        selectedModel={selectedModel}
        onChangeModel={onChangeModel}
      />

      <Box sx={styles.contentContainer}>
        {!hasModelSelected ? (
          <CodePreviewEmpty />
        ) : (
          <CodePreviewContent
            codeExample={codeExample}
            editorLanguage={editorLanguage}
            modelName={model.model_name}
          />
        )}
      </Box>
    </Box>
  );
});

CodePreview.displayName = 'CodePreview';

/** @type {MuiSx} */
const codePreviewStyles = () => ({
  mainContainer: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minHeight: '12.5rem',
  },
  contentContainer: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
});

export default CodePreview;
