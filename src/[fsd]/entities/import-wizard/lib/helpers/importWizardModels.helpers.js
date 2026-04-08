import { DEFAULT_MAX_TOKENS, DEFAULT_TEMPERATURE } from '@/[fsd]/shared/lib/constants/llmSettings.constants';
import { DEFAULT_CUT_OFF_SCORE, DEFAULT_FETCH_K, DEFAULT_PAGE_TOP_K } from '@/common/constants';

const getDefaultModel = (model = {}, modelOptions, nameField = 'model_name') => {
  const modelsList = modelOptions.items;
  const model_name = model?.[nameField];
  const modelExists = modelsList.find(m => model_name && m.name === model_name);

  if (modelExists)
    return {
      [nameField]: model_name,
    };
  else
    return {
      [nameField]: modelsList[0]?.name || '',
    };
};

export const setDefaultModelsForImportedDatasources = (
  importedDatasources,
  modelOptions,
  embeddingModelOptions,
) => {
  // TODO: maximum_length should be replaced with max_tokens when BE is ready.
  const datasources = [];

  importedDatasources?.forEach(datasource => {
    const newDatasource = {
      ...datasource,
    };
    const model = getDefaultModel(
      {
        model_name: datasource.embedding_model_settings.model_name,
        embedding_model: datasource.embedding_model,
      },
      embeddingModelOptions,
      'model_name',
      'embedding_model',
    );
    newDatasource.embedding_model_settings = {
      model_name: model.model_name,
    };
    newDatasource.embedding_model = model.embedding_model;
    newDatasource.versions = datasource.versions.map(version => {
      const newVersion = { ...version };
      const datasource_settings = { ...version.datasource_settings };
      const { chat, search, deduplicate } = datasource_settings;
      {
        // chat
        const newChat = {};
        const { chat_settings_ai, chat_settings_embedding } = chat || {};
        {
          // chat_settings_ai
          const defaultModel = getDefaultModel(chat_settings_ai, modelOptions);
          newChat.chat_settings_ai = {
            ...(chat_settings_ai || {
              temperature: DEFAULT_TEMPERATURE,
              maximum_length: DEFAULT_MAX_TOKENS, // ??? see TODO above (line 76)
            }),
            ...defaultModel,
          };
        }
        {
          // chat_settings_embedding
          const defaultModel = getDefaultModel(chat_settings_embedding, embeddingModelOptions);
          newChat.chat_settings_embedding = {
            ...(chat_settings_embedding || {
              fetch_k: DEFAULT_FETCH_K,
              page_top_k: DEFAULT_PAGE_TOP_K,
              cut_off_score: DEFAULT_CUT_OFF_SCORE,
            }),
            ...defaultModel,
          };
        }
        newVersion.datasource_settings.chat = newChat;
      }
      {
        // search
        const newSearch = {};
        const { chat_settings_embedding } = search || {};
        {
          // chat_settings_embedding
          const defaultModel = getDefaultModel(chat_settings_embedding, embeddingModelOptions);
          newSearch.chat_settings_embedding = {
            ...(chat_settings_embedding || {
              fetch_k: DEFAULT_FETCH_K,
              page_top_k: DEFAULT_PAGE_TOP_K,
              cut_off_score: DEFAULT_CUT_OFF_SCORE,
            }),
            ...defaultModel,
          };
        }
        newVersion.datasource_settings.search = newSearch;
      }
      {
        // deduplicate
        const newDeduplicate = {};
        const { chat_settings_embedding } = deduplicate || {};
        {
          // chat_settings_embedding
          const defaultModel = getDefaultModel(chat_settings_embedding, embeddingModelOptions);
          newDeduplicate.chat_settings_embedding = {
            ...(chat_settings_embedding || {
              cut_off_score: DEFAULT_CUT_OFF_SCORE,
              show_additional_metadata: false,
              exclude_fields: '',
            }),
            ...defaultModel,
          };
        }
        newVersion.datasource_settings.deduplicate = newDeduplicate;
      }
      return newVersion;
    });
    datasources.push(newDatasource);
  });
  return datasources;
};

export const setDefaultModelsForImportedAgents = (importedAgents, modelOptions) => {
  const agents = [];

  importedAgents?.forEach(agent => {
    const newAgent = {
      ...agent,
    };
    if (agent.versions) {
      const newVersions = [];
      const seenNames = new Set();
      agent.versions.forEach(version => {
        const newVersion = {
          ...version,
        };

        // Rename agent_type "agent" to "openai" for backward compatibility
        if (newVersion.agent_type === 'agent') newVersion.agent_type = 'openai';

        // Rename "latest" or empty names to "base"
        if (!newVersion.name || newVersion.name === 'latest') {
          newVersion.name = 'base';
        }
        // Deduplicate versions by name (keep first occurrence)
        if (seenNames.has(newVersion.name)) {
          return; // Skip duplicate
        }
        seenNames.add(newVersion.name);
        const { llm_settings = {} } = version;
        const model = getDefaultModel(llm_settings, modelOptions);
        newVersion['llm_settings'] = {
          ...llm_settings,
          ...model,
        };
        newVersions.push(newVersion);
      });
      newAgent.versions = [...newVersions];
    }
    agents.push(newAgent);
  });
  return agents;
};

export const rematchModels = ({ importItems, modelOptions, embeddingModelOptions }) => {
  const rematchedImportItems = importItems?.map(item => {
    if (item.entity === 'datasources')
      return setDefaultModelsForImportedDatasources([item], modelOptions, embeddingModelOptions)[0];
    else if (item.entity === 'agents') return setDefaultModelsForImportedAgents([item], modelOptions)[0];
    else return item;
  });
  return rematchedImportItems;
};
