import { Fragment, memo, useMemo } from 'react';

import { useSelector } from 'react-redux';

import { Box, Tooltip } from '@mui/material';

import { AI_CONFIG_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants/aiConfigurationTourTargets.constants';
import {
  useCopyConfiguration,
  useModelConfiguration,
  useModelOptions,
} from '@/[fsd]/features/settings/lib/hooks';
import FieldWithCopy from '@/[fsd]/features/settings/ui/ai-providers/FieldWithCopy';
import { Button } from '@/[fsd]/shared/ui';
import { useListModelsQuery } from '@/api';
import { PUBLIC_PROJECT_ID } from '@/common/constants';
import CopyIcon from '@/components/Icons/CopyIcon';
import { useMultiSectionConfigurations } from '@/hooks/useMultiSectionConfigurations';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const AIConfiguration = memo(() => {
  const projectId = useSelectedProjectId();
  const user = useSelector(state => state.user);
  const userApiUrl = user?.api_url || '';
  // Fetch all model data
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

  const { data: asrData = { items: [], total: 0, default_model_name: '', default_model_project_id: '' } } =
    useListModelsQuery(
      { projectId, include_shared: projectId != PUBLIC_PROJECT_ID, section: 'asr' },
      { skip: !projectId },
    );

  const { data: ttsData = { items: [], total: 0, default_model_name: '', default_model_project_id: '' } } =
    useListModelsQuery(
      { projectId, include_shared: projectId != PUBLIC_PROJECT_ID, section: 'tts' },
      { skip: !projectId },
    );
  const { uniqueConfigurations } = useModelOptions({
    configurations: modelsData.items,
    embeddingModelsData,
    vectorStorageData,
    imageGenerationData,
    asrData,
    ttsData,
  });

  const { model } = useModelConfiguration({
    projectId,
    uniqueConfigurations,
  });

  // Get multi-section configurations
  const { data: availableConfigurations } = useMultiSectionConfigurations(
    ['llm', 'embedding', 'vectorstorage', 'ai_credentials', 'image_generation', 'asr', 'tts'],
    projectId,
  );

  // Group configurations by section
  const configurationsBySections = useMemo(() => {
    if (!availableConfigurations)
      return {
        llm: [],
        embedding: [],
        vectorstorage: [],
        ai_credentials: [],
        image_generation: [],
        asr: [],
        tts: [],
      };
    return {
      llm: availableConfigurations
        .filter(config => config.section === 'llm')
        .map(config => ({
          ...config,
          default:
            config.data?.name === modelsData.default_model_name &&
            (!modelsData.default_model_project_id ||
              modelsData.default_model_project_id === config.project_id),
        })),
      embedding: availableConfigurations.filter(config => config.section === 'embedding'),
      vectorstorage: availableConfigurations.filter(config => config.section === 'vectorstorage'),
      ai_credentials: availableConfigurations.filter(config => config.section === 'ai_credentials'),
      image_generation: availableConfigurations.filter(config => config.section === 'image_generation'),
      asr: availableConfigurations.filter(config => config.section === 'asr'),
      tts: availableConfigurations.filter(config => config.section === 'tts'),
    };
  }, [availableConfigurations, modelsData.default_model_name, modelsData.default_model_project_id]);

  const { handleCopyCardInformation } = useCopyConfiguration({
    model,
    projectId,
    uniqueConfigurations,
    userApiUrl: user.api_url,
    configurationsBySections,
  });

  const styles = useMemo(() => projectAIConfigurationStyles(), []);

  return (
    <Fragment>
      <Tooltip
        title="Copy to clipboard"
        placement="top"
      >
        <Button.BaseBtn
          onClick={handleCopyCardInformation}
          variant="elitea"
          color="secondary"
          sx={styles.copyButton}
        >
          <CopyIcon
            sx={styles.copyIcon}
            fill="currentColor"
          />
        </Button.BaseBtn>
      </Tooltip>
      <Box
        data-tour={AI_CONFIG_TOUR_TARGET_IDS.serverConfig}
        sx={styles.projectConfigSection}
      >
        <Box sx={styles.fieldsGrid}>
          <FieldWithCopy
            label="OpenAI-BaseURL:"
            value={userApiUrl ? `${userApiUrl.replace('/api/v2', '')}/llm/v1` : 'Not configured'}
          />
        </Box>
        <Box sx={styles.fieldsGrid}>
          <FieldWithCopy
            label="Server URL:"
            value={userApiUrl || 'Not configured'}
          />
        </Box>
        {model.project_id && (
          <Box sx={styles.fieldsGrid}>
            <FieldWithCopy
              label="OpenAI-Project:"
              value={model.project_id}
            />
          </Box>
        )}
        <Box sx={styles.fieldsGrid}>
          <FieldWithCopy
            label="Project ID:"
            value={projectId || 'Not configured'}
          />
        </Box>
      </Box>
    </Fragment>
  );
});

AIConfiguration.displayName = 'AIConfiguration';

/** @type {MuiSx} */
const projectAIConfigurationStyles = () => ({
  projectConfigSection: {
    flexShrink: 0,
    padding: '1rem 1.5rem',
    gap: '0.5rem',
    width: '100%',
    borderRadius: '0.75rem',
    border: ({ palette }) => `0.0625rem solid ${palette.border.lines}`,
  },
  fieldsGrid: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
    gap: '1rem',
  },
  copyButton: {
    position: 'absolute',
    top: '0.5rem',
    right: '0rem',
    minWidth: '1.75rem !important',
    maxWidth: '1.75rem !important',
    width: '1.75rem !important',
    height: '1.75rem !important',
    padding: '0rem !important',
  },
  copyIcon: {
    width: '.875rem',
    height: '.875rem',
  },
});

export default AIConfiguration;
