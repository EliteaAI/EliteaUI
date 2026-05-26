import RouteDefinitions from '@/routes';

import { AI_CONFIG_TOUR_TARGETS } from './aiConfigurationTourTargets.constants';
import { AI_CONFIG_TOUR_ID, PERSONAL_TOKENS_TOUR_ID } from './tourIds.constants';

export { AI_CONFIG_TOUR_ID };

export const AI_CONFIG_TOUR_COMPLETION = {
  keepExploring: [
    {
      label: 'Personal Tokens',
      tourId: PERSONAL_TOKENS_TOUR_ID,
      path: RouteDefinitions.SettingsWithTab.replace(':tab', 'tokens'),
    },
  ],
};

export const aiConfigurationTourSteps = [
  {
    id: 'what-is-ai-config',
    target: AI_CONFIG_TOUR_TARGETS.page,
    placement: 'center',
    title: 'What is AI Configuration?',
    content: `AI Configuration is the project-level settings area where you connect ELITEA to the AI services it needs to function — language models, embedding models, vector storage, and image generation. All agents, pipelines, and chat conversations in the project draw from these configured integrations.

Settings in this section are project-specific. Use the project selector to view or modify configurations for a particular project.`,
  },
  {
    id: 'server-configuration',
    target: AI_CONFIG_TOUR_TARGETS.serverConfig,
    placement: 'bottom',
    title: 'Server Configuration',
    content: `The AI Configuration page displays key connection details for your project — including the OpenAI-compatible base URL, project identifier, server URL, and project ID. Click any field to copy its value, or use the copy-all button to copy everything at once. These values are used when connecting external tools, SDKs, or IDE integrations to ELITEA's API.`,
  },
  {
    id: 'integration-types',
    target: AI_CONFIG_TOUR_TARGETS.integrations,
    placement: 'bottom',
    title: 'Integration Types',
    content: `All AI integrations are managed from the **Integrations** section. Click **+** to add a new integration. Four integration types are supported, each serving a distinct role in the platform.`,
  },
  {
    id: 'llm-models',
    target: AI_CONFIG_TOUR_TARGETS.llmModels,
    placement: 'right',
    title: 'LLM Models',
    content: `Language models used for generating responses in chat, agents, and pipelines. Each LLM integration is tied to a provider credential. Multiple models from different providers can be configured simultaneously, giving agents and users the flexibility to choose the right model for each task.

Designate which model serves as the default for each role. Changes take effect immediately and apply to all new conversations and agents — existing configurations are not affected:

- **Default** — used for new chats and agents unless a specific model is overridden at the agent or conversation level
- **High-tier** — assigned to complex, multi-step workflows that require stronger reasoning
- **Low-tier** — assigned to routine, cost-effective tasks`,
  },
  {
    id: 'embedding-models',
    target: AI_CONFIG_TOUR_TARGETS.embeddingModels,
    placement: 'top',
    title: 'Embedding Models',
    content: `Convert text into vector representations for semantic search and document indexing. Embedding models power RAG (Retrieval-Augmented Generation) workflows — they are required whenever a toolkit indexes content for semantic search. A project can have multiple embedding models configured; one is designated as the default for all indexing operations.`,
  },
  {
    id: 'vector-storage',
    target: AI_CONFIG_TOUR_TARGETS.vectorStorage,
    placement: 'top',
    title: 'Vector Storage',
    content: `Stores and queries the embedding vectors produced by embedding models. Vector storage is required for toolkit indexing and semantic search features. Configure one or more vector storage backends and designate one as the project default.`,
  },
  {
    id: 'image-generation',
    target: AI_CONFIG_TOUR_TARGETS.imageGeneration,
    placement: 'top',
    title: 'Image Generation',
    content: `Text-to-image models used by the **Image Creation** internal tool. When enabled on an agent or in Chat, the Image Creation tool calls the configured image generation model to produce images from text prompts. A project can have multiple image generation models; one is designated as the default.`,
  },
  {
    id: 'ai-credentials',
    target: AI_CONFIG_TOUR_TARGETS.aiCredentials,
    placement: 'top',
    title: 'AI Credentials',
    content: `AI Credentials store the API keys and connection details for each AI provider. They are created separately and referenced by model integrations — one credential can be reused across multiple models of the same provider. Supported providers and their required fields:

- **OpenAI** — API key and base URL
- **Azure OpenAI** — API key, endpoint, and API version
- **Vertex AI** — GCP project, region, and service account JSON
- **Amazon Bedrock** — AWS access key, secret key, and region
- **AI Dial** — API key, base URL, and API version
- **Ollama** — base URL for self-hosted models`,
  },
  {
    id: 'openai-template',
    target: AI_CONFIG_TOUR_TARGETS.openaiTemplateTab,
    placement: 'bottom',
    title: 'OpenAI Template',
    content: `The **OpenAI Template** tab generates ready-to-use code snippets for calling ELITEA's API in OpenAI-compatible format. Select a configured model and a target language — cURL, Node.js, or Python — to get a pre-filled example with your server URL and project ID already inserted. Copy or download the snippet directly from the page to use in your own integrations.`,
  },
];
