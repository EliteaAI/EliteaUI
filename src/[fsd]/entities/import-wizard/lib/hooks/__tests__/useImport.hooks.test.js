// @vitest-environment jsdom
import JSZip from 'jszip';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanup, renderHook } from '@testing-library/react';

import { useImport } from '../useImport.hooks';

const dispatch = vi.fn();
const toastError = vi.fn();

vi.mock('react-redux', () => ({ useDispatch: () => dispatch }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useToast: () => ({ toastError }) }));

const GUIDE = '# Guide\n\nRead the forms first.\n';
const GUIDE_SHA = 'a'.repeat(64);

const AGENT_MD = `---
name: pdf-agent
description: Fills PDF forms
skills:
- name: pdf-tools
  description: PDF helpers
  version: base
  instructions: Use the guide.
  files_folder: skills/pdf-tools
  files:
  - path: references/guide.md
    size: ${GUIDE.length}
    sha256: ${GUIDE_SHA}
    content_type: text/markdown
    is_text: true
---

Agent instructions.`;

const SKILL_REFERENCE_WITH_FRONTMATTER = `---
name: not-an-agent
---

A skill reference that happens to have frontmatter.`;

const agentZip = async (members = {}) => {
  const zip = new JSZip();
  zip.file('pdf-agent.agent.md', AGENT_MD);
  zip.file('skills/pdf-tools/references/guide.md', GUIDE);
  zip.file('skills/pdf-tools/references/notes.md', SKILL_REFERENCE_WITH_FRONTMATTER);
  Object.entries(members).forEach(([name, content]) => zip.file(name, content));
  return zip.generateAsync({ type: 'uint8array' });
};

const upload = async (bytes, name) => {
  const { result } = renderHook(() => useImport());
  await result.current.handleFileUpload({ target: { files: [new File([bytes], name)] } });
  return dispatch.mock.calls.at(-1)?.[0]?.payload?.data;
};

const toBase64 = text => btoa(text);

beforeEach(() => {
  dispatch.mockClear();
  toastError.mockClear();
});

afterEach(cleanup);

describe('agent Markdown ZIP import with skill files', () => {
  it('imports only the agent and gives its skill version the bundled file', async () => {
    const data = await upload(await agentZip(), 'pdf-agent.zip');

    expect(toastError).not.toHaveBeenCalled();
    expect(data.applications.map(app => app.name)).toEqual(['pdf-agent']);
    expect(data.skills).toHaveLength(1);
    expect(data.skills[0].versions[0].files).toEqual([
      { path: 'references/guide.md', sha256: GUIDE_SHA, content_base64: toBase64(GUIDE) },
    ]);
    expect(data.skills[0].versions[0]).not.toHaveProperty('files_folder');
  });

  it('refuses an archive whose listed skill file is missing', async () => {
    const zip = await JSZip.loadAsync(await agentZip());
    zip.remove('skills/pdf-tools/references/guide.md');

    const data = await upload(await zip.generateAsync({ type: 'uint8array' }), 'pdf-agent.zip');

    expect(data).toBeUndefined();
    expect(toastError).toHaveBeenCalledWith(expect.stringContaining('skills/pdf-tools/references/guide.md'));
  });

  it('imports a lone agent Markdown file without the skill files it can not carry', async () => {
    await upload(new TextEncoder().encode(AGENT_MD), 'pdf-agent.agent.md');
    await vi.waitFor(() => expect(dispatch).toHaveBeenCalled());
    const { data } = dispatch.mock.calls[0][0].payload;

    expect(data.skills[0].versions[0].instructions).toBe('Use the guide.');
    expect(data.skills[0].versions[0]).not.toHaveProperty('files');
    expect(data.skills[0].versions[0]).not.toHaveProperty('files_folder');
  });
});
