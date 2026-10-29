import { DEFAULT_MAX_TOKENS } from '@/[fsd]/shared/lib/constants/llmSettings.constants';
import { isAutoSelection, selectionFields } from '@/[fsd]/shared/lib/utils/autoRouting.utils';
import {
  isLLMSettingsFamilyConflict,
  resetLLMSettingsForModel,
} from '@/[fsd]/shared/lib/utils/llmSettings.utils';

export const ELITEA_METADATA_KEYS = {
  tags: 'elitea-tags',
  version: 'elitea-version',
  model: 'elitea-model',
  temperature: 'elitea-temperature',
  maxTokens: 'elitea-max-tokens',
  reasoningEffort: 'elitea-reasoning-effort',
  modelSelection: 'elitea-model-selection',
  ignoreProjectContext: 'elitea-ignore-project-context',
};

const ELITEA_METADATA_PREFIX = 'elitea-';
const BASE_VERSION_NAME = 'base';
const OWNED_TOP_LEVEL_KEYS = ['name', 'description', 'tags', 'elitea_version', 'elitea_run_settings'];
const SPEC_OPTIONAL_KEYS = ['license', 'compatibility', 'allowed-tools'];
const FLAG_VALUES = { true: true, false: false };

const isSet = value => value !== null && value !== undefined;
const isMapping = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const isEliteaMetadataKey = key => key.startsWith(ELITEA_METADATA_PREFIX);
const isMaxTokens = value => Number.isInteger(value) && (value > 0 || value === DEFAULT_MAX_TOKENS);

const formatJsonLikeServerExport = value => {
  if (Array.isArray(value)) return `[${value.map(formatJsonLikeServerExport).join(', ')}]`;
  if (isMapping(value)) {
    return `{${Object.entries(value)
      .map(([key, item]) => `${JSON.stringify(key)}: ${formatJsonLikeServerExport(item)}`)
      .join(', ')}}`;
  }
  return JSON.stringify(value);
};

const formatOptional = value => (isSet(value) ? String(value) : null);

export const encodeEliteaMetadata = ({ tags, versionName, runSettings }) => {
  const llmSettings = runSettings?.llm_settings || {};
  const tagNames = (tags || []).map(tag => tag?.name).filter(Boolean);
  const entries = [
    [ELITEA_METADATA_KEYS.tags, tagNames.length ? formatJsonLikeServerExport(tagNames) : null],
    [ELITEA_METADATA_KEYS.version, versionName && versionName !== BASE_VERSION_NAME ? versionName : null],
    [ELITEA_METADATA_KEYS.model, formatOptional(llmSettings.model_name)],
    [ELITEA_METADATA_KEYS.temperature, formatOptional(llmSettings.temperature)],
    [
      ELITEA_METADATA_KEYS.maxTokens,
      llmSettings.max_tokens === DEFAULT_MAX_TOKENS ? null : formatOptional(llmSettings.max_tokens),
    ],
    [ELITEA_METADATA_KEYS.reasoningEffort, formatOptional(llmSettings.reasoning_effort)],
    [
      ELITEA_METADATA_KEYS.modelSelection,
      isAutoSelection(llmSettings) ? formatJsonLikeServerExport(llmSettings.selection) : null,
    ],
    [ELITEA_METADATA_KEYS.ignoreProjectContext, runSettings?.ignore_project_context ? 'true' : null],
  ];
  return Object.fromEntries(entries.filter(([, value]) => value !== null));
};

const withoutEliteaMetadata = metadata =>
  Object.fromEntries(Object.entries(metadata).filter(([key]) => !isEliteaMetadataKey(key)));

export const composeEditorFrontmatter = (frontmatter, eliteaMetadata) => {
  const remaining = Object.fromEntries(
    Object.entries(frontmatter || {}).filter(([key]) => !OWNED_TOP_LEVEL_KEYS.includes(key)),
  );
  const specEntries = SPEC_OPTIONAL_KEYS.filter(key => key in remaining).map(key => [key, remaining[key]]);
  const { metadata: storedMetadata, ...others } = Object.fromEntries(
    Object.entries(remaining).filter(([key]) => !SPEC_OPTIONAL_KEYS.includes(key)),
  );
  const metadata = {
    ...(isMapping(storedMetadata) ? withoutEliteaMetadata(storedMetadata) : {}),
    ...eliteaMetadata,
  };
  return {
    ...Object.fromEntries(specEntries),
    ...(Object.keys(metadata).length && { metadata }),
    ...others,
  };
};

export const splitEditorFrontmatter = extraFrontmatter => {
  const { metadata, ...rest } = extraFrontmatter;
  if (!isMapping(metadata)) {
    return { frontmatter: metadata === undefined ? rest : extraFrontmatter, eliteaMetadata: {} };
  }
  const foreignMetadata = withoutEliteaMetadata(metadata);
  const eliteaMetadata = Object.fromEntries(
    Object.entries(metadata).filter(([key]) => isEliteaMetadataKey(key)),
  );
  return {
    frontmatter: { ...rest, ...(Object.keys(foreignMetadata).length && { metadata: foreignMetadata }) },
    eliteaMetadata,
  };
};

const formatTypedValue = value => {
  if (!isSet(value)) return undefined;
  return typeof value === 'object' ? formatJsonLikeServerExport(value) : String(value);
};

const parseJsonText = text => {
  try {
    return { value: JSON.parse(text) };
  } catch {
    return {};
  }
};

const parseJsonValue = (value, key, isValid, expectation) => {
  const parsed = typeof value === 'string' ? parseJsonText(value) : { value };
  return 'value' in parsed && isValid(parsed.value)
    ? { value: parsed.value }
    : { error: `"metadata.${key}" must be ${expectation}` };
};

const parseNumber = (value, key, isValid, expectation) => {
  const parsed = Number(value);
  return String(value).trim() && isValid(parsed)
    ? { value: parsed }
    : { error: `"metadata.${key}" must be ${expectation}` };
};

const findModelByName = (models, name, preferredProjectId) =>
  models.find(model => model.name === name && model.project_id === preferredProjectId) ||
  models.find(model => model.name === name && !isAutoSelection(model));

export const applyEliteaMetadataEdits = ({ textMetadata, formMetadata, tags, runSettings, models }) => {
  const isChanged = key => formatTypedValue(textMetadata[key]) !== formMetadata[key];
  const isRemoved = key => !isSet(textMetadata[key]);
  const errors = [];
  const recordError = result => {
    if (result.error) errors.push(result.error);
    return result;
  };

  const llmSettings = { ...(runSettings?.llm_settings || {}) };
  let llmSettingsUpdate = llmSettings;
  let ignoreProjectContext = Boolean(runSettings?.ignore_project_context);
  let nextTags = tags;
  let isTagsChanged = false;
  let isRunSettingsChanged = false;
  let hasModelChanged = false;

  const { tags: tagsKey } = ELITEA_METADATA_KEYS;
  if (isChanged(tagsKey)) {
    const parsed = isRemoved(tagsKey)
      ? { value: [] }
      : recordError(
          parseJsonValue(
            textMetadata[tagsKey],
            tagsKey,
            value => Array.isArray(value) && value.every(item => typeof item === 'string'),
            'a JSON array of tag names',
          ),
        );
    if (!parsed.error) {
      nextTags = parsed.value.map(name => (tags || []).find(tag => tag.name === name) || { name });
      isTagsChanged = true;
    }
  }

  const { model: modelKey } = ELITEA_METADATA_KEYS;
  if (isChanged(modelKey)) {
    if (isRemoved(modelKey)) {
      llmSettingsUpdate = { ...llmSettingsUpdate, model_name: null, model_project_id: null };
      isRunSettingsChanged = true;
    } else {
      const model = findModelByName(
        models || [],
        String(textMetadata[modelKey]),
        llmSettings.model_project_id,
      );
      if (model) {
        llmSettingsUpdate = {
          max_tokens: llmSettingsUpdate.max_tokens ?? DEFAULT_MAX_TOKENS,
          ...resetLLMSettingsForModel(model),
          ...selectionFields(model),
        };
        isRunSettingsChanged = true;
        hasModelChanged = true;
      } else {
        errors.push(`"metadata.${modelKey}" names an unknown model: ${textMetadata[modelKey]}`);
      }
    }
  }

  const { modelSelection: selectionKey } = ELITEA_METADATA_KEYS;
  if (isChanged(selectionKey)) {
    if (isRemoved(selectionKey)) {
      llmSettingsUpdate = { ...llmSettingsUpdate, selection: null };
      isRunSettingsChanged = true;
    } else {
      const parsed = recordError(
        parseJsonValue(
          textMetadata[selectionKey],
          selectionKey,
          value => isAutoSelection({ selection: value }),
          'a JSON object for Auto model selection',
        ),
      );
      if (!parsed.error) {
        llmSettingsUpdate = {
          max_tokens: llmSettingsUpdate.max_tokens ?? DEFAULT_MAX_TOKENS,
          ...selectionFields({ selection: parsed.value }),
        };
        isRunSettingsChanged = true;
        hasModelChanged = true;
      }
    }
  }

  const numericFields = [
    [ELITEA_METADATA_KEYS.temperature, 'temperature', Number.isFinite, 'a number', null],
    [
      ELITEA_METADATA_KEYS.maxTokens,
      'max_tokens',
      isMaxTokens,
      'a positive integer or -1 for the default',
      DEFAULT_MAX_TOKENS,
    ],
  ];
  numericFields.forEach(([key, field, isValid, expectation, valueWhenRemoved]) => {
    if (!isChanged(key)) return;
    const parsed = isRemoved(key)
      ? { value: valueWhenRemoved }
      : recordError(parseNumber(textMetadata[key], key, isValid, expectation));
    if (parsed.error) return;
    llmSettingsUpdate = { ...llmSettingsUpdate, [field]: parsed.value };
    isRunSettingsChanged = true;
  });

  const { reasoningEffort: effortKey } = ELITEA_METADATA_KEYS;
  if (isChanged(effortKey)) {
    llmSettingsUpdate = {
      ...llmSettingsUpdate,
      reasoning_effort: isRemoved(effortKey) ? null : String(textMetadata[effortKey]),
    };
    isRunSettingsChanged = true;
  }

  const { ignoreProjectContext: ignoreKey } = ELITEA_METADATA_KEYS;
  if (isChanged(ignoreKey)) {
    const flag = isRemoved(ignoreKey)
      ? false
      : FLAG_VALUES[String(textMetadata[ignoreKey]).trim().toLowerCase()];
    if (flag === undefined) {
      errors.push(`"metadata.${ignoreKey}" must be true or false`);
    } else {
      ignoreProjectContext = flag;
      isRunSettingsChanged = true;
    }
  }

  if (
    (isChanged(ELITEA_METADATA_KEYS.temperature) || isChanged(ELITEA_METADATA_KEYS.reasoningEffort)) &&
    isLLMSettingsFamilyConflict(llmSettingsUpdate.temperature, llmSettingsUpdate.reasoning_effort)
  ) {
    errors.push(
      `"metadata.${ELITEA_METADATA_KEYS.temperature}" cannot be combined with an active "metadata.${ELITEA_METADATA_KEYS.reasoningEffort}"`,
    );
    llmSettingsUpdate = {
      ...llmSettingsUpdate,
      temperature: llmSettings.temperature ?? null,
      reasoning_effort: llmSettings.reasoning_effort ?? null,
    };
  }

  return {
    errors,
    ...(hasModelChanged && { hasModelChanged }),
    ...(isTagsChanged && { tags: nextTags }),
    ...(isRunSettingsChanged && {
      runSettings: {
        ...runSettings,
        llm_settings: llmSettingsUpdate,
        ignore_project_context: ignoreProjectContext,
      },
    }),
  };
};
