// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { autoModel } from '@/[fsd]/shared/lib/utils';
import { cleanup, render } from '@testing-library/react';

import LLMModelSelectorWrapper from '../LLMModelSelectorWrapper';

const fixture = vi.hoisted(() => ({
  version_details: {},
  setFieldValue: vi.fn(),
  selector: vi.fn(() => null),
}));
vi.mock('formik', () => ({
  useFormikContext: () => ({
    values: { version_details: fixture.version_details },
    setFieldValue: fixture.setFieldValue,
  }),
}));
vi.mock('@/[fsd]/widgets/llm-model-selector', () => ({ LLMModelSelector: props => fixture.selector(props) }));
vi.mock('@/api/configurations', () => ({
  useListModelsQuery: () => ({
    data: {
      items: [{ name: 'concrete', project_id: 1, default: true }],
      auto_routing: { enabled: true },
      default_selection: { mode: 'auto' },
    },
  }),
}));
const theme = createTheme();
const renderEditor = () =>
  render(
    <ThemeProvider theme={theme}>
      <LLMModelSelectorWrapper projectId={1} />
    </ThemeProvider>,
  );

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe('saved agent selection ownership', () => {
  it.each([{ model_name: 'concrete', model_project_id: 1 }, { selection: autoModel().selection }])(
    'never overwrites an existing selection with a new project default',
    llm_settings => {
      fixture.version_details = { agent_type: 'agent', llm_settings };
      renderEditor();
      expect(fixture.setFieldValue).not.toHaveBeenCalled();
    },
  );
  it('repairs missing legacy settings with a concrete model, not a new Auto opt-in', () => {
    fixture.version_details = { agent_type: 'agent', llm_settings: {} };
    renderEditor();
    expect(fixture.setFieldValue).toHaveBeenCalledWith('version_details.llm_settings', {
      model_name: 'concrete',
      model_project_id: 1,
    });
  });
  it('keeps pipeline model options concrete even when project default is Auto', () => {
    fixture.version_details = { agent_type: 'pipeline', llm_settings: { model_name: 'concrete' } };
    renderEditor();
    expect(fixture.selector.mock.lastCall[0].models.map(model => model.name)).toEqual(['concrete']);
    expect(fixture.setFieldValue).not.toHaveBeenCalled();
  });
});
