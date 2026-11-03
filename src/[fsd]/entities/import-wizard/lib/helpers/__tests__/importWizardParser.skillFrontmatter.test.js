// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { mdToApplicationJson, parseMdFrontmatter } from '../importWizardParser.helpers';

const AGENT_MD = `---
name: release-agent
description: Writes release notes
skills:
- name: release-notes
  description: Drafts notes
  version: v2
  instructions: Collect the PRs.
  frontmatter:
    license: MIT
    metadata:
      author: me
      elitea-tags: '["release"]'
      elitea-temperature: '0.3'
- name: plain-skill
  description: No extra keys
  version: base
  instructions: Do it.
---

Agent instructions.`;

const importSkills = content => {
  const { frontmatter, body } = parseMdFrontmatter(content);
  return mdToApplicationJson(frontmatter, body).skills;
};

describe('mdToApplicationJson embedded skill frontmatter', () => {
  it('passes each embedded skill frontmatter to the server as the version meta', () => {
    const [skill] = importSkills(AGENT_MD);

    expect(skill.versions).toEqual([
      {
        name: 'v2',
        instructions: 'Collect the PRs.',
        meta: {
          frontmatter: {
            license: 'MIT',
            metadata: { author: 'me', 'elitea-tags': '["release"]', 'elitea-temperature': '0.3' },
          },
        },
      },
    ]);
  });

  it('sends no meta for a skill without frontmatter', () => {
    const [, plain] = importSkills(AGENT_MD);

    expect(plain.versions).toEqual([{ name: 'base', instructions: 'Do it.' }]);
  });
});
