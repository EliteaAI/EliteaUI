// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import RouteDefinitions from '@/routes';

import {
  buildEditValues,
  buildInitialValues,
  isWebhookForm,
  scheduleFormSchema,
  toCreateBody,
  toUpdateBody,
} from '../scheduleForm.helpers';

const webhookValues = {
  name: 'On push',
  description: '',
  type: 'agent',
  application_id: 7,
  version_id: 12,
  run_mode: null,
  prompt: 'Review the push',
  variables: [],
  approval_rule: 'pause_and_ask',
  enabled: true,
  trigger_kind: 'webhook',
  webhook_type: 'github',
  gitlab_auth_method: null,
  signing_secret_value: '',
};
// A whsec_ token with a 32-byte key, long enough for the truncation check
const SIGNING_TOKEN = `whsec_${btoa('k'.repeat(32))}`;

describe('webhook form values (#7405)', () => {
  it('a new webhook form has a sender and no cron timing', () => {
    const { values, returnTo } = buildInitialValues(new URLSearchParams(), undefined, {}, 'webhook');
    expect(isWebhookForm(values)).toBe(true);
    expect(values.webhook_type).toBe('github');
    expect(values).not.toHaveProperty('cron');
    expect(values).not.toHaveProperty('expires_at');
    // Without an editor or a return path, Save goes back to the Webhooks page
    expect(returnTo).toBe(RouteDefinitions.Webhooks);
  });

  it('a schedule form keeps its cron default and the Schedules return path', () => {
    const { values, returnTo } = buildInitialValues(new URLSearchParams());
    expect(values.cron).toBeTruthy();
    expect(values).not.toHaveProperty('trigger_kind');
    expect(returnTo).toBe(RouteDefinitions.Schedules);
  });

  it('the edit form of a saved webhook takes its sender and no cron fields', () => {
    const { values } = buildEditValues(
      {
        id: 5,
        name: 'On MR',
        entity_type: 'agent',
        application_id: 7,
        version_id: 12,
        prompt: 'Go',
        variables: [],
        trigger_kind: 'webhook',
        webhook_type: 'gitlab',
        gitlab_auth_method: 'signing_token',
        approval_rule: 'pause_and_ask',
      },
      undefined,
      {},
    );
    expect(values).toMatchObject({ trigger_kind: 'webhook', webhook_type: 'gitlab', id: 5 });
    expect(values.cron).toBeUndefined();
  });
});

describe('webhook bodies (#7405)', () => {
  it('a GitHub create body has the sender and no cron, timezone or stop date', () => {
    const body = toCreateBody(webhookValues);
    expect(body).toMatchObject({ trigger_kind: 'webhook', webhook_type: 'github', gitlab_auth_method: null });
    expect(body).not.toHaveProperty('cron');
    expect(body).not.toHaveProperty('timezone');
    expect(body).not.toHaveProperty('expires_at');
    expect(body).not.toHaveProperty('signing_secret_value');
  });

  it('a GitLab signing-token create body carries the pasted token, trimmed', () => {
    const body = toCreateBody({
      ...webhookValues,
      webhook_type: 'gitlab',
      gitlab_auth_method: 'signing_token',
      signing_secret_value: ` ${SIGNING_TOKEN} `,
    });
    expect(body).toMatchObject({ gitlab_auth_method: 'signing_token', signing_secret_value: SIGNING_TOKEN });
  });

  it('a GitLab method left over after switching to GitHub is not sent', () => {
    const body = toCreateBody({ ...webhookValues, gitlab_auth_method: 'secret_token' });
    expect(body.gitlab_auth_method).toBeNull();
  });

  it('the update body of a webhook has neither trigger nor cron fields', () => {
    const body = toUpdateBody({
      ...webhookValues,
      webhook_type: 'gitlab',
      gitlab_auth_method: 'secret_token',
    });
    ['trigger_kind', 'webhook_type', 'gitlab_auth_method', 'signing_secret_value', 'cron', 'enabled'].forEach(
      key => expect(body).not.toHaveProperty(key),
    );
    expect(body.name).toBe('On push');
  });
});

describe('webhook form validation (#7405)', () => {
  const signing = { ...webhookValues, webhook_type: 'gitlab', gitlab_auth_method: 'signing_token' };

  it('a new signing-token webhook needs a whsec_ token', async () => {
    await expect(scheduleFormSchema.validate({ ...signing, signing_secret_value: 'abc' })).rejects.toThrow(
      'whsec_',
    );
    await expect(
      scheduleFormSchema.validate({ ...signing, signing_secret_value: SIGNING_TOKEN }),
    ).resolves.toBeTruthy();
  });

  it('a saved signing-token webhook edits without a token', async () => {
    await expect(scheduleFormSchema.validate({ ...signing, id: 5 })).resolves.toBeTruthy();
  });
});
