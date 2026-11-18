import { describe, expect, it } from 'vitest';

import {
  ELITEA_BUILDER_INTERNAL_TOOL,
  INTERNAL_TOOL_AGENT_PERSONALIZATION_FIELD_MAP,
  INTERNAL_TOOL_PERSONALIZATION_FIELD_MAP,
  getEnabledAgentInternalToolNames,
  getEnabledInternalToolNames,
} from '../internalTools.constants';

describe('Elitea Builder defaults (#7383)', () => {
  it('maps the one builder key to the new default fields', () => {
    expect(INTERNAL_TOOL_PERSONALIZATION_FIELD_MAP[ELITEA_BUILDER_INTERNAL_TOOL]).toBe(
      'default_elitea_builder_enabled',
    );
    expect(INTERNAL_TOOL_AGENT_PERSONALIZATION_FIELD_MAP[ELITEA_BUILDER_INTERNAL_TOOL]).toBe(
      'default_agent_elitea_builder_enabled',
    );
  });

  it('has no field for the removed builder modules', () => {
    for (const map of [
      INTERNAL_TOOL_PERSONALIZATION_FIELD_MAP,
      INTERNAL_TOOL_AGENT_PERSONALIZATION_FIELD_MAP,
    ]) {
      for (const removed of ['internal_mcp', 'skill_builder', 'project_context_builder']) {
        expect(map).not.toHaveProperty(removed);
      }
    }
  });

  it('turns the builder on for a new chat / agent from its default', () => {
    expect(getEnabledInternalToolNames({ default_elitea_builder_enabled: true })).toEqual(['elitea_builder']);
    expect(getEnabledAgentInternalToolNames({ default_agent_elitea_builder_enabled: true })).toEqual([
      'elitea_builder',
    ]);
    expect(getEnabledInternalToolNames({ default_internal_mcp_enabled: true })).toEqual([]);
  });
});
