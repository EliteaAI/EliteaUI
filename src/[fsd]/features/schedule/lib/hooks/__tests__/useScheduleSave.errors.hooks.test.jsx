// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useScheduleSave } from '../useScheduleSave.hooks';

const mocks = vi.hoisted(() => ({ toastError: vi.fn(), toastWarning: vi.fn() }));

vi.mock('@/[fsd]/shared/lib/hooks/useToast.hooks', () => ({
  useToast: () => ({ toastError: mocks.toastError, toastWarning: mocks.toastWarning }),
}));

const values = { name: 'Nightly', approval_rule: 'pause_and_ask' };
const NOT_FOUND_TEXT = 'The requested item could not be found';

const saveWith = async ({ error, risk = {} }) => {
  const onSubmit = vi.fn().mockRejectedValue(error);
  const { result } = renderHook(() =>
    useScheduleSave({
      formik: { setFieldValue: vi.fn(), values, dirty: false, submitForm: vi.fn() },
      riskCheck: { runCheck: vi.fn().mockResolvedValue(risk), applyFindings: vi.fn() },
      schedule: null,
      onSubmit,
      onSaved: vi.fn(),
      onRunNow: vi.fn(),
    }),
  );
  await act(async () => {
    await result.current.submit(values, { setErrors: vi.fn(), resetForm: vi.fn() });
  });
  return { ...result.current, onSubmit };
};

describe('useScheduleSave refused save', () => {
  beforeEach(() => vi.clearAllMocks());

  it('toasts the refusal of the risk check, keeps the banner for the form notice and sends no save', async () => {
    const { banner, onSubmit } = await saveWith({ risk: { refused: NOT_FOUND_TEXT } });
    expect(mocks.toastError).toHaveBeenCalledWith(NOT_FOUND_TEXT);
    expect(banner).toBe('');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps the toast when the risk check did not run', async () => {
    const { onSubmit } = await saveWith({ risk: null });
    expect(mocks.toastError).toHaveBeenCalledWith('The risk check did not run. Try again.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows the text of a 404 in the banner when the agent, pipeline or toolkit is gone', async () => {
    const { banner } = await saveWith({
      error: { status: 404, data: { code: 'not_found', error: NOT_FOUND_TEXT } },
    });
    expect(banner).toBe(NOT_FOUND_TEXT);
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it('falls back to the toast for a 404 without text', async () => {
    const { banner } = await saveWith({ error: { status: 404, data: {} } });
    expect(banner).toBe('');
    expect(mocks.toastError).toHaveBeenCalledWith('Failed to save the schedule');
  });

  it('keeps the toast for a server error', async () => {
    await saveWith({ error: { status: 500, data: { error: 'boom' } } });
    expect(mocks.toastError).toHaveBeenCalledWith('Failed to save the schedule');
  });
});
