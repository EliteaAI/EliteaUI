// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import {
  buildAgentRunAnalyticsPath,
  buildAgentRunAnalyticsUrl,
  formatAgentModelLabel,
  formatAgentRunModels,
} from '../agentAnalytics.helpers';

const OWN_AGENT = { agentId: 42, kind: 'agent', entityProjectId: 2, projectId: 2 };
const RUN = { run_id: '0b7c3a2e-5d4f-4c1a-9e8b-1f2a3b4c5d6e', conversation_id: 1701 };

describe('buildAgentRunAnalyticsPath', () => {
  it('opens an agent run on the agent run analytics, scoped to the usage run and its conversation', () => {
    expect(buildAgentRunAnalyticsPath(OWN_AGENT, RUN)).toBe(
      '/agents/all/42/history/analytics?usage_run_id=0b7c3a2e-5d4f-4c1a-9e8b-1f2a3b4c5d6e&history_run_id=1701',
    );
  });

  it('opens a pipeline run on the pipeline run analytics', () => {
    expect(buildAgentRunAnalyticsPath({ ...OWN_AGENT, kind: 'pipeline' }, RUN)).toBe(
      '/pipelines/all/42/history/analytics?usage_run_id=0b7c3a2e-5d4f-4c1a-9e8b-1f2a3b4c5d6e&history_run_id=1701',
    );
  });

  it('links an API or MCP run that has no conversation by its usage run alone', () => {
    expect(buildAgentRunAnalyticsPath(OWN_AGENT, { ...RUN, conversation_id: null })).toBe(
      '/agents/all/42/history/analytics?usage_run_id=0b7c3a2e-5d4f-4c1a-9e8b-1f2a3b4c5d6e',
    );
  });

  it('matches the project across a numeric and a string id', () => {
    expect(buildAgentRunAnalyticsPath({ ...OWN_AGENT, entityProjectId: '2' }, RUN)).not.toBeNull();
  });

  it('gives a Catalog agent run from another project no link', () => {
    expect(buildAgentRunAnalyticsPath({ ...OWN_AGENT, entityProjectId: 1 }, RUN)).toBeNull();
  });

  it('gives a deleted or unknown agent no link', () => {
    expect(buildAgentRunAnalyticsPath({ ...OWN_AGENT, kind: null }, RUN)).toBeNull();
  });

  it('gives a run without a run id no link', () => {
    expect(buildAgentRunAnalyticsPath(OWN_AGENT, { conversation_id: 1701 })).toBeNull();
  });
});

describe('buildAgentRunAnalyticsUrl', () => {
  it('builds an absolute URL in the project workspace', () => {
    expect(buildAgentRunAnalyticsUrl(OWN_AGENT, RUN)).toBe(
      `${window.location.origin}/2/agents/all/42/history/analytics?usage_run_id=0b7c3a2e-5d4f-4c1a-9e8b-1f2a3b4c5d6e&history_run_id=1701`,
    );
  });

  it('is empty for a run without a run page', () => {
    expect(buildAgentRunAnalyticsUrl({ ...OWN_AGENT, kind: null }, RUN)).toBe('');
  });
});

describe('agent analytics labels', () => {
  it('names a model by its display name, then its raw name, then Unknown model', () => {
    expect(formatAgentModelLabel({ model_name: 'gpt-4o', display_name: 'GPT-4o' })).toBe('GPT-4o');
    expect(formatAgentModelLabel({ model_name: 'gpt-4o', display_name: null })).toBe('gpt-4o');
    expect(formatAgentModelLabel({ model_name: null, display_name: null })).toBe('Unknown model');
  });

  it('lists every model of a multi-model run', () => {
    expect(
      formatAgentRunModels([
        { model_name: 'gpt-4o', display_name: 'GPT-4o' },
        { model_name: 'claude', display_name: 'Claude Sonnet' },
      ]),
    ).toBe('GPT-4o, Claude Sonnet');
    expect(formatAgentRunModels([])).toBe('—');
  });
});
