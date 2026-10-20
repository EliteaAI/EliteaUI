import { describe, expect, it } from 'vitest';

import { findNoticeAgent } from '@/[fsd]/features/chat/lib/helpers/scheduleRunNotice.helpers';
import { sioEvents } from '@/common/constants';

const agent = { entity_name: 'application', entity_meta: { id: 7, project_id: 5 } };

describe('EL-7011 US-42 scheduleRunNotice helpers', () => {
  it('names the run event', () => {
    expect(sioEvents.schedule_run_finished).toBe('schedule_run_finished');
  });

  it('R3.1 returns the participant of the agent in the open chat', () => {
    const participants = [{ entity_name: 'user', entity_meta: { id: 7 } }, agent];
    expect(findNoticeAgent({ entity_id: 7 }, participants, 5)).toBe(agent);
  });

  it('R3.1 returns nothing when the chat has no such agent', () => {
    expect(findNoticeAgent({ entity_id: 8 }, [agent], 5)).toBeUndefined();
    expect(findNoticeAgent({ entity_id: 7 }, [], 5)).toBeUndefined();
    expect(findNoticeAgent({ entity_id: 7 }, undefined, 5)).toBeUndefined();
  });

  it('R3.2 returns nothing for another project', () => {
    expect(findNoticeAgent({ entity_id: 7, project_id: 6 }, [agent], 5)).toBeUndefined();
    expect(findNoticeAgent({ entity_id: 7 }, [agent], 6)).toBeUndefined();
  });

  it('R3.1 returns nothing for an event without an agent id', () => {
    const noId = { entity_name: 'application', entity_meta: { project_id: 5 } };
    expect(findNoticeAgent({}, [noId], 5)).toBeUndefined();
  });

  it('R3.1 and R3.2 match ids given as strings or numbers', () => {
    expect(findNoticeAgent({ entity_id: '7', project_id: '5' }, [agent], 5)).toBe(agent);
  });
});
