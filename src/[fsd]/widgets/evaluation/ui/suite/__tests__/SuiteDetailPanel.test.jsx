// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import RouteDefinitions from '@/routes';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import SuiteDetailPanel from '../SuiteDetailPanel';

const routeState = vi.hoisted(() => ({ evaluate: '/agents/evaluate' }));

vi.mock('@/[fsd]/shared/lib/hooks/useToast.hooks', () => ({
  useToast: () => ({ toastInfo: vi.fn(), toastError: vi.fn() }),
}));
vi.mock('@/hooks/useCheckPermission', () => ({ default: () => ({ checkPermission: () => true }) }));
vi.mock('../../../lib/hooks', () => ({ useEvalRoutes: () => ({ evaluate: routeState.evaluate }) }));
// Every section is rendered open, so the run-limits checkbox is reachable.
vi.mock('@/[fsd]/shared/ui/accordion', () => ({
  BasicAccordion: ({ items }) => items.map(item => <div key={item.title}>{item.content}</div>),
}));
vi.mock('@/[fsd]/widgets/llm-model-selector', () => ({ LLMModelSelector: () => null }));
vi.mock('../SuiteRunEstimate', () => ({ default: () => null }));
vi.mock('../dataset/DatasetSection', () => ({ default: () => null }));
vi.mock('../dataset/DatasetSectionHeader', () => ({ default: () => null }));
vi.mock('../dimension/DimensionSection', () => ({ default: () => null }));
vi.mock('../dimension/DimensionSectionHeader', () => ({ default: () => null }));

const theme = createTheme({ palette: lightPalette });

const baseSuite = { id: 7, name: 'Refunds', description: '', judge_model: null, meta: {}, dataset_id: 3 };

const renderPanel = (suite, onSave = vi.fn()) => {
  render(
    <ThemeProvider theme={theme}>
      <SuiteDetailPanel
        suite={suite}
        suiteActions={{ handleSave: onSave }}
      />
    </ThemeProvider>,
  );
  return onSave;
};

// hidden: the discard modal keeps aria-hidden on the panel while it closes.
const autoEvaluationCheckbox = () =>
  within(screen.getByTestId('suite-auto-evaluation-checkbox')).getByRole('checkbox', { hidden: true });

describe('SuiteDetailPanel auto-evaluation flag', () => {
  afterEach(() => {
    cleanup();
    routeState.evaluate = '/agents/evaluate';
  });

  it('saves the flag into trigger_config and keeps its other keys', () => {
    const onSave = renderPanel({ ...baseSuite, trigger_config: { cron: '0 1 * * *' } });

    fireEvent.click(autoEvaluationCheckbox());
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ trigger_config: { cron: '0 1 * * *', auto_evaluation: true } }),
    );
  });

  it('leaves trigger_config out of the save when the flag did not change', () => {
    const onSave = renderPanel({ ...baseSuite, trigger_config: { auto_evaluation: true } });

    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'Refunds v2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave.mock.calls[0][0]).not.toHaveProperty('trigger_config');
  });

  it('discards an unsaved flag change', () => {
    renderPanel({ ...baseSuite, trigger_config: null });

    fireEvent.click(autoEvaluationCheckbox());
    expect(autoEvaluationCheckbox()).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    // The confirm modal adds its own "Discard" button after the panel's.
    fireEvent.click(screen.getAllByRole('button', { name: 'Discard' }).at(-1));

    expect(autoEvaluationCheckbox()).not.toBeChecked();
  });

  it('cannot be turned on for a suite without a dataset', () => {
    renderPanel({ ...baseSuite, dataset_id: null, trigger_config: null });

    expect(autoEvaluationCheckbox()).toBeDisabled();
  });

  it('is not offered on pipeline suites or generated suites', () => {
    routeState.evaluate = RouteDefinitions.PipelineEvaluate;
    renderPanel({ ...baseSuite, trigger_config: null });
    expect(screen.queryByTestId('suite-auto-evaluation')).not.toBeInTheDocument();
    cleanup();

    routeState.evaluate = '/agents/evaluate';
    renderPanel({ ...baseSuite, trigger_config: { generated: true, auto_evaluation: true } });
    expect(screen.queryByTestId('suite-auto-evaluation')).not.toBeInTheDocument();
  });
});
