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

const saveRejectedWith = async error => {
  const { result } = renderHook(() =>
    useScheduleSave({
      formik: { setFieldValue: vi.fn(), values, dirty: false, submitForm: vi.fn() },
      riskCheck: { runCheck: vi.fn().mockResolvedValue({}), applyFindings: vi.fn() },
      schedule: null,
      onSubmit: vi.fn().mockRejectedValue(error),
      onSaved: vi.fn(),
      onRunNow: vi.fn(),
    }),
  );
  await act(async () => {
    await result.current.submit(values, { setErrors: vi.fn(), resetForm: vi.fn() });
  });
  return result.current;
};

describe('useScheduleSave refused save', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the text of a 404 in the banner when the agent, pipeline or toolkit is gone', async () => {
    const { banner } = await saveRejectedWith({
      status: 404,
      data: { code: 'not_found', error: NOT_FOUND_TEXT },
    });
    expect(banner).toBe(NOT_FOUND_TEXT);
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it('falls back to the toast for a 404 without text', async () => {
    const { banner } = await saveRejectedWith({ status: 404, data: {} });
    expect(banner).toBe('');
    expect(mocks.toastError).toHaveBeenCalledWith('Failed to save the schedule');
  });

  it('keeps the toast for a server error', async () => {
    await saveRejectedWith({ status: 500, data: { error: 'boom' } });
    expect(mocks.toastError).toHaveBeenCalledWith('Failed to save the schedule');
  });
});
