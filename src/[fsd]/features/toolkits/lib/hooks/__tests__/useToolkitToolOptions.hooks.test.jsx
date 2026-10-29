// @vitest-environment jsdom
import { Formik } from 'formik';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { cleanup, renderHook } from '@testing-library/react';

import { useToolkitToolOptions } from '../useToolkitToolOptions.hooks';

vi.mock('@/[fsd]/features/toolkits/lib/hooks/useGetCurrentToolkitSchemas.hooks', () => ({
  useGetCurrentToolkitSchemas: () => ({
    toolkitSchemas: { jira: { properties: { selected_tools: { items: { enum: ['search_using_jql'] } } } } },
  }),
}));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => 1,
}));

vi.mock('@/api/toolkits.js', () => ({
  useToolkitAvailableToolsQuery: () => ({ data: undefined }),
}));

afterEach(() => cleanup());

const INDEX_TOOLS = [
  'index_data',
  'search_index',
  'stepback_search_index',
  'stepback_summary_index',
  'remove_index',
];

const renderToolOptions = selectedTools =>
  renderHook(() => useToolkitToolOptions({ toolkitId: 1 }), {
    wrapper: ({ children }) => (
      <Formik
        initialValues={{ type: 'jira', settings: { selected_tools: selectedTools } }}
        onSubmit={() => {}}
      >
        {children}
      </Formik>
    ),
  }).result.current.allToolsOptions;

describe('useToolkitToolOptions', () => {
  it('offers every selected tool, index tools included', () => {
    const selectedTools = ['search_using_jql', 'create_issue', ...INDEX_TOOLS];

    const options = renderToolOptions(selectedTools);

    expect(options.map(option => option.value).sort()).toEqual([...selectedTools].sort());
  });

  it('labels index tools like every other tool', () => {
    const options = renderToolOptions(INDEX_TOOLS);

    expect(options.map(option => option.label)).toEqual([
      'Index data',
      'Remove index',
      'Search index',
      'Stepback search index',
      'Stepback summary index',
    ]);
  });
});
