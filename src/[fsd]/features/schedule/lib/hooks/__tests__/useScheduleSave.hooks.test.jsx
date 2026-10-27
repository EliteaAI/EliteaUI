// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useScheduleSave } from '../useScheduleSave.hooks';

const mocks = vi.hoisted(() => ({ toastError: vi.fn(), toastWarning: vi.fn() }));

vi.mock('@/[fsd]/shared/lib/hooks/useToast.hooks', () => ({
  useToast: () => ({ toastError: mocks.toastError, toastWarning: mocks.toastWarning }),
}));

const values = { name: 'Nightly', approval_rule: 'ask' };

const saveWith = async answer => {
  const onSubmit = vi.fn().mockResolvedValue(answer);
  const onSaved = vi.fn();
  const { result } = renderHook(() =>
    useScheduleSave({
      formik: { setFieldValue: vi.fn(), values, dirty: false, submitForm: vi.fn() },
      riskCheck: { runCheck: vi.fn().mockResolvedValue({}), applyFindings: vi.fn() },
      schedule: null,
      onSubmit,
      onSaved,
      onTestRun: vi.fn(),
    }),
  );
  await act(async () => {
    await result.current.submit(values, { setErrors: vi.fn(), resetForm: vi.fn() });
  });
  return { onSaved };
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
