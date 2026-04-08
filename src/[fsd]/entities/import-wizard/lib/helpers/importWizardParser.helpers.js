import yaml from 'js-yaml';
import { v4 as uuidv4 } from 'uuid';

import {
  setDefaultModelsForImportedAgents,
  setDefaultModelsForImportedDatasources,
  setDefaultStorageForImportedDatasources,
} from '@/[fsd]/entities/import-wizard/lib/helpers';
import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import {
  LAYOUT_VERSION,
  ORIENTATION,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants/flowEditor.constants';
import {
  FlowEditorHelpers,
  LayoutHelpers,
  ParsePipelineHelpers,
} from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { deepCloneObject } from '@/common/utils';

export const parseMdFrontmatter = content => {
  // Remove BOM and trim leading whitespace
  const cleanContent = content.replace(/^\uFEFF/, '').trimStart();

  if (!cleanContent.startsWith('---'))
    throw new Error(
      'is missing required metadata. Please ensure the file starts with a valid YAML frontmatter block (enclosed in ---)',
    );

  // Split on --- but only at line boundaries to avoid matching --- inside content
  const match = cleanContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);

  if (!match) throw new Error('Invalid MD format: missing closing ---');

  const frontmatter = yaml.load(match[1]);
  const body = (match[2] || '').trim();

  return { frontmatter, body };
};

const buildInstructionsBasedOnType = ({ agentType, frontmatter, body }) => {
  if (agentType === 'pipeline') {
    // For pipelines, reconstruct YAML instructions from frontmatter
    // NOTE: toolkits should NOT be included in pipeline instructions - they are processed separately
    const pipelineConfig = {};
    if (frontmatter.state) pipelineConfig.state = frontmatter.state;
    if (frontmatter.entry_point) pipelineConfig.entry_point = frontmatter.entry_point;
    if (frontmatter.nodes) pipelineConfig.nodes = frontmatter.nodes;
    if (frontmatter.interrupt_after) pipelineConfig.interrupt_after = frontmatter.interrupt_after;
    if (frontmatter.interrupt_before) pipelineConfig.interrupt_before = frontmatter.interrupt_before;

    const instructions = Object.keys(pipelineConfig).length > 0 ? yaml.dump(pipelineConfig) : '';

    // Use exported pipeline_settings when available to preserve the original visual layout.
    // Fall back to regenerating layout from YAML for older exports that lack this field.
    if (frontmatter.pipeline_settings) {
      return { instructions, pipelineSettings: frontmatter.pipeline_settings };
    }

    let parsedYamlJson = undefined;
    try {
      parsedYamlJson = yaml.load(instructions);
    } catch {
      // YAML parsing failed, parsedYamlJson remains undefined
    }
    const { nodes: parsedNodes, edges: parsedEdges } = ParsePipelineHelpers.parseYaml(
      parsedYamlJson,
      ORIENTATION.vertical,
    );
    const { nodes, edges } = LayoutHelpers.doLayout({
      nodes: parsedNodes,
      edges: parsedEdges,
      orientation: ORIENTATION.vertical,
      flowNodes: [],
    });

    return {
      instructions,
      pipelineSettings: {
        nodes: nodes.map(node => FlowEditorHelpers.convertNode(node, LAYOUT_VERSION)),
        edges,
        orientation: ORIENTATION.vertical,
        layout_version: LAYOUT_VERSION,
      },
    };
  } else return { instructions: body };
};

// Handle both top-level 'tools' and 'selected_tools' inside settings
const buildToolsFromToolkits = frontmatter =>
  (frontmatter.toolkits || []).map(config => {
    const selected = config.tools || config.settings?.selected_tools || [];
    // Remove selected_tools from settings if present (it's now top-level)
    // eslint-disable-next-line no-unused-vars -- Destructuring to exclude selected_tools from cleanSettings
    const { selected_tools, ...cleanSettings } = config.settings || {};
    const tool = {
      type: config.type || '',
      name: config.toolkit || '',
      toolkit_name: config.toolkit || '',
      settings: cleanSettings,
      selected_tools: selected,
    };
    // Preserve meta (e.g., mcp flag) if present
    if (config.meta && Object.keys(config.meta).length > 0) tool.meta = config.meta;

    // For application-type toolkits (nested agents), preserve the reference
    if (config.type === 'application' && config.application_import_uuid)
      tool.application_import_uuid = config.application_import_uuid;

    return tool;
  });

// These reference other agents that will be resolved during ZIP import
const buildToolsFromNestedAgents = frontmatter =>
  (frontmatter.nested_agents || []).map(nested => ({
    type: 'application',
    name: nested.name || '',
    toolkit_name: nested.name || '',
    settings: {},
    selected_tools: [],
    ...(nested.version ? { application_version: nested.version } : {}),
  }));

const buildToolsFromNestedPipelines = frontmatter =>
  (frontmatter.nested_pipelines || []).map(nested => ({
    type: 'application',
    name: nested.name || '',
    toolkit_name: nested.name || '',
    settings: {},
    selected_tools: [],
    ...(nested.version ? { application_version: nested.version } : {}),
  }));

//   Always generate import_uuid for linking
const buildApplicationObject = props => {
  const { frontmatter, versionName, instructions, agentType, allTools, pipelineSettings } = props;

  return {
    name: frontmatter.name || 'Imported Application',
    description: frontmatter.description || '',
    original_exported: true,
    import_uuid: frontmatter.import_uuid || uuidv4(),
    versions: [
      {
        name: versionName,
        import_version_uuid: uuidv4(), // Generate UUID for version linking
        instructions,
        agent_type: agentType,
        llm_settings: {
          model_name: frontmatter.model || 'gpt-4o',
          temperature: frontmatter.temperature ?? 0.7,
          max_tokens: frontmatter.max_tokens || 4096,
          top_p: frontmatter.top_p,
        },
        meta: {
          step_limit: frontmatter.step_limit ?? 25,
          internal_tools: frontmatter.internal_tools || [],
        },
        tools: allTools,
        internal_tools: frontmatter.internal_tools || [],
        variables: frontmatter.variables || [],
        pipeline_settings: pipelineSettings,
        conversation_starters: frontmatter.conversation_starters || [],
        welcome_message: frontmatter.welcome_message || '',
      },
    ],
  };
};

//  Convert MD frontmatter to import wizard format
export const mdToApplicationJson = (frontmatter, body) => {
  const agentType = frontmatter.agent_type || 'react';

  const { instructions, pipelineSettings } = buildInstructionsBasedOnType({ agentType, frontmatter, body });
  const tools = buildToolsFromToolkits(frontmatter);
  const nestedAgentTools = buildToolsFromNestedAgents(frontmatter);
  const nestedPipelineTools = buildToolsFromNestedPipelines(frontmatter);

  const allTools = [...tools, ...nestedAgentTools, ...nestedPipelineTools];
  const versionName = frontmatter.version || LATEST_VERSION_NAME;

  const application = buildApplicationObject({
    frontmatter,
    versionName,
    instructions,
    agentType,
    allTools,
    pipelineSettings,
  });

  return {
    _metadata: { version: 2, format: 'md' },
    applications: [application],
    toolkits: [],
  };
};

export const prepareImportWizardData = (data, modelOptions, embeddingModelOptions, storageOptions) => {
  if (!modelOptions) return [];

  const clonedData = deepCloneObject(data);

  const result = Object.entries(clonedData).reduce((acc, [k, v]) => {
    switch (k) {
      case 'datasources':
        acc = [
          ...acc,
          ...setDefaultStorageForImportedDatasources(
            setDefaultModelsForImportedDatasources(v, modelOptions, embeddingModelOptions),
            storageOptions,
          ).map(i => {
            i.entity = k;
            return i;
          }),
        ];
        break;
      default:
        if (v && Array.isArray(v)) {
          // {key:[]}
          acc = [
            ...acc,
            ...setDefaultModelsForImportedAgents(v, modelOptions).map(i => {
              if (k === 'applications') {
                i.entity = 'agents';
              } else {
                i.entity = k;
              }
              return i;
            }),
          ];
        } else {
          return acc;
        }
    }

    return acc;
  }, []);

  if (Array.isArray(result)) {
    result.forEach(i => {
      i.isSelected = true;
      if (i.versions && Array.isArray(i.versions)) {
        i.versions.forEach(v => {
          v.isSelected = true;
          v.tools?.forEach(tool => {
            tool.isSelected = true;
          });
        });
      }
    });
  }

  return result;
};

export const filterSelected = inputObject => {
  function filterObject(obj) {
    // If the object has isSelected === false, return null to exclude it
    if (obj?.isSelected === false) return null;

    // If the value is an array, filter elements in the array
    if (Array.isArray(obj)) {
      const filteredArray = obj.map(filterObject).filter(item => item !== null);
      return filteredArray.length > 0 ? filteredArray : [];
    }

    // If the value is an object, filter properties of the object
    if (typeof obj === 'object' && obj !== null) {
      const result = {};
      for (const key in obj) {
        const value = obj[key];

        if (typeof value === 'object') {
          const filteredValue = filterObject(value);
          if (filteredValue !== null) {
            result[key] = filteredValue;
          }
        } else if (key !== 'isSelected') {
          result[key] = value;
        }
      }

      return result;
    }

    // For primitives other than object or array, return the value directly
    return obj;
  }

  return filterObject(inputObject);
};
