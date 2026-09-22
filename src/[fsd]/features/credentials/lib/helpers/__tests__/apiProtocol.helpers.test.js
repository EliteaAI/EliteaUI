import { describe, expect, it } from 'vitest';

import {
  credentialKeyOf,
  findCredentialType,
  isApiProtocolCredentialType,
  resolveApiProtocolForModel,
} from '../apiProtocol.helpers.js';

describe('isApiProtocolCredentialType', () => {
  it('accepts ai_dial in any casing', () => {
    expect(isApiProtocolCredentialType('ai_dial')).toBe(true);
    expect(isApiProtocolCredentialType('AI_DIAL')).toBe(true);
  });

  it('rejects other credential types and empty values', () => {
    expect(isApiProtocolCredentialType('ai_openai')).toBe(false);
    expect(isApiProtocolCredentialType('')).toBe(false);
    expect(isApiProtocolCredentialType(undefined)).toBe(false);
    expect(isApiProtocolCredentialType(null)).toBe(false);
  });
});

describe('findCredentialType', () => {
  const configurations = [
    { elitea_title: 'My DIAL', type: 'ai_dial' },
    { elitea_title: 'My OpenAI', type: 'ai_openai' },
  ];

  it('resolves the type by elitea_title', () => {
    expect(findCredentialType(configurations, { elitea_title: 'My DIAL' })).toBe('ai_dial');
    expect(findCredentialType(configurations, { elitea_title: 'My OpenAI' })).toBe('ai_openai');
  });

  it('returns empty string when unresolvable', () => {
    expect(findCredentialType(configurations, { elitea_title: 'Unknown' })).toBe('');
    expect(findCredentialType(configurations, undefined)).toBe('');
    expect(findCredentialType(undefined, { elitea_title: 'My DIAL' })).toBe('');
  });

  it('disambiguates same-title personal vs project credentials by private/project_id', () => {
    const shared = [
      { elitea_title: 'Shared Name', type: 'ai_dial', project_id: 1 },
      { elitea_title: 'Shared Name', type: 'ai_openai', project_id: 99 },
    ];
    expect(findCredentialType(shared, { elitea_title: 'Shared Name', private: true }, 99)).toBe('ai_openai');
    expect(findCredentialType(shared, { elitea_title: 'Shared Name', private: false }, 99)).toBe('ai_dial');
  });
});

describe('credentialKeyOf', () => {
  it('is stable across rebuilt value objects', () => {
    const key = credentialKeyOf({ elitea_title: 'My DIAL', private: false });
    expect(credentialKeyOf({ elitea_title: 'My DIAL', private: false })).toBe(key);
  });

  it('separates same-title personal and project credentials', () => {
    expect(credentialKeyOf({ elitea_title: 'Shared Name', private: true })).not.toBe(
      credentialKeyOf({ elitea_title: 'Shared Name', private: false }),
    );
  });

  it('treats a missing private flag as not private', () => {
    expect(credentialKeyOf({ elitea_title: 'My DIAL' })).toBe(
      credentialKeyOf({ elitea_title: 'My DIAL', private: false }),
    );
  });

  it('returns empty string when nothing is attached', () => {
    expect(credentialKeyOf(undefined)).toBe('');
    expect(credentialKeyOf(null)).toBe('');
  });
});

describe('resolveApiProtocolForModel', () => {
  it('maps the Claude family to anthropic', () => {
    ['anthropic.claude-sonnet-5', 'claude-opus-5', 'Sonnet-5', 'anthropic.claude-haiku-4-5'].forEach(name =>
      expect(resolveApiProtocolForModel(name)).toBe('anthropic'),
    );
  });

  it('maps the gpt family to openai', () => {
    ['gpt-5.4-2026-03-05', 'GPT-4o', 'azure.gpt-4o-mini'].forEach(name =>
      expect(resolveApiProtocolForModel(name)).toBe('openai'),
    );
  });

  it('returns empty string for unknown or empty names', () => {
    expect(resolveApiProtocolForModel('gemini-2.5-pro')).toBe('');
    // "gpt" must be a token boundary, not any substring
    expect(resolveApiProtocolForModel('mygptmodel')).toBe('');
    expect(resolveApiProtocolForModel('')).toBe('');
    expect(resolveApiProtocolForModel(undefined)).toBe('');
  });
});
