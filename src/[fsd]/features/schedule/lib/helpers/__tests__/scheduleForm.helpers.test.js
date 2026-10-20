// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { MAX_DESCRIPTION_LENGTH } from '@/common/constants';

import {
  buildInitialValues,
  getEntityLock,
  isPromptShown,
  resetWhatToRun,
  scheduleFormSchema,
  syncPromptVariables,
  toCreateBody,
  toFieldErrors,
} from '../scheduleForm.helpers';

const agentValues = {
  name: 'Night report',
  description: '',
  type: 'agent',
  application_id: 7,
  version_id: 12,
  run_mode: null,
  prompt: 'Summarize {{team}}',
  variables: [{ name: 'team', value: 'core' }],
  cron: '0 2 * * *',
  timezone: 'Europe/Kyiv',
  expires_at: null,
};

describe('EL-7011 R2.3 description limit', () => {
  it('schedule form schema rejects a description over MAX_DESCRIPTION_LENGTH', async () => {
    const tooLong = { ...agentValues, description: 'a'.repeat(MAX_DESCRIPTION_LENGTH + 1) };
    await expect(scheduleFormSchema.validate(tooLong)).rejects.toThrow();
    await expect(
      scheduleFormSchema.validate({ ...agentValues, description: 'a'.repeat(MAX_DESCRIPTION_LENGTH) }),
    ).resolves.toBeTruthy();
  });
});

describe('EL-7011 R3.6 Type switch', () => {
  it('resetWhatToRun to pipeline clears entity, version, prompt and variables and sets Entry point', () => {
    const next = resetWhatToRun(agentValues, 'pipeline');
    expect(next).toMatchObject({
      type: 'pipeline',
      application_id: '',
      version_id: '',
      run_mode: 'entry_point',
      prompt: '',
      variables: [],
      name: 'Night report',
    });
  });

  it('resetWhatToRun back to agent leaves no value of the pipeline behind', () => {
    const pipeline = { ...agentValues, type: 'pipeline', run_mode: 'prompt' };
    expect(resetWhatToRun(pipeline, 'agent')).toMatchObject({
      type: 'agent',
      application_id: '',
      version_id: '',
      run_mode: null,
      prompt: '',
      variables: [],
    });
  });
});

describe('EL-7011 R4.3 variables follow placeholders', () => {
  it('syncPromptVariables gives one sorted field per unique placeholder', () => {
    expect(syncPromptVariables('Report for {{team}} since {{ day }}, cc {{team}}', [])).toEqual([
      { name: 'day', value: '' },
      { name: 'team', value: '' },
    ]);
  });

  it('syncPromptVariables keeps values by name and drops removed names', () => {
    const variables = [
      { name: 'day', value: 'Monday' },
      { name: 'team', value: 'core' },
    ];
    expect(syncPromptVariables('Report for {{team}}', variables)).toEqual([{ name: 'team', value: 'core' }]);
  });
});

describe('EL-7011 R4.5 prompt is required', () => {
  it('isPromptShown is true for an agent and for a pipeline in Prompt mode only', () => {
    expect(isPromptShown({ type: 'agent', run_mode: null })).toBe(true);
    expect(isPromptShown({ type: 'pipeline', run_mode: 'prompt' })).toBe(true);
    expect(isPromptShown({ type: 'pipeline', run_mode: 'entry_point' })).toBe(false);
  });

  it('schema asks for a prompt where it shows', async () => {
    await expect(scheduleFormSchema.validate({ ...agentValues, prompt: '  ' })).rejects.toThrow(
      'Prompt is required',
    );
  });

  it('schema accepts an empty prompt in Entry point mode', async () => {
    const entry = { ...agentValues, type: 'pipeline', run_mode: 'entry_point', prompt: '' };
    await expect(scheduleFormSchema.validate(entry)).resolves.toBeTruthy();
  });
});

describe('EL-7011 R5.1 and R5.3 entity from the URL', () => {
  it('buildInitialValues presets Type and entity from entityType and entityId', () => {
    const { values, urlEntity } = buildInitialValues(
      new URLSearchParams('entityType=pipeline&entityId=9'),
      {},
    );
    expect(urlEntity).toEqual({ type: 'pipeline', id: '9' });
    expect(values).toMatchObject({ type: 'pipeline', application_id: '9', run_mode: 'entry_point' });
  });

  it('buildInitialValues defaults to an empty Agent form and the Schedules page', () => {
    const { values, urlEntity, returnTo } = buildInitialValues(new URLSearchParams(''), null);
    expect(urlEntity).toBeNull();
    expect(values).toMatchObject({ type: 'agent', application_id: '', run_mode: null, variables: [] });
    expect(returnTo).toBe('/schedules');
  });

  it('buildInitialValues ignores an unknown entityType and reads returnTo from the state', () => {
    const { urlEntity, returnTo } = buildInitialValues(new URLSearchParams('entityType=tool&entityId=9'), {
      returnTo: '/agents/3',
    });
    expect(urlEntity).toBeNull();
    expect(returnTo).toBe('/agents/3');
  });

  it('getEntityLock locks when the loaded entity has the URL type', () => {
    expect(getEntityLock({ type: 'agent', id: '3' }, { id: 3, type: 'agent' })).toEqual({
      locked: true,
      unavailable: false,
    });
  });

  it('getEntityLock leaves the form unlocked and flags a missing entity or another type', () => {
    const unlocked = { locked: false, unavailable: true };
    expect(getEntityLock({ type: 'agent', id: '3' }, null)).toEqual(unlocked);
    expect(getEntityLock({ type: 'agent', id: '3' }, { id: 3, type: 'pipeline' })).toEqual(unlocked);
  });

  it('getEntityLock does nothing without a URL entity', () => {
    expect(getEntityLock(null, null)).toEqual({ locked: false, unavailable: false });
  });
});

describe('EL-7011 R6.2 create body', () => {
  it('toCreateBody sends run_mode null for an agent and null description for an empty one', () => {
    expect(toCreateBody({ ...agentValues, run_mode: 'prompt' })).toEqual({
      name: 'Night report',
      description: null,
      entity_type: 'agent',
      application_id: 7,
      version_id: 12,
      run_mode: null,
      prompt: 'Summarize {{team}}',
      variables: [{ name: 'team', value: 'core' }],
      cron: '0 2 * * *',
      timezone: 'Europe/Kyiv',
      expires_at: null,
    });
  });

  it('toCreateBody sends prompt null and empty variables for Entry point', () => {
    const entry = { ...agentValues, type: 'pipeline', run_mode: 'entry_point' };
    expect(toCreateBody(entry)).toMatchObject({
      entity_type: 'pipeline',
      run_mode: 'entry_point',
      prompt: null,
      variables: [],
      description: null,
    });
  });

  it('toCreateBody keeps prompt and variables for a pipeline in Prompt mode', () => {
    const body = toCreateBody({
      ...agentValues,
      type: 'pipeline',
      run_mode: 'prompt',
      description: 'Nightly',
    });
    expect(body).toMatchObject({ run_mode: 'prompt', prompt: 'Summarize {{team}}', description: 'Nightly' });
    expect(body.variables).toHaveLength(1);
  });
});

describe('EL-7011 R6.3 server 400 messages', () => {
  it('toFieldErrors maps the message to its field', () => {
    const error = { status: 400, data: { error: 'Enter a prompt for the agent', field: 'prompt' } };
    expect(toFieldErrors(error)).toEqual({ prompt: 'Enter a prompt for the agent' });
  });

  it('toFieldErrors returns no field errors for a message without a field', () => {
    expect(toFieldErrors({ status: 400, data: { error: 'Choose a version' } })).toEqual({});
    expect(toFieldErrors(undefined)).toEqual({});
  });
});
