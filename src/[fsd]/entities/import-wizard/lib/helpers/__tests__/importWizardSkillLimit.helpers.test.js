// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import {
  getSkillLimitErrors,
  pruneDeselectedSkillRefs,
} from '@/[fsd]/entities/import-wizard/lib/helpers/importWizardSkillLimit.helpers';

const buildItems = (skillsCount, { deselected = 0 } = {}) => [
  {
    entity: 'agents',
    import_uuid: 'agent-1',
    isSelected: true,
    name: 'agent',
    versions: [
      {
        name: 'base',
        isSelected: true,
        skills: Array.from({ length: skillsCount }, (_, i) => ({ import_uuid: `skill-${i}` })),
      },
    ],
  },
  ...Array.from({ length: skillsCount }, (_, i) => ({
    entity: 'skills',
    import_uuid: `skill-${i}`,
    isSelected: i >= deselected,
    versions: [{ name: 'base' }],
  })),
];

describe('getSkillLimitErrors', () => {
  it('reports an agent whose selected skills exceed the target project limit', () => {
    const errors = getSkillLimitErrors(buildItems(50), 10);

    expect(Object.keys(errors)).toEqual(['agent-1']);
    expect(errors['agent-1']).toHaveLength(1);
    expect(errors['agent-1'][0]).toContain('50 selected');
    expect(errors['agent-1'][0]).toContain('at most 10');
    expect(errors['agent-1'][0]).toContain('Deselect at least 40');
  });

  it('allows exactly the limit', () => {
    expect(getSkillLimitErrors(buildItems(10), 10)).toEqual({});
  });

  it('clears the error once enough skills are deselected', () => {
    expect(getSkillLimitErrors(buildItems(50, { deselected: 39 }), 10)['agent-1'][0]).toContain(
      'Deselect at least 1 ',
    );
    expect(getSkillLimitErrors(buildItems(50, { deselected: 40 }), 10)).toEqual({});
  });

  it('blocks nothing while the limit is unknown', () => {
    expect(getSkillLimitErrors(buildItems(50), undefined)).toEqual({});
    expect(getSkillLimitErrors(buildItems(50), 0)).toEqual({});
  });

  it('tolerates missing items', () => {
    expect(getSkillLimitErrors(undefined, 10)).toEqual({});
  });
});

describe('pruneDeselectedSkillRefs', () => {
  it('removes references to skills that are not part of the import anymore', () => {
    const selected = buildItems(3).filter(item => item.import_uuid !== 'skill-1');

    const [agent] = pruneDeselectedSkillRefs(selected);

    expect(agent.versions[0].skills).toEqual([{ import_uuid: 'skill-0' }, { import_uuid: 'skill-2' }]);
  });

  it('leaves agents without skills and other entities untouched', () => {
    const items = [
      { entity: 'agents', import_uuid: 'a', versions: [{ name: 'base' }] },
      { entity: 'toolkits', import_uuid: 't' },
    ];

    expect(pruneDeselectedSkillRefs(items)).toEqual(items);
  });
});
