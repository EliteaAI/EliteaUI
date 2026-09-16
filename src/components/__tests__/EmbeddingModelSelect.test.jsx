// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

import EmbeddingModelSelect from '../EmbeddingModelSelect';

// EL-6634: a toolkit created through the API without an embedding_model used to render the PROJECT
// default in this field while nothing was saved, so the Indexes panel said indexing was unavailable
// and Save stayed disabled. The field must show only what the toolkit actually has.

const PROJECT_DEFAULT_MODEL = 'text-embedding-3-small';
const PROJECT_DEFAULT_LABEL = 'Text Embedding 3 Small';
const OTHER_MODEL = 'text-embedding-3-large';
const OTHER_LABEL = 'Text Embedding 3 Large';
const DELETED_MODEL = 'text-embedding-ada-002';

const MODELS = [
  { name: PROJECT_DEFAULT_MODEL, display_name: PROJECT_DEFAULT_LABEL, project_id: 'project-1' },
  { name: OTHER_MODEL, display_name: OTHER_LABEL, project_id: 'project-1' },
];

let singleSelectProps;
const getModels = vi.fn();
const onSelectModel = vi.fn();

// Stands in for Select.SingleSelect, replaying SingleSelect.jsx:259-262: look the value up in the
// flattened option groups, then hand the match (or undefined) to customRenderValue.
vi.mock('@/[fsd]/shared/ui', () => ({
  Select: {
    SingleSelect: props => {
      singleSelectProps = props;
      const flatOptions = (props.optionGroups || []).flatMap(group => group.options || []);
      const foundOption = flatOptions.find(option => option.value === props.value);

      return (
        <div data-testid="single-select">
          <span data-testid="single-select-value">
            {props.customRenderValue ? props.customRenderValue(foundOption) : null}
          </span>
        </div>
      );
    },
  },
}));

vi.mock('react-redux', () => ({
  useSelector: selector => selector({ user: { personal_project_id: 'personal-project' } }),
}));

vi.mock('@/hooks/useSelectedProject', () => ({ useSelectedProjectId: () => 'project-1' }));

// The project default arrives on the standing query; the option list arrives on the lazy one.
vi.mock('@/api/configurations', () => ({
  useListModelsQuery: () => ({
    data: {
      items: MODELS,
      total: MODELS.length,
      default_model_name: PROJECT_DEFAULT_MODEL,
      default_model_project_id: 'project-1',
    },
  }),
  useLazyListModelsQuery: () => [getModels, { isFetching: false }],
}));

// forwardRef so the MUI Tooltip wrapping the refresh button can hold a ref.
vi.mock('@/[fsd]/shared/ui/button', async () => {
  const { forwardRef } = await import('react');

  const BaseBtn = forwardRef((props, ref) => (
    <button
      ref={ref}
      type="button"
      onClick={props.onClick}
    >
      {props.children}
    </button>
  ));
  BaseBtn.displayName = 'BaseBtn';

  return { BaseBtn };
});
vi.mock('@/[fsd]/shared/ui/button/BaseBtn', () => ({ BUTTON_VARIANTS: { tertiary: 'tertiary' } }));
vi.mock('@/assets/refresh-icon.svg?react', () => ({ default: () => null }));
vi.mock('@/components/Icons/BriefcaseIcon.jsx', () => ({ default: () => null }));
vi.mock('../Icons/Person', () => ({ default: () => null }));

beforeEach(() => {
  singleSelectProps = undefined;
  onSelectModel.mockClear();
  getModels.mockReset();
  getModels.mockResolvedValue({ data: { items: MODELS } });
});

afterEach(() => cleanup());

const renderSelect = props =>
  render(
    <EmbeddingModelSelect
      label="Embedding Model"
      onSelectModel={onSelectModel}
      {...props}
    />,
  );

// The component loads its option list in an effect, so the assertions describe a fully loaded
// selector rather than its first paint.
const whenOptionsLoaded = () =>
  waitFor(() => expect(singleSelectProps?.optionGroups?.[0]?.options).toHaveLength(MODELS.length));

describe('EmbeddingModelSelect', () => {
  it('shows nothing when the toolkit has no embedding model saved, even though the project has a default', async () => {
    renderSelect({ value: '' });
    await whenOptionsLoaded();

    expect(singleSelectProps.value).toBe('');
    expect(screen.getByTestId('single-select-value')).toBeEmptyDOMElement();
    expect(screen.queryByText(PROJECT_DEFAULT_LABEL)).not.toBeInTheDocument();
  });

  it('does not pick a model on the toolkit behalf when nothing is saved', async () => {
    renderSelect({ value: '' });
    await whenOptionsLoaded();

    expect(onSelectModel).not.toHaveBeenCalled();
  });

  it('shows the embedding model that is actually saved', async () => {
    renderSelect({ value: OTHER_MODEL });
    await whenOptionsLoaded();

    expect(singleSelectProps.value).toBe(OTHER_MODEL);
    expect(screen.getByTestId('single-select-value')).toHaveTextContent(OTHER_LABEL);
  });

  it('still auto-repairs a saved model that no longer exists', async () => {
    renderSelect({ value: DELETED_MODEL });

    await waitFor(() =>
      expect(onSelectModel).toHaveBeenCalledWith(PROJECT_DEFAULT_MODEL, { isAutoSelect: true }),
    );
  });
});
