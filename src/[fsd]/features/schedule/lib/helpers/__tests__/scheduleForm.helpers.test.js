// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { MAX_DESCRIPTION_LENGTH } from '@/common/constants';

import {
  DEFAULT_SCHEDULE_CRON,
  buildEditValues,
  buildInitialValues,
  getEntityLock,
  isPromptShown,
  resetWhatToRun,
  scheduleFormSchema,
  syncPromptVariables,
  toCreateBody,
  toFieldErrors,
  toUpdateBody,
  toWarningItems,
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

describe('EL-7011 R6.1 required fields', () => {
  it('schedule form schema asks for a name, an entity and a version', async () => {
    const empty = { ...agentValues, name: ' ', application_id: '', version_id: null };
    const error = await scheduleFormSchema.validate(empty, { abortEarly: false }).catch(e => e);
    expect(error.errors).toEqual(
      expect.arrayContaining(['Name is required', 'Choose an agent or a pipeline', 'Choose a version']),
    );
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

  it('R1.5 EL-7011 syncPromptVariables and buildEditValues accept a schedule with no prompt', () => {
    expect(syncPromptVariables(null, [])).toEqual([]);
    expect(syncPromptVariables(undefined)).toEqual([]);
    expect(
      buildEditValues({
        id: 64,
        name: 'Entry point run',
        entity_type: 'pipeline',
        run_mode: 'entry_point',
        prompt: null,
        variables: [],
        cron: '0 * * * *',
        timezone: 'UTC',
      }).values,
    ).toMatchObject({ prompt: '', variables: [] });
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
    expect(returnTo).toBe('/settings/schedules');
  });

  it('R1.3 EL-7011 buildInitialValues holds the schedule settings in the form values', () => {
    const { values } = buildInitialValues(new URLSearchParams(''), null);
    expect(values).toMatchObject({
      cron: DEFAULT_SCHEDULE_CRON,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      expires_at: null,
    });
  });

  it('R6.5 EL-7011 buildInitialValues accepts only an in-app returnTo path', () => {
    const returnTo = state => buildInitialValues(new URLSearchParams(''), { returnTo: state }).returnTo;
    expect(returnTo('//evil.example')).toBe('/settings/schedules');
    expect(returnTo('https://evil.example')).toBe('/settings/schedules');
    expect(returnTo('/agents/3')).toBe('/agents/3');
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
      approval_rule: 'pause_and_ask',
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

describe('EL-7011 R1.4 approval rule in the body', () => {
  it('toCreateBody sends the chosen rule', () => {
    expect(toCreateBody({ ...agentValues, approval_rule: 'run_without_asking' }).approval_rule).toBe(
      'run_without_asking',
    );
  });

  it('buildInitialValues starts with pause_and_ask', () => {
    expect(buildInitialValues(new URLSearchParams(), null).values.approval_rule).toBe('pause_and_ask');
  });
});

describe('EL-7011 R2.3 save warnings', () => {
  it('toWarningItems maps each server code to a label, text and target', () => {
    const items = toWarningItems([
      { code: 'human_input_step', message: 'Asks a person', step: 'ask' },
      { code: 'missing_credential', message: 'No credential', toolkit: 'jira' },
      { code: 'token_may_expire', message: 'Token ages', toolkit: 'git' },
      { code: 'sensitive_action', message: 'Deletes data', toolkit: 'jira', tool: 'delete_issue' },
      { code: 'scan_incomplete', message: 'Not all scanned' },
      { code: 'other', message: 'Something' },
    ]);
    expect(items.map(i => i.text)).toEqual([
      'Asks a person',
      'No credential',
      'Token ages',
      'Deletes data',
      'Not all scanned',
      'Something',
    ]);
    expect(items.map(i => i.target)).toEqual([
      'ask',
      'jira',
      'git',
      'jira / delete_issue',
      undefined,
      undefined,
    ]);
    expect(new Set(items.slice(0, 5).map(i => i.label)).size).toBe(5);
    expect(items[5].label).toBe('Warning');
  });

  it('toWarningItems accepts a missing list', () => {
    expect(toWarningItems(undefined)).toEqual([]);
  });
});

const saved = {
  id: 4,
  name: 'Night report',
  description: 'Daily',
  entity_type: 'pipeline',
  application_id: 7,
  version_id: 12,
  run_mode: 'prompt',
  prompt: 'Summarize {{team}}',
  variables: [{ name: 'team', value: 'core' }],
  cron: '0 2 * * *',
  timezone: 'UTC',
  expires_at: '2026-12-31T23:59:59+00:00',
  created_by: 3,
};

describe('EL-7011 R1.5 edit values', () => {
  it('fills the form with the saved values and one variable per placeholder', () => {
    const { values, returnTo } = buildEditValues(
      { ...saved, prompt: 'Hi {{team}} {{day}}' },
      { returnTo: '/settings/schedules?x=1' },
    );
    expect(values).toMatchObject({
      name: 'Night report',
      description: 'Daily',
      type: 'pipeline',
      application_id: 7,
      version_id: 12,
      run_mode: 'prompt',
      prompt: 'Hi {{team}} {{day}}',
      expires_at: '2026-12-31',
    });
    expect(values.variables).toHaveLength(2);
    expect(values.variables).toEqual(
      expect.arrayContaining([
        { name: 'team', value: 'core' },
        { name: 'day', value: '' },
      ]),
    );
    expect(values.timezone).toBeTruthy();
    expect(returnTo).toBe('/settings/schedules?x=1');
  });

  it('keeps an empty description and no expiry empty', () => {
    const { values } = buildEditValues({ ...saved, description: null, expires_at: null }, undefined);
    expect(values.description).toBe('');
    expect(values.expires_at).toBeNull();
  });

  it('R2.1 keeps the saved cron and time zone, so an unchanged Save stays in the schedule zone', () => {
    const tokyo = {
      ...saved,
      cron: '0 9 * * *',
      timezone: 'Asia/Tokyo',
      expires_at: '2026-12-31T20:00:00+00:00',
    };
    const body = toUpdateBody(buildEditValues(tokyo, undefined).values);
    expect(body).toMatchObject({ cron: '0 9 * * *', timezone: 'Asia/Tokyo', expires_at: '2027-01-01' });
  });

  it('reads the expiry date in the schedule time zone, not in UTC', () => {
    const { values } = buildEditValues(
      { ...saved, timezone: 'Asia/Tokyo', expires_at: '2026-12-31T20:00:00+00:00' },
      undefined,
    );
    expect(values.expires_at).toBe('2027-01-01');
  });
});

describe('EL-7011 R2.3 R2.5 update body', () => {
  it('has the create body rules and no created_by', () => {
    const { values } = buildEditValues(saved, undefined);
    const body = toUpdateBody({ ...values, created_by: 3 });
    expect(body).not.toHaveProperty('created_by');
    expect(body).toMatchObject({
      description: 'Daily',
      entity_type: 'pipeline',
      run_mode: 'prompt',
      prompt: 'Summarize {{team}}',
      variables: [{ name: 'team', value: 'core' }],
    });
    expect(toUpdateBody(values)).toEqual(toCreateBody(values));
  });
});
