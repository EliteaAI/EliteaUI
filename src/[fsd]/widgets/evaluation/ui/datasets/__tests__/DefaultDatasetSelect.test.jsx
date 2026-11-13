// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DefaultDatasetSelect from '../DefaultDatasetSelect';

const toast = vi.hoisted(() => ({ toastError: vi.fn(), toastSuccess: vi.fn() }));
vi.mock('@/[fsd]/shared/lib/hooks/useToast.hooks', () => ({ useToast: () => toast }));
vi.hoisted(() => vi.stubEnv('VITE_SERVER_URL', 'http://localhost/api/v2/'));

const theme = createTheme({ palette: lightPalette });
const renderSelect = props => {
  const onSave = props?.onSave ?? vi.fn().mockResolvedValue();
  render(
    <ThemeProvider theme={theme}>
      <DefaultDatasetSelect
        testId="default-dataset"
        datasets={[{ id: 3, name: 'Own set' }]}
        datasetId={null}
        {...props}
        onSave={onSave}
      />
    </ThemeProvider>,
  );
  return onSave;
};
const combobox = () => within(screen.getByTestId('default-dataset')).getByRole('combobox');

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe('DefaultDatasetSelect', () => {
  it('offers the datasets after the none entry and saves the pick', async () => {
    const onSave = renderSelect({ noneLabel: 'None (platform health check)' });
    await userEvent.click(combobox());
    const listbox = await screen.findByRole('listbox');
    expect(within(listbox).getByText('None (platform health check)')).toBeInTheDocument();
    await userEvent.click(within(listbox).getByText('Own set'));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(3));
    expect(toast.toastSuccess).toHaveBeenCalledWith('Saved');
  });

  it('saves null for the none entry', async () => {
    const onSave = renderSelect({ datasetId: 3 });
    await userEvent.click(combobox());
    await userEvent.click(await screen.findByText('None'));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(null));
  });

  it('labels an unlisted default by its name, else by its id', () => {
    renderSelect({ datasetId: 9, currentName: 'Gone set' });
    expect(screen.getByTestId('default-dataset')).toHaveTextContent('Gone set');
    cleanup();
    renderSelect({ datasetId: 11 });
    expect(screen.getByTestId('default-dataset')).toHaveTextContent('Dataset 11');
  });

  it('locks with an error line when the stored default cannot be read', () => {
    renderSelect({ isError: true });
    expect(combobox()).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByTestId('default-dataset-error')).toHaveTextContent(
      'Unable to load the default dataset.',
    );
  });

  it('reports a refused save', async () => {
    renderSelect({ onSave: vi.fn().mockRejectedValue({ data: { error: 'Dataset 3 must be shared' } }) });
    await userEvent.click(combobox());
    await userEvent.click(await screen.findByText('Own set'));
    await waitFor(() => expect(toast.toastError).toHaveBeenCalledWith('Dataset 3 must be shared'));
  });
});
