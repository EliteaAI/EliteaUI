// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import {
  changedFields,
  draftToFormValues,
  isScheduleFormEmpty,
  toDraftRequest,
} from '../scheduleDraft.helpers';

const values = {
  name: 'Night report',
  description: 'Old',
  type: 'agent',
  application_id: 'A1',
  version_id: 'V1',
  run_mode: null,
  prompt: 'Old {{topic}}',
  variables: [{ name: 'topic', value: 'sales' }],
  cron: '0 0 * * 6',
  timezone: 'UTC',
  expires_at: null,
};

const agentDraft = {
  name: 'Weekly report',
  description: 'New',
  entity_type: 'agent',
  application_id: 'A1',
  version_id: 'V2',
  run_mode: 'prompt',
  prompt: 'Report on {{topic}} for {{team}}',
  variables: [{ name: 'team', value: 'EPAM' }],
  cron: '0 9 * * 1',
  timezone: 'Europe/Kyiv',
  expires_at: '2027-01-01T00:00:00Z',
  approval_rule: 'never',
};

const indexValues = {
  name: '',
  description: '',
  type: 'toolkit_index',
  application_id: '',
  version_id: '',
  toolkit_id: 8,
  index_name: 'docs',
  run_mode: null,
  prompt: '',
  variables: [],
  cron: '0 0 * * 6',
  timezone: 'UTC',
  expires_at: null,
};

const indexDraft = {
  name: 'Nightly docs',
  description: 'Refresh the docs',
  entity_type: 'toolkit_index',
  toolkit_id: 8,
  index_name: 'wiki',
  application_id: null,
  version_id: null,
  run_mode: 'prompt',
  prompt: 'ignored',
  variables: [{ name: 'x', value: 'y' }],
  cron: '0 3 * * *',
  timezone: 'Europe/Kyiv',
  expires_at: null,
};

describe('toDraftRequest', () => {
  it('sends the current values, the browser timezone and a null lock', () => {
    const body = toDraftRequest(values, null, 'Europe/Kyiv');
    expect(body.timezone).toBe('Europe/Kyiv');
    expect(body.locked_entity).toBeNull();
    expect(body.current).toMatchObject({ entity_type: 'agent', application_id: 'A1', cron: '0 0 * * 6' });
  });

  it('names the locked entity by type and id', () => {
    expect(toDraftRequest(values, { type: 'agent', id: 'A1' }, 'UTC').locked_entity).toEqual({
      entity_type: 'agent',
      application_id: 'A1',
    });
  });
});

describe('toDraftRequest for a toolkit index', () => {
  it('names the locked index by toolkit id and index name', () => {
    const lock = { type: 'toolkit_index', id: 8, indexName: 'docs' };
    expect(toDraftRequest(indexValues, lock, 'UTC').locked_entity).toEqual({
      entity_type: 'toolkit_index',
      toolkit_id: 8,
      index_name: 'docs',
    });
  });

  it('sends the toolkit and index of the form and no application fields', () => {
    const { current } = toDraftRequest(indexValues, null, 'UTC');
    expect(current).toMatchObject({ entity_type: 'toolkit_index', toolkit_id: 8, index_name: 'docs' });
    expect(current).not.toHaveProperty('application_id');
  });

  it('sends null for a toolkit the user has not chosen', () => {
    const { current } = toDraftRequest({ ...indexValues, toolkit_id: '', index_name: '' }, null, 'UTC');
    expect(current.toolkit_id).toBeNull();
  });
});

describe('draftToFormValues', () => {
  it('fills every drafted field the form has and ignores approval_rule', () => {
    const result = draftToFormValues(agentDraft, values, null);
    expect(result).toMatchObject({
      name: 'Weekly report',
      description: 'New',
      type: 'agent',
      application_id: 'A1',
      version_id: 'V2',
      run_mode: null,
      cron: '0 9 * * 1',
      timezone: 'Europe/Kyiv',
      expires_at: '2027-01-01T00:00:00Z',
    });
    expect(result).not.toHaveProperty('approval_rule');
  });

  it('shows one variable field per placeholder with drafted values by name', () => {
    expect(draftToFormValues(agentDraft, values, null).variables).toEqual([
      { name: 'team', value: 'EPAM' },
      { name: 'topic', value: '' },
    ]);
  });

  it('gives a pipeline drafted without a run mode Entry point and no prompt', () => {
    const draft = { ...agentDraft, entity_type: 'pipeline', application_id: 'PL1', run_mode: null };
    expect(draftToFormValues(draft, values, null)).toMatchObject({
      type: 'pipeline',
      run_mode: 'entry_point',
      prompt: '',
      variables: [],
    });
  });

  it('keeps the current value where the draft leaves a field empty', () => {
    const result = draftToFormValues(
      { ...agentDraft, application_id: '', version_id: null, cron: null },
      values,
      null,
    );
    expect(result).toMatchObject({ application_id: 'A1', version_id: 'V1', cron: '0 0 * * 6' });
  });
});

describe('draft keeps or resets the what-to-run fields', () => {
  it('clears the entity and version when the draft changes the type and names neither', () => {
    const draft = { entity_type: 'pipeline' };
    expect(draftToFormValues(draft, values, null)).toMatchObject({
      type: 'pipeline',
      application_id: '',
      version_id: '',
      run_mode: 'entry_point',
    });
  });

  it('clears the version when the draft names another entity without a version', () => {
    const draft = { entity_type: 'agent', application_id: 'A2' };
    expect(draftToFormValues(draft, values, null)).toMatchObject({ application_id: 'A2', version_id: '' });
  });

  it('keeps the version when the drafted entity id is the same id as a number', () => {
    const form = { ...values, application_id: '7', version_id: '70' };
    const draft = { entity_type: form.type, application_id: 7 };
    expect(draftToFormValues(draft, form, null)).toMatchObject({ application_id: 7, version_id: '70' });
  });

  it('keeps run mode, prompt and variables when the draft omits them', () => {
    const pipeline = {
      ...values,
      type: 'pipeline',
      application_id: 'PL1',
      run_mode: 'prompt',
      prompt: 'Go {{topic}}',
      variables: [{ name: 'topic', value: 'sales' }],
    };
    expect(draftToFormValues({ name: 'New' }, pipeline, null)).toMatchObject({
      run_mode: 'prompt',
      prompt: 'Go {{topic}}',
      variables: [{ name: 'topic', value: 'sales' }],
    });
  });

  it('keeps the agent prompt when the draft omits it', () => {
    expect(draftToFormValues({ name: 'New' }, values, null)).toMatchObject({
      prompt: 'Old {{topic}}',
      variables: [{ name: 'topic', value: 'sales' }],
    });
  });
});

describe('isScheduleFormEmpty', () => {
  it('is true only when name, prompt and entity are all empty', () => {
    const empty = { name: '', prompt: '', application_id: '' };
    expect(isScheduleFormEmpty(empty)).toBe(true);
    expect(isScheduleFormEmpty({ ...empty, name: 'x' })).toBe(false);
    expect(isScheduleFormEmpty({ ...empty, prompt: 'x' })).toBe(false);
    expect(isScheduleFormEmpty({ ...empty, application_id: 'A1' })).toBe(false);
    expect(isScheduleFormEmpty({ ...empty, toolkit_id: 8 })).toBe(false);
  });
});

describe('lock rule', () => {
  const lock = { type: 'agent', id: 'A1' };

  it('keeps Type and entity when the draft names another entity', () => {
    const draft = { ...agentDraft, entity_type: 'pipeline', application_id: 'PL1', version_id: 'PV1' };
    expect(draftToFormValues(draft, values, lock)).toMatchObject({
      type: 'agent',
      application_id: 'A1',
      version_id: 'V1',
      run_mode: null,
      description: 'New',
    });
  });

  it('takes the drafted version when it belongs to the locked entity', () => {
    expect(draftToFormValues(agentDraft, values, lock).version_id).toBe('V2');
  });

  it('takes the drafted version when the locked id is a string and the draft id a number', () => {
    const draft = { ...agentDraft, application_id: 7, version_id: 71 };
    expect(draftToFormValues(draft, values, { type: 'agent', id: '7' }).version_id).toBe(71);
  });

  it('keeps a locked pipeline and takes the drafted run mode', () => {
    const pipeline = {
      ...values,
      type: 'pipeline',
      application_id: 'PL1',
      run_mode: 'entry_point',
      prompt: '',
    };
    const draft = { ...agentDraft, entity_type: 'pipeline', application_id: 'PL1', run_mode: 'prompt' };
    expect(draftToFormValues(draft, pipeline, { type: 'pipeline', id: 'PL1' })).toMatchObject({
      type: 'pipeline',
      application_id: 'PL1',
      run_mode: 'prompt',
    });
  });
});

describe('draft for a toolkit index', () => {
  it('fills the toolkit and the index and leaves run mode, prompt and variables empty', () => {
    const result = draftToFormValues(indexDraft, indexValues, null);
    expect(result).toMatchObject({
      type: 'toolkit_index',
      toolkit_id: 8,
      index_name: 'wiki',
      name: 'Nightly docs',
      cron: '0 3 * * *',
      run_mode: null,
      prompt: '',
      variables: [],
    });
  });

  it('clears the agent and the version when the draft switches an agent form to an index', () => {
    const result = draftToFormValues(indexDraft, values, null);
    expect(result).toMatchObject({
      type: 'toolkit_index',
      application_id: '',
      version_id: '',
      toolkit_id: 8,
      index_name: 'wiki',
      run_mode: null,
      prompt: '',
    });
  });

  it('clears the toolkit and the index when the draft switches an index form to an agent', () => {
    const result = draftToFormValues({ ...agentDraft, application_id: 'A1' }, indexValues, null);
    expect(result).toMatchObject({
      type: 'agent',
      application_id: 'A1',
      toolkit_id: '',
      index_name: '',
      run_mode: null,
    });
  });

  it('clears the index when the draft names another toolkit without an index', () => {
    const draft = { entity_type: 'toolkit_index', toolkit_id: 9 };
    expect(draftToFormValues(draft, indexValues, null)).toMatchObject({ toolkit_id: 9, index_name: '' });
  });

  it('keeps the toolkit and takes the drafted index of the same toolkit', () => {
    const draft = { entity_type: 'toolkit_index', toolkit_id: '8', index_name: 'wiki' };
    expect(draftToFormValues(draft, indexValues, null)).toMatchObject({ toolkit_id: '8', index_name: 'wiki' });
  });

  it('keeps the current target where the draft clears it', () => {
    const draft = { ...indexDraft, toolkit_id: null, index_name: null };
    expect(draftToFormValues(draft, indexValues, null)).toMatchObject({ toolkit_id: 8, index_name: 'docs' });
  });

  it('keeps a locked index and still takes the other drafted fields', () => {
    const lock = { type: 'toolkit_index', id: 8, indexName: 'docs' };
    const draft = { ...indexDraft, toolkit_id: 9, index_name: 'wiki', version_id: 3, application_id: 8 };
    expect(draftToFormValues(draft, indexValues, lock)).toMatchObject({
      type: 'toolkit_index',
      toolkit_id: 8,
      index_name: 'docs',
      version_id: '',
      name: 'Nightly docs',
      cron: '0 3 * * *',
    });
  });

  it('skips the toolkit and the index in the changes of a locked index', () => {
    const lock = { type: 'toolkit_index', id: 8, indexName: 'docs' };
    const names = changedFields(indexValues, indexDraft, lock).map(({ field }) => field);
    expect(names).toContain('name');
    expect(names).not.toContain('toolkit_id');
    expect(names).not.toContain('index_name');
  });

  it('lists the toolkit and the index as changes of an unlocked index form', () => {
    const names = changedFields(indexValues, indexDraft, null).map(({ field }) => field);
    expect(names).toContain('index_name');
    expect(names).not.toContain('toolkit_id');
  });
});

describe('changedFields', () => {
  it('lists each changed field with its current and drafted value', () => {
    const fields = changedFields(values, agentDraft, null);
    expect(fields).toContainEqual({ field: 'description', current: 'Old', drafted: 'New' });
    expect(fields).toContainEqual({
      field: 'prompt',
      current: 'Old {{topic}}',
      drafted: 'Report on {{topic}} for {{team}}',
    });
    expect(fields.map(({ field }) => field)).not.toContain('type');
  });

  it('skips fields the lock keeps', () => {
    const draft = { ...agentDraft, entity_type: 'pipeline', application_id: 'PL1' };
    const names = changedFields(values, draft, { type: 'agent', id: 'A1' }).map(({ field }) => field);
    expect(names).not.toContain('type');
    expect(names).not.toContain('application_id');
  });

  it('returns nothing when the draft equals the form', () => {
    expect(
      changedFields(
        values,
        {
          ...agentDraft,
          name: values.name,
          description: values.description,
          version_id: 'V1',
          run_mode: null,
          prompt: values.prompt,
          variables: values.variables,
          cron: values.cron,
          timezone: values.timezone,
          expires_at: null,
        },
        null,
      ),
    ).toEqual([]);
  });
});
