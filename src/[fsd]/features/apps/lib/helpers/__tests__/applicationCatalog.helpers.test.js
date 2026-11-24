import { describe, expect, it } from 'vitest';

import { APPLICATION_CATALOG } from '../../constants/applicationCatalog.constants';
import { filterApplicationsByQuery } from '../applicationCatalog.helpers';

const APPLICATIONS = APPLICATION_CATALOG.map(application => ({
  ...application,
  typeLabel: `${application.name} type`,
}));

const namesOf = applications => applications.map(({ name }) => name);

describe('filterApplicationsByQuery', () => {
  it('returns every application, in catalog order, for an empty or blank query', () => {
    expect(namesOf(filterApplicationsByQuery(APPLICATIONS, ''))).toEqual([
      'Wikis',
      'Inventory',
      'Questionnaire',
    ]);
    expect(filterApplicationsByQuery(APPLICATIONS, '   ')).toBe(APPLICATIONS);
    expect(filterApplicationsByQuery(APPLICATIONS)).toBe(APPLICATIONS);
  });

  it.each([
    ['the name', 'inventory', ['Inventory']],
    ['the type label', 'questionnaire type', ['Questionnaire']],
    ['the description', 'repository code', ['Wikis']],
    ['a capability', 'dependency discovery', ['Inventory']],
    ['the "best for" line', 'onboarding', ['Wikis']],
  ])('matches %s', (_, query, expected) => {
    expect(namesOf(filterApplicationsByQuery(APPLICATIONS, query))).toEqual(expected);
  });

  it('ignores case and surrounding spaces', () => {
    expect(namesOf(filterApplicationsByQuery(APPLICATIONS, '  WIKI  '))).toEqual(['Wikis']);
  });

  it('keeps the catalog order when several match', () => {
    expect(namesOf(filterApplicationsByQuery(APPLICATIONS, 'repository'))).toEqual(['Wikis', 'Inventory']);
  });

  it('returns nothing when nothing matches', () => {
    expect(filterApplicationsByQuery(APPLICATIONS, 'zzz')).toEqual([]);
  });
});
