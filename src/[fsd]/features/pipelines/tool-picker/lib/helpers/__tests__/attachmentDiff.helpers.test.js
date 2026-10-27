import { describe, expect, it } from 'vitest';

import { diffAttachments, getAttachmentKey } from '../attachmentDiff.helpers';

const toolkit = (id, selectedTools) => ({ id, type: 'jira', settings: { selected_tools: selectedTools } });
const agent = (applicationId, versionId, id) => ({
  id,
  type: 'application',
  name: `Agent ${applicationId}`,
  settings: { application_id: applicationId, application_version_id: versionId },
});

describe('getAttachmentKey', () => {
  it('keys toolkits by tool id and agents by application id', () => {
    expect(getAttachmentKey(toolkit(3))).toBe('toolkit:3');
    expect(getAttachmentKey(agent(7, 70))).toBe('application:7');
  });
});

describe('diffAttachments', () => {
  it('reports nothing for an unchanged list, whatever its order', () => {
    const diff = diffAttachments(
      [toolkit(1, ['a', 'b']), agent(7, 70, 11)],
      [agent(7, 70, 11), toolkit(1, ['b', 'a'])],
    );
    expect(diff.hasChanges).toBe(false);
  });

  it('matches by identity, not by index, when an item is removed and another added', () => {
    const diff = diffAttachments(
      [toolkit(1, ['a']), toolkit(2, ['b'])],
      [toolkit(2, ['b']), toolkit(3, ['c']), agent(7, 70)],
    );
    expect(diff.added.map(getAttachmentKey)).toEqual(['toolkit:3', 'application:7']);
    expect(diff.removed.map(getAttachmentKey)).toEqual(['toolkit:1']);
    expect(diff.selectedToolsChanged).toEqual([]);
    expect(diff.versionChanged).toEqual([]);
  });

  it('reports changed selected tools and agent versions', () => {
    const diff = diffAttachments(
      [toolkit(1, ['a']), agent(7, 70, 11)],
      [toolkit(1, ['a', 'b']), agent(7, 71, 11)],
    );
    expect(diff.selectedToolsChanged.map(getAttachmentKey)).toEqual(['toolkit:1']);
    expect(diff.versionChanged.map(({ tool }) => tool.settings.application_version_id)).toEqual([71]);
    expect(diff.hasChanges).toBe(true);
  });
});
