import { describe, expect, it } from 'vitest';

import { ContentType } from '@/common/constants';

import { buildCardNavigation } from '../cardNavigation.helpers';
import { isModifiedClick, prependProjectSegment } from '../navigation.helpers';

describe('buildCardNavigation', () => {
  const base = { id: 12, tab: 'all', viewMode: 'owner', name: 'My agent' };

  it('builds the agent detail path and query', () => {
    const result = buildCardNavigation({ ...base, type: ContentType.ApplicationAll });
    expect(result.pathname).toBe('/agents/all/12');
    expect(result.search).toBe('viewMode=owner&name=My%20agent');
    expect(result.pagePath).toBe('/agents/all/12?viewMode=owner&name=My%20agent');
  });

  it('uses the pipelines and toolkits routes', () => {
    expect(buildCardNavigation({ ...base, type: ContentType.PipelineAll }).pathname).toBe(
      '/pipelines/all/12',
    );
    expect(buildCardNavigation({ ...base, type: ContentType.ToolkitAll }).pathname).toBe('/toolkits/all/12');
  });

  it('ignores the tab for fixed-tab content types', () => {
    expect(buildCardNavigation({ ...base, type: ContentType.ApplicationTop }).pathname).toBe(
      '/agents/top/12',
    );
  });

  it('prefixes the project id when given', () => {
    const result = buildCardNavigation({ ...base, type: ContentType.ApplicationAll, projectId: 3 });
    expect(result.pathname).toBe('/3/agents/all/12');
  });

  it('appends author params and the extra param prefix', () => {
    const result = buildCardNavigation({
      ...base,
      type: ContentType.ApplicationAll,
      authorName: 'Jo Doe',
      authorId: 9,
      extraParam: 'x=1&',
      anchor: '#tab',
    });
    expect(result.search).toBe('x=1&viewMode=owner&name=My%20agent&author_name=Jo%20Doe&author_id=9');
    expect(result.pagePath).toBe(
      '/agents/all/12#tab?x=1&viewMode=owner&name=My%20agent&author_name=Jo%20Doe&author_id=9',
    );
  });

  it('returns an undefined pathname for an unknown type', () => {
    expect(buildCardNavigation({ ...base, type: 'nope' }).pathname).toBeUndefined();
  });
});

describe('isModifiedClick', () => {
  it('is false for a plain left click and for a missing event', () => {
    expect(isModifiedClick({ button: 0 })).toBe(false);
    expect(isModifiedClick(undefined)).toBe(false);
  });

  it('is true for modifier keys and non-primary buttons', () => {
    expect(isModifiedClick({ button: 0, ctrlKey: true })).toBe(true);
    expect(isModifiedClick({ button: 0, metaKey: true })).toBe(true);
    expect(isModifiedClick({ button: 0, shiftKey: true })).toBe(true);
    expect(isModifiedClick({ button: 0, altKey: true })).toBe(true);
    expect(isModifiedClick({ button: 1 })).toBe(true);
  });
});

describe('prependProjectSegment', () => {
  it('prefixes the project as a leading path segment, keeping query and hash', () => {
    expect(prependProjectSegment('/agents/all/7', 5)).toBe('/5/agents/all/7');
    expect(prependProjectSegment('/agents/all/7?viewMode=owner#top', 5)).toBe(
      '/5/agents/all/7?viewMode=owner#top',
    );
  });

  it('handles the root path', () => {
    expect(prependProjectSegment('/', 5)).toBe('/5');
  });

  it('does not double-prefix an href that already names a project', () => {
    expect(prependProjectSegment('/9/agents/all/7', 5)).toBe('/9/agents/all/7');
    expect(prependProjectSegment('/9', 5)).toBe('/9');
    expect(prependProjectSegment('/9?x=1', 5)).toBe('/9?x=1');
  });

  it('does not mistake a path that merely starts with digits for a project', () => {
    expect(prependProjectSegment('/2fa/setup', 5)).toBe('/5/2fa/setup');
  });

  it('returns the href untouched without a project', () => {
    expect(prependProjectSegment('/a?x=1', undefined)).toBe('/a?x=1');
    expect(prependProjectSegment('/a?x=1', null)).toBe('/a?x=1');
    expect(prependProjectSegment('/a?x=1', '')).toBe('/a?x=1');
  });
});
