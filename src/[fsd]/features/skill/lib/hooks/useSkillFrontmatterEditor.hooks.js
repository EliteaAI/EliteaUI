import { useCallback, useEffect, useRef, useState } from 'react';

import { useFormikContext } from 'formik';

import {
  composeSkillEditorText,
  parseSkillEditorText,
  replaceSkillEditorBody,
  writeSkillFrontmatterFields,
} from '@/[fsd]/features/skill/lib/helpers';

const INSTRUCTIONS_FIELD = 'version_details.instructions';

export const useSkillFrontmatterEditor = () => {
  const { values, setValues, setFieldTouched } = useFormikContext();
  const name = values?.name || '';
  const description = values?.description || '';
  const body = values?.version_details?.instructions || '';

  const [editorText, setEditorText] = useState(() => composeSkillEditorText({ name, description, body }));
  const editorTextRef = useRef(editorText);
  const syncedValuesRef = useRef({ name, description, body });

  const replaceEditorText = useCallback(text => {
    editorTextRef.current = text;
    setEditorText(text);
  }, []);

  const onEditorChange = useCallback(
    text => {
      replaceEditorText(text);
      const { fields, body: parsedBody } = parseSkillEditorText(text);
      const synced = syncedValuesRef.current;
      const next = {
        name: fields.name ?? synced.name,
        description: fields.description ?? synced.description,
        body: parsedBody,
      };
      syncedValuesRef.current = next;

      const isNameChanged = next.name !== synced.name;
      const isDescriptionChanged = next.description !== synced.description;
      const isBodyChanged = next.body !== synced.body;
      if (!isNameChanged && !isDescriptionChanged && !isBodyChanged) return;

      setValues(current => ({
        ...current,
        name: next.name,
        description: next.description,
        version_details: { ...current.version_details, instructions: next.body },
      }));
      if (isNameChanged) setFieldTouched('name', true, false);
      if (isDescriptionChanged) setFieldTouched('description', true, false);
      if (isBodyChanged) setFieldTouched(INSTRUCTIONS_FIELD, true, false);
    },
    [replaceEditorText, setFieldTouched, setValues],
  );

  useEffect(() => {
    const synced = syncedValuesRef.current;
    const fields = { name, description };
    const changedKeys = Object.keys(fields).filter(key => fields[key] !== synced[key]);
    const isBodyChanged = body !== synced.body;
    if (!isBodyChanged && !changedKeys.length) return;

    syncedValuesRef.current = { name, description, body };
    const textWithBody = isBodyChanged
      ? replaceSkillEditorBody(editorTextRef.current, body, fields)
      : editorTextRef.current;
    replaceEditorText(
      changedKeys.length ? writeSkillFrontmatterFields(textWithBody, fields, changedKeys) : textWithBody,
    );
  }, [body, description, name, replaceEditorText]);

  return { editorText, onEditorChange };
};
