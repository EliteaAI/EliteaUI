// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useScheduleSave } from '../useScheduleSave.hooks';

const mocks = vi.hoisted(() => ({ toastError: vi.fn(), toastWarning: vi.fn() }));

vi.mock('@/[fsd]/shared/lib/hooks/useToast.hooks', () => ({
  useToast: () => ({ toastError: mocks.toastError, toastWarning: mocks.toastWarning }),
}));

const values = { name: 'Nightly', approval_rule: 'ask' };

const saveWith = async (answer, { risk = {}, formValues = values } = {}) => {
  const onSubmit = vi.fn().mockResolvedValue(answer);
  const onSaved = vi.fn();
  const { result } = renderHook(() =>
    useScheduleSave({
      formik: { setFieldValue: vi.fn(), values: formValues, dirty: false, submitForm: vi.fn() },
      riskCheck: { runCheck: vi.fn().mockResolvedValue(risk), applyFindings: vi.fn() },
      schedule: null,
      onSubmit,
      onSaved,
      onTestRun: vi.fn(),
    }),
  );
  await act(async () => {
    await result.current.submit(formValues, { setErrors: vi.fn(), resetForm: vi.fn() });
  });
  return { onSaved, onSubmit };
};

describe('useScheduleSave governance notice', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the governance notice of the save answer as a warning toast', async () => {
    const { onSaved } = await saveWith({
      approval_rule: 'ask',
      governance_notice: 'Credential governance applies',
    });
    expect(mocks.toastWarning).toHaveBeenCalledWith('Credential governance applies');
    expect(onSaved).toHaveBeenCalled();
  });

  it('shows no toast when the governance notice is null', async () => {
    await saveWith({ approval_rule: 'ask', governance_notice: null });
    expect(mocks.toastWarning).not.toHaveBeenCalled();
  });
});

describe('useScheduleSave sign-in findings', () => {
  beforeEach(() => vi.clearAllMocks());

  const signin = { code: 'personal_signin_required', toolkit: 'GitHub' };
  const credential = { code: 'missing_credential', toolkit: 'Jira' };
  const step = { code: 'human_input_step', step: 'review' };
  const pause = { name: 'Nightly', approval_rule: 'pause_and_ask' };
  const noAsk = { name: 'Nightly', approval_rule: 'run_without_asking' };

  it('saves under "Pause and ask me" although a sign-in or a credential is missing', async () => {
    const { onSubmit } = await saveWith(
      { approval_rule: 'pause_and_ask' },
      { risk: { blocking: [signin, credential] }, formValues: pause },
    );
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('does not save under "Run without asking" while a sign-in is missing', async () => {
    const { onSubmit } = await saveWith(
      { approval_rule: 'run_without_asking' },
      { risk: { blocking: [signin] }, formValues: noAsk },
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not save under "Pause and ask me" while a human-input step blocks', async () => {
    const { onSubmit } = await saveWith(
      { approval_rule: 'pause_and_ask' },
      { risk: { blocking: [signin, step] }, formValues: pause },
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
