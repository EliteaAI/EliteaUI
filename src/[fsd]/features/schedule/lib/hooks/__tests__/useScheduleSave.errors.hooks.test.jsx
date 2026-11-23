// @vitest-environment jsdom
import { useState } from 'react';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useScheduleSave } from '../useScheduleSave.hooks';

const mocks = vi.hoisted(() => ({ toastError: vi.fn(), toastWarning: vi.fn() }));

vi.mock('@/[fsd]/shared/lib/hooks/useToast.hooks', () => ({
  useToast: () => ({ toastError: mocks.toastError, toastWarning: mocks.toastWarning }),
}));

const values = { name: 'Nightly', approval_rule: 'pause_and_ask' };
const NOT_FOUND_TEXT = 'The requested item could not be found';
const sensitive = { sensitive: [{ code: 'sensitive_action', toolkit: 'Outlook', tool: 'send_email' }] };

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

describe('useScheduleSave refused Run Now', () => {
  beforeEach(() => vi.clearAllMocks());

  const runNowRejectedWith = async error => {
    const { result } = renderHook(() =>
      useScheduleSave({
        formik: { setFieldValue: vi.fn(), values, dirty: false, submitForm: vi.fn() },
        riskCheck: { runCheck: vi.fn(), applyFindings: vi.fn() },
        schedule: { id: 1 },
        onSubmit: vi.fn(),
        onSaved: vi.fn(),
        onRunNow: vi.fn().mockRejectedValue(error),
      }),
    );
    await act(async () => {
      await result.current.handleRunNow();
    });
    return result.current;
  };

  it('shows the text of a 404 next to Run Now when the schedule is gone or hidden', async () => {
    const { runNowError } = await runNowRejectedWith({
      status: 404,
      data: { code: 'not_found', error: NOT_FOUND_TEXT },
    });
    expect(runNowError).toBe(NOT_FOUND_TEXT);
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it('keeps the toast for a 404 without text', async () => {
    const { runNowError } = await runNowRejectedWith({ status: 404, data: {} });
    expect(runNowError).toBe('');
    expect(mocks.toastError).toHaveBeenCalledWith('Failed to start the run');
  });
});

describe('useScheduleSave open review', () => {
  beforeEach(() => vi.clearAllMocks());

  it('closes the risk review when a re-check is refused because the target is gone', async () => {
    const { result, rerender } = renderHook(
      ({ refused }) =>
        useScheduleSave({
          formik: { setFieldValue: vi.fn(), values, dirty: false, submitForm: vi.fn() },
          riskCheck: { runCheck: vi.fn().mockResolvedValue(sensitive), applyFindings: vi.fn(), refused },
          schedule: null,
          onSubmit: vi.fn(),
          onSaved: vi.fn(),
          onRunNow: vi.fn(),
        }),
      { initialProps: { refused: null } },
    );
    await act(async () => {
      await result.current.submit(values, { setErrors: vi.fn(), resetForm: vi.fn() });
    });
    expect(result.current.review).not.toBeNull();

    rerender({ refused: NOT_FOUND_TEXT });

    expect(result.current.review).toBeNull();
  });
});

const confirmWhileRefusedMidSave = async () => {
  let failSave;
  const onSubmit = vi.fn(() => new Promise((_, reject) => (failSave = reject)));
  const { result } = renderHook(() => {
    const [refused, setRefused] = useState(null);
    const save = useScheduleSave({
      formik: { setFieldValue: vi.fn(), values, dirty: false, submitForm: vi.fn(), setErrors: vi.fn() },
      riskCheck: {
        runCheck: vi.fn().mockResolvedValue(sensitive),
        applyFindings: vi.fn(() => setRefused(null)),
        result: { fingerprint: 'fp-1' },
        refused,
      },
      schedule: null,
      onSubmit,
      onSaved: vi.fn(),
      onRunNow: vi.fn(),
    });
    return { save, setRefused };
  });
  await act(async () => {
    await result.current.save.submit(values, { setErrors: vi.fn(), resetForm: vi.fn() });
  });
  let confirming;
  act(() => {
    confirming = result.current.save.handleReviewConfirm({ rule: values.approval_rule });
  });
  act(() => result.current.setRefused(NOT_FOUND_TEXT));
  expect(result.current.save.review).not.toBeNull();
  const settle = async error => {
    await act(async () => {
      failSave(error);
      await confirming;
    });
    return result.current.save;
  };
  return { settle };
};

describe('useScheduleSave in-flight confirm save', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reopens the review as changed when the save answers risk_changed after a mid-save refusal', async () => {
    const { settle } = await confirmWhileRefusedMidSave();
    const save = await settle({ status: 409, data: { code: 'risk_changed', error: 'changed' } });
    expect(save.reviewSaving).toBe(false);
    expect(save.review).toMatchObject({ changed: true });
  });

  it('closes the review when the save fails otherwise after a mid-save refusal', async () => {
    const { settle } = await confirmWhileRefusedMidSave();
    const save = await settle({ status: 500, data: { error: 'boom' } });
    expect(save.reviewSaving).toBe(false);
    expect(save.review).toBeNull();
  });
});
