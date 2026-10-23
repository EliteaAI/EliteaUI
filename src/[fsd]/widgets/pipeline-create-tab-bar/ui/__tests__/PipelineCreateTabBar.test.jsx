// @vitest-environment jsdom
import { Formik } from 'formik';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const create = vi.fn();
let pipelineState = { stateValidationErrors: {} };

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('react-redux', async importOriginal => ({
  ...(await importOriginal()),
  useSelector: selector =>
    selector({ pipeline: { byKey: { default: pipelineState }, activePipelineKey: 'default' } }),
}));
vi.mock('@/hooks/application/useCreateApplication', () => ({
  default: () => ({ isLoading: false, create, error: null, isError: false }),
}));
vi.mock('@/hooks/useNavBlocker', () => ({ default: () => ({}) }));
vi.mock('@/pages/Pipelines/useIsPipelineYamlCodeDirty', () => ({ default: () => false }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useToast: () => ({ toastError: vi.fn() }) }));
vi.mock('@/[fsd]/shared/ui', async () => {
  const { forwardRef } = await import('react');
  const BaseBtn = forwardRef((props, ref) => (
    <button
      ref={ref}
      type="button"
      data-testid={props['data-testid']}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  ));
  BaseBtn.displayName = 'BaseBtn';
  const DiscardButton = () => null;
  return { Button: { BaseBtn, DiscardButton } };
});
vi.mock('@/pages/Common/Components', () => ({ TabBarItems: ({ children }) => <div>{children}</div> }));

const { PipelineValidateSchema } = await import('@/[fsd]/features/pipelines/lib/validation');
const { default: PipelineCreateTabBar } = await import('../PipelineCreateTabBar');

const theme = createTheme({ palette: darkPalette });

const renderTabBar = values =>
  render(
    <ThemeProvider theme={theme}>
      <Formik
        initialValues={values}
        validationSchema={PipelineValidateSchema}
        validateOnMount
        onSubmit={() => {}}
      >
        <PipelineCreateTabBar />
      </Formik>
    </ThemeProvider>,
  );

describe('PipelineCreateTabBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pipelineState = { stateValidationErrors: {} };
  });
  afterEach(() => cleanup());

  it('allows saving the untouched draft without a description', async () => {
    renderTabBar({ name: 'Pipeline 1', description: '' });

    const save = screen.getByTestId('agent-save-button');
    await waitFor(() => expect(save).toBeEnabled());
    fireEvent.click(save);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('blocks saving when the name is empty', async () => {
    renderTabBar({ name: '  ', description: '' });

    await waitFor(() => expect(screen.getByTestId('agent-save-button')).toBeDisabled());
  });

  it('blocks saving when state variables have errors', async () => {
    pipelineState = { stateValidationErrors: { foo: 'Invalid' } };
    renderTabBar({ name: 'Pipeline 1', description: '' });

    await waitFor(() => expect(screen.getByTestId('agent-save-button')).toBeDisabled());
  });
});
