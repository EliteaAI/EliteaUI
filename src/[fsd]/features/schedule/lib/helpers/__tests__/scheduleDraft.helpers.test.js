// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { changedFields, draftToFormValues, toDraftRequest } from '../scheduleDraft.helpers';

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

describe('EL-7011 R2.1 toDraftRequest', () => {
  it('sends the current values, the browser timezone and a null lock', () => {
    const body = toDraftRequest(values, null, 'Europe/Kyiv');
    expect(body.timezone).toBe('Europe/Kyiv');
    expect(body.locked_entity).toBeNull();
    expect(body.current).toMatchObject({ entity_type: 'agent', application_id: 'A1', cron: '0 0 * * 6' });
  });

  it('EL-7011 R2.1 names the locked entity by type and id', () => {
    expect(toDraftRequest(values, { type: 'agent', id: 'A1' }, 'UTC').locked_entity).toEqual({
      entity_type: 'agent',
      application_id: 'A1',
    });
  });
});

describe('EL-7011 R2.4 and R2.5 draftToFormValues', () => {
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

  it('R2.5 shows one variable field per placeholder with drafted values by name', () => {
    expect(draftToFormValues(agentDraft, values, null).variables).toEqual([
      { name: 'team', value: 'EPAM' },
      { name: 'topic', value: '' },
    ]);
  });

  it('R2.5 gives a pipeline drafted without a run mode Entry point and no prompt', () => {
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

describe('EL-7011 R3.4 and R3.5 lock rule', () => {
  const lock = { type: 'agent', id: 'A1' };

  it('R3.4 keeps Type and entity when the draft names another entity', () => {
    const draft = { ...agentDraft, entity_type: 'pipeline', application_id: 'PL1', version_id: 'PV1' };
    expect(draftToFormValues(draft, values, lock)).toMatchObject({
      type: 'agent',
      application_id: 'A1',
      version_id: 'V1',
      run_mode: null,
      description: 'New',
    });
  });

  it('R3.5 takes the drafted version when it belongs to the locked entity', () => {
    expect(draftToFormValues(agentDraft, values, lock).version_id).toBe('V2');
  });

  it('R3.4 keeps a locked pipeline and takes the drafted run mode', () => {
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

describe('EL-7011 R3.1 changedFields', () => {
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
