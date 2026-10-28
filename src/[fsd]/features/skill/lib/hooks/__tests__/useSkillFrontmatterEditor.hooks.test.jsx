// @vitest-environment jsdom
import { Formik, useFormikContext } from 'formik';
import { afterEach, describe, expect, it } from 'vitest';
import * as yup from 'yup';

import { act, cleanup, renderHook, waitFor } from '@testing-library/react';

import { useSkillFrontmatterEditor } from '../useSkillFrontmatterEditor.hooks';

const VALUES = {
  name: 'triage',
  description: 'Sorts issues',
  version_details: { instructions: 'Do it.' },
};
const TEXT = '---\nname: triage\ndescription: Sorts issues\n---\n\nDo it.';

const REQUIRED_FIELDS_SCHEMA = yup.object({
  name: yup.string().required('Name is required'),
  description: yup.string().required('Description is required'),
});

const renderEditor = (values = VALUES) =>
  renderHook(() => ({ editor: useSkillFrontmatterEditor(), formik: useFormikContext() }), {
    wrapper: ({ children }) => (
      <Formik
        initialValues={values}
        validationSchema={REQUIRED_FIELDS_SCHEMA}
        onSubmit={() => {}}
      >
        {children}
      </Formik>
    ),
  });

const typeInEditor = async (result, text) => {
  await act(async () => {
    result.current.editor.onEditorChange(text);
  });
};

const setField = async (result, field, value) => {
  await act(async () => {
    await result.current.formik.setFieldValue(field, value);
  });
};

const readFields = result => ({
  name: result.current.formik.values.name,
  description: result.current.formik.values.description,
  instructions: result.current.formik.values.version_details.instructions,
});

describe('useSkillFrontmatterEditor', () => {
  afterEach(() => cleanup());

  it('opens with a frontmatter built from the saved fields and leaves the form unchanged', () => {
    const { result } = renderEditor();

    expect(result.current.editor.editorText).toBe(TEXT);
    expect(result.current.formik.dirty).toBe(false);
  });

  it('opens a new skill with empty keys and untouched fields', () => {
    const { result } = renderEditor({ name: '', description: '', version_details: { instructions: '' } });

    expect(result.current.editor.editorText).toBe('---\nname:\ndescription:\n---\n\n');
    expect(result.current.formik.touched).toEqual({});
  });

  it('copies a frontmatter name to the Name field and marks it touched', async () => {
    const { result } = renderEditor();

    await typeInEditor(result, TEXT.replace('name: triage', 'name: triage-v2'));

    expect(readFields(result)).toEqual({
      name: 'triage-v2',
      description: 'Sorts issues',
      instructions: 'Do it.',
    });
    expect(result.current.formik.touched.name).toBe(true);
  });

  it('validates a new skill against both fields pasted through the frontmatter', async () => {
    const { result } = renderEditor({ name: '', description: '', version_details: { instructions: '' } });

    await typeInEditor(result, '---\nname: pdf-tools\ndescription: Works with PDFs\n---\n\nSteps.');

    await waitFor(() => expect(result.current.formik.errors).toEqual({}));
    expect(result.current.formik.isValid).toBe(true);
  });

  it('copies a body edit to the instructions only', async () => {
    const { result } = renderEditor();

    await typeInEditor(result, `${TEXT} Now.`);

    expect(readFields(result)).toEqual({
      name: 'triage',
      description: 'Sorts issues',
      instructions: 'Do it. Now.',
    });
  });

  it.each([
    ['a renamed key', TEXT.replace('name: triage', 'na: triage')],
    ['an empty value', TEXT.replace('name: triage', 'name:')],
    ['a deleted block', 'Do it.'],
  ])('keeps the last Name for %s', async (_case, text) => {
    const { result } = renderEditor();

    await typeInEditor(result, text);

    expect(result.current.formik.values.name).toBe('triage');
    expect(result.current.editor.editorText).toBe(text);
  });

  it('still updates a valid description when the name key is broken', async () => {
    const { result } = renderEditor();

    await typeInEditor(result, '---\nna: triage\ndescription: Files bugs\n---\n\nDo it.');

    expect(readFields(result)).toEqual({ name: 'triage', description: 'Files bugs', instructions: 'Do it.' });
  });

  it('keeps both fields and saves the whole text as instructions when the YAML is broken', async () => {
    const { result } = renderEditor();
    const broken = '---\nname: "triage-v2\ndescription: Files bugs\n---\n\nDo it again.';

    await typeInEditor(result, broken);

    expect(readFields(result)).toEqual({ name: 'triage', description: 'Sorts issues', instructions: broken });
    expect(result.current.editor.editorText).toBe(broken);
    let errors;
    await act(async () => {
      errors = await result.current.formik.validateForm();
    });
    expect(errors).toEqual({});
  });

  it('saves the whole text as instructions while the closing line is missing', async () => {
    const { result } = renderEditor();
    const unclosed = '---\nname: triage\nDo it. Changed';

    await typeInEditor(result, unclosed);

    expect(readFields(result)).toEqual({
      name: 'triage',
      description: 'Sorts issues',
      instructions: unclosed,
    });
  });

  it('returns to the body only once the frontmatter is valid again', async () => {
    const { result } = renderEditor();

    await typeInEditor(result, '---\nname: "triage\n---\n\nDo it.');
    await typeInEditor(result, TEXT);

    expect(readFields(result)).toEqual({
      name: 'triage',
      description: 'Sorts issues',
      instructions: 'Do it.',
    });
  });

  it('allows saving after the block is deleted, with the whole text as body', async () => {
    const { result } = renderEditor();

    await typeInEditor(result, 'Only the body');

    expect(readFields(result)).toEqual({
      name: 'triage',
      description: 'Sorts issues',
      instructions: 'Only the body',
    });
    let errors;
    await act(async () => {
      errors = await result.current.formik.validateForm();
    });
    expect(errors).toEqual({});
  });

  it('fills the fields and keeps only the body when a full SKILL.md is pasted', async () => {
    const { result } = renderEditor();

    await typeInEditor(
      result,
      '---\nname: pdf-tools\ndescription: Works with PDFs\nlicense: MIT\nallowed-tools: Read\n---\n\n# PDF\n\nSteps.',
    );

    expect(readFields(result)).toEqual({
      name: 'pdf-tools',
      description: 'Works with PDFs',
      instructions: '# PDF\n\nSteps.',
    });
  });

  it('rewrites only the name line when the Name field changes', async () => {
    const { result } = renderEditor();
    await typeInEditor(
      result,
      '---\nname: triage # main\nlicense: MIT\ndescription: Sorts issues\n---\n\nDo it.',
    );

    await setField(result, 'name', 'triage-v2');

    expect(result.current.editor.editorText).toBe(
      '---\nname: triage-v2\nlicense: MIT\ndescription: Sorts issues\n---\n\nDo it.',
    );
  });

  it('writes a Description field value as YAML that reads back unchanged', async () => {
    const { result } = renderEditor();

    await setField(result, 'description', 'Use when: a #tag\nsecond line');

    expect(result.current.editor.editorText).toBe(
      '---\nname: triage\ndescription: |-\n  Use when: a #tag\n  second line\n---\n\nDo it.',
    );
  });

  it('inserts a new block when the Name field changes and the block was deleted', async () => {
    const { result } = renderEditor();
    await typeInEditor(result, 'Do it.');

    await setField(result, 'name', 'triage-v2');

    expect(result.current.editor.editorText).toBe(
      '---\nname: triage-v2\ndescription: Sorts issues\n---\n\nDo it.',
    );
  });

  it('leaves broken YAML untouched when the Name field changes', async () => {
    const { result } = renderEditor();
    const broken = '---\nname: "triage\n---\n\nDo it.';
    await typeInEditor(result, broken);

    await setField(result, 'name', 'triage-v2');

    expect(result.current.editor.editorText).toBe(broken);
    expect(result.current.formik.values.name).toBe('triage-v2');
  });

  it('swaps the body and keeps the frontmatter text when the instructions change outside the editor', async () => {
    const { result } = renderEditor();
    await typeInEditor(result, '---\nname: triage # main\ndescription: Sorts issues\n---\n\nDo it.');

    await setField(result, 'version_details.instructions', 'Rewritten by AI.');

    expect(result.current.editor.editorText).toBe(
      '---\nname: triage # main\ndescription: Sorts issues\n---\n\nRewritten by AI.',
    );
  });
});

describe('useSkillFrontmatterEditor keys ELITEA does not own', () => {
  afterEach(() => cleanup());

  const STORED = { 'allowed-tools': 'Read', license: 'MIT', 'disable-model-invocation': true };
  const withStoredFrontmatter = frontmatter => ({
    ...VALUES,
    version_details: { ...VALUES.version_details, meta: { icon_meta: { url: 'i' }, frontmatter } },
  });
  const STORED_TEXT =
    '---\nname: triage\ndescription: Sorts issues\nlicense: MIT\nallowed-tools: Read\ndisable-model-invocation: true\n---\n\nDo it.';

  it('opens with the stored keys after name and description and leaves the form clean', () => {
    const { result } = renderEditor(withStoredFrontmatter(STORED));

    expect(result.current.editor.editorText).toBe(STORED_TEXT);
    expect(result.current.formik.dirty).toBe(false);
  });

  it('copies an edited key to the version meta and keeps the other meta', async () => {
    const { result } = renderEditor(withStoredFrontmatter(STORED));

    await typeInEditor(result, STORED_TEXT.replace('license: MIT', 'license: Apache-2.0'));

    expect(result.current.formik.values.version_details.meta).toEqual({
      icon_meta: { url: 'i' },
      frontmatter: { ...STORED, license: 'Apache-2.0' },
    });
    expect(result.current.editor.editorText).toBe(STORED_TEXT.replace('license: MIT', 'license: Apache-2.0'));
  });

  it('clears a key whose line is deleted', async () => {
    const { result } = renderEditor(withStoredFrontmatter(STORED));

    await typeInEditor(result, STORED_TEXT.replace('license: MIT\n', ''));

    expect(result.current.formik.values.version_details.meta.frontmatter).toEqual({
      'allowed-tools': 'Read',
      'disable-model-invocation': true,
    });
  });

  it('stores keys pasted into a new skill', async () => {
    const { result } = renderEditor({ name: '', description: '', version_details: { instructions: '' } });

    await typeInEditor(
      result,
      '---\nname: pdf\ndescription: Reads PDFs\nlicense: Proprietary\n---\n\nUse it.',
    );

    expect(result.current.formik.values.version_details.meta).toEqual({
      frontmatter: { license: 'Proprietary' },
    });
  });

  it('keeps the stored keys while the YAML is broken', async () => {
    const { result } = renderEditor(withStoredFrontmatter(STORED));

    await typeInEditor(result, STORED_TEXT.replace('license: MIT', 'license: "MIT'));

    expect(result.current.formik.values.version_details.meta.frontmatter).toEqual(STORED);
  });

  it('leaves the text alone when the server returns the same keys in another order', async () => {
    const { result } = renderEditor(withStoredFrontmatter(STORED));

    await setField(result, 'version_details.meta.frontmatter', {
      license: 'MIT',
      'disable-model-invocation': true,
      'allowed-tools': 'Read',
    });

    expect(result.current.editor.editorText).toBe(STORED_TEXT);
  });

  it('rebuilds the block when another version with other keys is loaded', async () => {
    const { result } = renderEditor(withStoredFrontmatter(STORED));

    await setField(result, 'version_details.meta.frontmatter', { compatibility: 'Needs network' });

    expect(result.current.editor.editorText).toBe(
      '---\nname: triage\ndescription: Sorts issues\ncompatibility: Needs network\n---\n\nDo it.',
    );
  });
});

describe('useSkillFrontmatterEditor ELITEA fields mirrored from the export', () => {
  afterEach(() => cleanup());

  const MODELS = [
    { name: 'gpt-4.1', project_id: 2 },
    { name: 'o3', project_id: 2, supports_reasoning: true },
  ];
  const EXPORT_VALUES = {
    ...VALUES,
    version_details: {
      ...VALUES.version_details,
      name: 'v2',
      tags: [{ id: 4, name: 'python' }],
      run_settings: {
        llm_settings: { model_name: 'gpt-4.1', model_project_id: 2, temperature: 0.2, max_tokens: 4000 },
        ignore_project_context: false,
      },
      meta: { frontmatter: { license: 'MIT' } },
    },
  };
  const metadataBlock = lines => `metadata:\n${lines.map(line => `  ${line}`).join('\n')}\n`;
  const exportText = lines =>
    `---\nname: triage\ndescription: Sorts issues\nlicense: MIT\n${metadataBlock(lines)}---\n\nDo it.`;
  const EXPORT_LINES = [
    `elitea-tags: '["python"]'`,
    'elitea-version: v2',
    'elitea-model: gpt-4.1',
    `elitea-temperature: '0.2'`,
    `elitea-max-tokens: '4000'`,
  ];

  const renderExportEditor = () =>
    renderHook(
      () => ({ editor: useSkillFrontmatterEditor({ models: MODELS }), formik: useFormikContext() }),
      {
        wrapper: ({ children }) => (
          <Formik
            initialValues={EXPORT_VALUES}
            onSubmit={() => {}}
          >
            {children}
          </Formik>
        ),
      },
    );

  it('opens with the same frontmatter the export writes and leaves the form clean', () => {
    const { result } = renderExportEditor();

    expect(result.current.editor.editorText).toBe(exportText(EXPORT_LINES));
    expect(result.current.formik.dirty).toBe(false);
  });

  it('rewrites the metadata block when the Tags field changes', async () => {
    const { result } = renderExportEditor();

    await setField(result, 'version_details.tags', [{ id: 4, name: 'python' }, { name: 'rust' }]);

    expect(result.current.editor.editorText).toBe(
      exportText([`elitea-tags: '["python", "rust"]'`, ...EXPORT_LINES.slice(1)]),
    );
  });

  it('copies edited tags to the Tags field', async () => {
    const { result } = renderExportEditor();

    await typeInEditor(result, exportText([`elitea-tags: '["python", "go"]'`, ...EXPORT_LINES.slice(1)]));

    expect(result.current.formik.values.version_details.tags).toEqual([
      { id: 4, name: 'python' },
      { name: 'go' },
    ]);
  });

  it('keeps tags typed in another JSON spacing as typed', async () => {
    const { result } = renderExportEditor();
    const typed = exportText([`elitea-tags: '["python","go"]'`, ...EXPORT_LINES.slice(1)]);

    await typeInEditor(result, typed);

    expect(result.current.formik.values.version_details.tags).toEqual([
      { id: 4, name: 'python' },
      { name: 'go' },
    ]);
    expect(result.current.editor.editorText).toBe(typed);
  });

  it('copies an edited temperature to the run settings without rewriting what was typed', async () => {
    const { result } = renderExportEditor();
    const typed = exportText([...EXPORT_LINES.slice(0, 3), 'elitea-temperature: 0.', EXPORT_LINES[4]]);

    await typeInEditor(result, typed);

    expect(result.current.formik.values.version_details.run_settings.llm_settings.temperature).toBe(0);
    expect(result.current.editor.editorText).toBe(typed);
  });

  it('switches the model when the model line names another known model', async () => {
    const { result } = renderExportEditor();

    await typeInEditor(
      result,
      exportText([...EXPORT_LINES.slice(0, 2), 'elitea-model: o3', ...EXPORT_LINES.slice(3)]),
    );

    expect(result.current.formik.values.version_details.run_settings.llm_settings).toMatchObject({
      model_name: 'o3',
      model_project_id: 2,
    });
  });

  it('shows an error and keeps the run settings for an unknown model', async () => {
    const { result } = renderExportEditor();

    await typeInEditor(
      result,
      exportText([...EXPORT_LINES.slice(0, 2), 'elitea-model: gpt-9', ...EXPORT_LINES.slice(3)]),
    );

    expect(result.current.editor.frontmatterErrors).toEqual([
      '"metadata.elitea-model" names an unknown model: gpt-9',
    ]);
    expect(result.current.formik.values.version_details.run_settings.llm_settings.model_name).toBe('gpt-4.1');
  });

  it('clears the error once the line is valid again', async () => {
    const { result } = renderExportEditor();
    await typeInEditor(
      result,
      exportText([...EXPORT_LINES.slice(0, 3), 'elitea-temperature: hot', EXPORT_LINES[4]]),
    );

    await typeInEditor(result, exportText(EXPORT_LINES));

    expect(result.current.editor.frontmatterErrors).toEqual([]);
  });

  it('keeps ELITEA keys out of the stored frontmatter', async () => {
    const { result } = renderExportEditor();

    await typeInEditor(
      result,
      exportText(EXPORT_LINES).replace(
        'license: MIT\nmetadata:\n',
        'license: MIT\nmetadata:\n  author: me\n',
      ),
    );

    expect(result.current.formik.values.version_details.meta.frontmatter).toEqual({
      license: 'MIT',
      metadata: { author: 'me' },
    });
  });

  it('clears the tags and the model when the metadata block is deleted', async () => {
    const { result } = renderExportEditor();

    await typeInEditor(result, '---\nname: triage\ndescription: Sorts issues\nlicense: MIT\n---\n\nDo it.');

    expect(result.current.formik.values.version_details.tags).toEqual([]);
    expect(result.current.formik.values.version_details.run_settings.llm_settings).toMatchObject({
      model_name: null,
      temperature: null,
      max_tokens: null,
    });
  });

  it('removes the metadata block when the last ELITEA field is cleared outside the editor', async () => {
    const { result } = renderExportEditor();

    await setField(result, 'version_details', {
      ...EXPORT_VALUES.version_details,
      name: 'base',
      tags: [],
      run_settings: null,
    });

    expect(result.current.editor.editorText).toBe(
      '---\nname: triage\ndescription: Sorts issues\nlicense: MIT\n---\n\nDo it.',
    );
  });
});
