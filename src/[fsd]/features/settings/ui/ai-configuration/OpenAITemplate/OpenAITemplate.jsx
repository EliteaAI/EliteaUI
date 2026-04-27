import { memo } from 'react';

import { Box, IconButton, Tooltip } from '@mui/material';

import { useCodePreview, useModelConfiguration, useModelOptions } from '@/[fsd]/features/settings/lib/hooks';
import { CodePreview } from '@/[fsd]/features/settings/ui/ai-configuration/OpenAITemplate';
import { useListModelsQuery } from '@/api/configurations.js';
import { PUBLIC_PROJECT_ID } from '@/common/constants';
import CopyIcon from '@/components/Icons/CopyIcon';
import DownloadIcon from '@/components/Icons/DownloadIcon';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const exampleToken = 'Your_Personal_Token';

const OpenAITemplate = memo(() => {
  const projectId = useSelectedProjectId();
  const styles = getStyles();

  const {
    data: modelsData = {
      items: [],
      total: 0,
      default_model_name: '',
      default_model_project_id: '',
      low_tier_default_model_name: '',
      low_tier_default_model_project_id: '',
      high_tier_default_model_name: '',
      high_tier_default_model_project_id: '',
    },
  } = useListModelsQuery(
    { projectId, include_shared: projectId != PUBLIC_PROJECT_ID, section: 'llm' },
    { skip: !projectId },
  );

  const {
    data: embeddingModelsData = { items: [], total: 0, default_model_name: '', default_model_project_id: '' },
  } = useListModelsQuery(
    { projectId, include_shared: projectId != PUBLIC_PROJECT_ID, section: 'embedding' },
    { skip: !projectId },
  );

  const {
    data: vectorStorageData = { items: [], total: 0, default_model_name: '', default_model_project_id: '' },
  } = useListModelsQuery(
    { projectId, include_shared: projectId != PUBLIC_PROJECT_ID, section: 'vectorstorage' },
    { skip: !projectId },
  );

  const {
    data: imageGenerationData = { items: [], total: 0, default_model_name: '', default_model_project_id: '' },
  } = useListModelsQuery(
    { projectId, include_shared: projectId != PUBLIC_PROJECT_ID, section: 'image_generation' },
    { skip: !projectId },
  );

  // Use custom hooks for state management
  const { uniqueConfigurations } = useModelOptions({
    configurations: modelsData.items,
    embeddingModelsData,
    vectorStorageData,
    imageGenerationData,
  });

  const { model, selectedModelFromConfigurations, onChangeModel } = useModelConfiguration({
    projectId,
    uniqueConfigurations,
  });

  const { selectedLanguage, codeExample, editorLanguage, handleLanguageChange, handleCopy, handleDownload } =
    useCodePreview(model, exampleToken);

  // Placeholder token for code examples
  const hasModelSelected = Boolean(model.integration_name && model.model_name);

  return (
    <Box sx={styles.container}>
      <Box sx={styles.mainContainer}>
        <Box sx={styles.buttons}>
          {hasModelSelected && (
            <Tooltip
              title="Copy to clipboard"
              placement="top"
            >
              <IconButton
                variant="alita"
                color="secondary"
                onClick={handleCopy}
              >
                <CopyIcon sx={styles.actionIcon} />
              </IconButton>
            </Tooltip>
          )}

          {/* Download button */}
          {hasModelSelected && (
            <Tooltip
              title="Download code example"
              placement="top"
            >
              <IconButton
                variant="alita"
                color="secondary"
                onClick={handleDownload}
              >
                <DownloadIcon sx={styles.actionIcon} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <CodePreview
          model={model}
          showCloseButton={false}
          models={uniqueConfigurations}
          selectedModel={selectedModelFromConfigurations}
          onChangeModel={onChangeModel}
          sx={styles.codePreview}
          selectedLanguage={selectedLanguage}
          codeExample={codeExample}
          editorLanguage={editorLanguage}
          handleLanguageChange={handleLanguageChange}
        />
      </Box>
    </Box>
  );
});

OpenAITemplate.displayName = 'OpenAITemplate';

/**@type {MuiSx} */
const getStyles = () => ({
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    width: '100%',
  },
  mainContainer: {
    width: '100%',
    height: 'calc(100vh - 7.5rem)',
    display: 'flex',
    flexDirection: 'column',
  },

  codePreview: {
    height: '100%',
    minHeight: 0,
    width: '100%',
  },
  buttons: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  actionIcon: ({ palette }) => ({
    fontSize: '0.875rem',
    fill: palette.icon.fill.default,
  }),
});

export default OpenAITemplate;
