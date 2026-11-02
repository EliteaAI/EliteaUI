// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useScheduleSave } from '../useScheduleSave.hooks';

// the Test Run of the unsaved form: validation first, then one branch per answer of the server

const mocks = vi.hoisted(() => ({ toastError: vi.fn(), toastWarning: vi.fn() }));

vi.mock('@/[fsd]/shared/lib/hooks/useToast.hooks', () => ({
  useToast: () => ({ toastError: mocks.toastError, toastWarning: mocks.toastWarning }),
}));

const values = { name: 'Nightly', approval_rule: 'pause_and_ask', cron: '0 9 * * *' };

const setup = ({ onDraftTestRun, formErrors = {} } = {}) => {
  const formik = {
    values,
    setFieldValue: vi.fn(),
    setErrors: vi.fn(),
    validateForm: vi.fn().mockResolvedValue(formErrors),
    submitForm: vi.fn(),
    dirty: false,
  };
  const { result } = renderHook(() =>
    useScheduleSave({
      formik,
      riskCheck: { runCheck: vi.fn(), applyFindings: vi.fn() },
      schedule: null,
      onSubmit: vi.fn(),
      onSaved: vi.fn(),
      onRunNow: vi.fn(),
      onDraftTestRun,
    }),
  );
  return { formik, result };
};
const runTest = result => act(async () => result.current.handleDraftTestRun());

describe('useScheduleSave draft Test Run', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends the form values as a create body and shows no error', async () => {
    const onDraftTestRun = vi.fn().mockResolvedValue({ run_id: 1 });
    const { result } = setup({ onDraftTestRun });

    await runTest(result);

    expect(onDraftTestRun).toHaveBeenCalledWith(expect.objectContaining({ name: 'Nightly' }));
    expect(result.current.draftTestError).toBe('');
    expect(result.current.draftTestPending).toBe(false);
  });

  it('shows the field errors and sends nothing when the form is invalid', async () => {
    const onDraftTestRun = vi.fn();
    const { formik, result } = setup({ onDraftTestRun, formErrors: { name: 'Required' } });

    await runTest(result);

    expect(formik.submitForm).toHaveBeenCalledTimes(1);
    expect(onDraftTestRun).not.toHaveBeenCalled();
  });

  it('puts approval_rule_not_allowed under the approval rule field', async () => {
    const onDraftTestRun = vi.fn().mockRejectedValue({
      status: 400,
      data: { code: 'approval_rule_not_allowed', error: 'Not allowed here', field: 'approval_rule' },
    });
    const { formik, result } = setup({ onDraftTestRun });

    await runTest(result);

    expect(formik.setErrors).toHaveBeenCalledWith({ approval_rule: 'Not allowed here' });
    expect(result.current.draftTestError).toBe('');
  });

  it('puts invalid_input under the field it names', async () => {
    const onDraftTestRun = vi.fn().mockRejectedValue({
      status: 400,
      data: { code: 'invalid_input', error: 'Bad cron', field: 'cron' },
    });
    const { formik, result } = setup({ onDraftTestRun });

    await runTest(result);

    expect(formik.setErrors).toHaveBeenCalledWith({ cron: 'Bad cron' });
  });

  it.each([
    [400, 'invalid_input', 'Unknown field'],
    [404, 'not_found', 'The agent is gone'],
    [409, 'run_active', 'A run is active'],
    [500, 'run_start_failed', 'The run did not start'],
  ])('shows the text of a %i %s answer in the banner', async (status, code, text) => {
    const onDraftTestRun = vi.fn().mockRejectedValue({ status, data: { code, error: text } });
    const { formik, result } = setup({ onDraftTestRun });

    await runTest(result);

    expect(result.current.draftTestError).toBe(text);
    expect(formik.setErrors).not.toHaveBeenCalled();
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it('shows a toast for a 403 or a network error', async () => {
    const onDraftTestRun = vi.fn().mockRejectedValue({ status: 403, data: { error: 'Forbidden' } });
    const { result } = setup({ onDraftTestRun });

    await runTest(result);

    expect(mocks.toastError).toHaveBeenCalledWith('Failed to start the test run');
    expect(result.current.draftTestPending).toBe(false);
  });

  it('clears an earlier banner text when the next attempt starts', async () => {
    const onDraftTestRun = vi
      .fn()
      .mockRejectedValueOnce({ status: 409, data: { code: 'run_active', error: 'A run is active' } })
      .mockResolvedValueOnce({ run_id: 2 });
    const { result } = setup({ onDraftTestRun });

    await runTest(result);
    expect(result.current.draftTestError).toBe('A run is active');
    await runTest(result);

    expect(result.current.draftTestError).toBe('');
  });
});
