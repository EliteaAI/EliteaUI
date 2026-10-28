import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFormikContext } from 'formik';

import {
  applyEliteaMetadataEdits,
  composeEditorFrontmatter,
  composeSkillEditorText,
  encodeEliteaMetadata,
  parseSkillEditorText,
  replaceSkillEditorBody,
  splitEditorFrontmatter,
  writeSkillFrontmatterFields,
} from '@/[fsd]/features/skill/lib/helpers';

const INSTRUCTIONS_FIELD = 'version_details.instructions';
const NO_EXTRA_FRONTMATTER = {};
const NO_MODELS = [];
const NO_ERRORS = [];

const sortKeysDeep = value => {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map(key => [key, sortKeysDeep(value[key])]),
  );
};

const isSameFrontmatterIgnoringKeyOrder = (left, right) =>
  JSON.stringify(sortKeysDeep(left ?? NO_EXTRA_FRONTMATTER)) ===
  JSON.stringify(sortKeysDeep(right ?? NO_EXTRA_FRONTMATTER));

const buildEditorFields = ({ name, description, frontmatter, eliteaMetadata }) => {
  const extraFrontmatter = composeEditorFrontmatter(frontmatter, eliteaMetadata);
  return { name, description, frontmatter: extraFrontmatter, metadata: extraFrontmatter.metadata };
};

export const useSkillFrontmatterEditor = ({ models = NO_MODELS } = {}) => {
  const { values, setValues, setFieldTouched } = useFormikContext();
  const name = values?.name || '';
  const description = values?.description || '';
  const body = values?.version_details?.instructions || '';
  const frontmatter = values?.version_details?.meta?.frontmatter;
  const tags = values?.version_details?.tags;
  const versionName = values?.version_details?.name;
  const runSettings = values?.version_details?.run_settings;
  const eliteaMetadata = useMemo(
    () => encodeEliteaMetadata({ tags, versionName, runSettings }),
    [tags, versionName, runSettings],
  );

  const [editorText, setEditorText] = useState(() =>
    composeSkillEditorText({
      ...buildEditorFields({ name, description, frontmatter, eliteaMetadata }),
      body,
    }),
  );
  const [frontmatterErrors, setFrontmatterErrors] = useState(NO_ERRORS);
  const editorTextRef = useRef(editorText);
  const syncedValuesRef = useRef({ name, description, frontmatter, eliteaMetadata, body });
  const formValuesRef = useRef({ tags, versionName, runSettings });
  formValuesRef.current = { tags, versionName, runSettings };

  const replaceEditorText = useCallback(text => {
    editorTextRef.current = text;
    setEditorText(text);
  }, []);

  const onEditorChange = useCallback(
    text => {
      replaceEditorText(text);
      const { fields, body: parsedBody, extraFrontmatter } = parseSkillEditorText(text);
      const synced = syncedValuesRef.current;
      const formValues = formValuesRef.current;
      const textFrontmatter = extraFrontmatter ? splitEditorFrontmatter(extraFrontmatter) : null;
      const edits = textFrontmatter
        ? applyEliteaMetadataEdits({
            textMetadata: textFrontmatter.eliteaMetadata,
            formMetadata: synced.eliteaMetadata,
            tags: formValues.tags,
            runSettings: formValues.runSettings,
            models,
          })
        : { errors: synced.errors ?? NO_ERRORS };
      const nextTags = edits.tags ?? formValues.tags;
      const nextRunSettings = edits.runSettings ?? formValues.runSettings;
      const next = {
        name: fields.name ?? synced.name,
        description: fields.description ?? synced.description,
        frontmatter: textFrontmatter?.frontmatter ?? synced.frontmatter,
        eliteaMetadata: encodeEliteaMetadata({
          tags: nextTags,
          versionName: formValues.versionName,
          runSettings: nextRunSettings,
        }),
        body: parsedBody,
        errors: edits.errors,
      };
      syncedValuesRef.current = next;
      setFrontmatterErrors(edits.errors.length ? edits.errors : NO_ERRORS);

      const isNameChanged = next.name !== synced.name;
      const isDescriptionChanged = next.description !== synced.description;
      const isFrontmatterChanged = !isSameFrontmatterIgnoringKeyOrder(next.frontmatter, synced.frontmatter);
      const isBodyChanged = next.body !== synced.body;
      const isEliteaMetadataChanged = Boolean(edits.tags || edits.runSettings);
      if (
        !isNameChanged &&
        !isDescriptionChanged &&
        !isFrontmatterChanged &&
        !isBodyChanged &&
        !isEliteaMetadataChanged
      )
        return;

      setValues(current => ({
        ...current,
        name: next.name,
        description: next.description,
        version_details: {
          ...current.version_details,
          instructions: next.body,
          ...(edits.tags && { tags: edits.tags }),
          ...(edits.runSettings && { run_settings: edits.runSettings }),
          ...(isFrontmatterChanged && {
            meta: { ...current.version_details?.meta, frontmatter: next.frontmatter },
          }),
        },
      }));
      if (isNameChanged) setFieldTouched('name', true, false);
      if (isDescriptionChanged) setFieldTouched('description', true, false);
      if (isBodyChanged) setFieldTouched(INSTRUCTIONS_FIELD, true, false);
    },
    [models, replaceEditorText, setFieldTouched, setValues],
  );

  useEffect(() => {
    const synced = syncedValuesRef.current;
    const fields = buildEditorFields({ name, description, frontmatter, eliteaMetadata });
    const nextSynced = { name, description, frontmatter, eliteaMetadata, body, errors: synced.errors };
    if (!isSameFrontmatterIgnoringKeyOrder(frontmatter, synced.frontmatter)) {
      syncedValuesRef.current = nextSynced;
      replaceEditorText(composeSkillEditorText({ ...fields, body }));
      return;
    }

    const changedKeys = ['name', 'description'].filter(key => fields[key] !== synced[key]);
    if (!isSameFrontmatterIgnoringKeyOrder(eliteaMetadata, synced.eliteaMetadata))
      changedKeys.push('metadata');
    const isBodyChanged = body !== synced.body;
    if (!isBodyChanged && !changedKeys.length) return;

    syncedValuesRef.current = nextSynced;
    const textWithBody = isBodyChanged
      ? replaceSkillEditorBody(editorTextRef.current, body, fields)
      : editorTextRef.current;
    replaceEditorText(
      changedKeys.length ? writeSkillFrontmatterFields(textWithBody, fields, changedKeys) : textWithBody,
    );
  }, [body, description, eliteaMetadata, frontmatter, name, replaceEditorText]);

  return { editorText, onEditorChange, frontmatterErrors };
};
