import { useCallback, useEffect, useRef, useState } from 'react';

import { useFormikContext } from 'formik';

import {
  composeSkillEditorText,
  parseSkillEditorText,
  replaceSkillEditorBody,
  writeSkillFrontmatterFields,
} from '@/[fsd]/features/skill/lib/helpers';

const INSTRUCTIONS_FIELD = 'version_details.instructions';
const NO_EXTRA_FRONTMATTER = {};

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

export const useSkillFrontmatterEditor = () => {
  const { values, setValues, setFieldTouched } = useFormikContext();
  const name = values?.name || '';
  const description = values?.description || '';
  const body = values?.version_details?.instructions || '';
  const frontmatter = values?.version_details?.meta?.frontmatter;

  const [editorText, setEditorText] = useState(() =>
    composeSkillEditorText({ name, description, frontmatter, body }),
  );
  const editorTextRef = useRef(editorText);
  const syncedValuesRef = useRef({ name, description, frontmatter, body });

  const replaceEditorText = useCallback(text => {
    editorTextRef.current = text;
    setEditorText(text);
  }, []);

  const onEditorChange = useCallback(
    text => {
      replaceEditorText(text);
      const { fields, body: parsedBody, extraFrontmatter } = parseSkillEditorText(text);
      const synced = syncedValuesRef.current;
      const next = {
        name: fields.name ?? synced.name,
        description: fields.description ?? synced.description,
        frontmatter: extraFrontmatter ?? synced.frontmatter,
        body: parsedBody,
      };
      syncedValuesRef.current = next;

      const isNameChanged = next.name !== synced.name;
      const isDescriptionChanged = next.description !== synced.description;
      const isFrontmatterChanged = !isSameFrontmatterIgnoringKeyOrder(next.frontmatter, synced.frontmatter);
      const isBodyChanged = next.body !== synced.body;
      if (!isNameChanged && !isDescriptionChanged && !isFrontmatterChanged && !isBodyChanged) return;

      setValues(current => ({
        ...current,
        name: next.name,
        description: next.description,
        version_details: {
          ...current.version_details,
          instructions: next.body,
          ...(isFrontmatterChanged && {
            meta: { ...current.version_details?.meta, frontmatter: next.frontmatter },
          }),
        },
      }));
      if (isNameChanged) setFieldTouched('name', true, false);
      if (isDescriptionChanged) setFieldTouched('description', true, false);
      if (isBodyChanged) setFieldTouched(INSTRUCTIONS_FIELD, true, false);
    },
    [replaceEditorText, setFieldTouched, setValues],
  );

  useEffect(() => {
    const synced = syncedValuesRef.current;
    const fields = { name, description, frontmatter };
    if (!isSameFrontmatterIgnoringKeyOrder(frontmatter, synced.frontmatter)) {
      syncedValuesRef.current = { name, description, frontmatter, body };
      replaceEditorText(composeSkillEditorText({ ...fields, body }));
      return;
    }

    const changedKeys = ['name', 'description'].filter(key => fields[key] !== synced[key]);
    const isBodyChanged = body !== synced.body;
    if (!isBodyChanged && !changedKeys.length) return;

    syncedValuesRef.current = { name, description, frontmatter, body };
    const textWithBody = isBodyChanged
      ? replaceSkillEditorBody(editorTextRef.current, body, fields)
      : editorTextRef.current;
    replaceEditorText(
      changedKeys.length ? writeSkillFrontmatterFields(textWithBody, fields, changedKeys) : textWithBody,
    );
  }, [body, description, frontmatter, name, replaceEditorText]);

  return { editorText, onEditorChange };
};
