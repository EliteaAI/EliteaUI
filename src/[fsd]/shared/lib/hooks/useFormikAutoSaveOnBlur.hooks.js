import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useFormikContext } from 'formik';

const DEFAULT_DEBOUNCE_MS = 200;

const isProbablyTextInputTarget = target => {
  const tagName = target?.tagName?.toLowerCase?.();
  if (!tagName) return false;

  return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
};

/**
 * Formik autosave helper: triggers `submitForm()` when an input loses focus.
 * - Debounced to avoid multiple rapid submits when tabbing.
 * - Validates before submitting.
 * - Skips submits when form isn't dirty or is already submitting.
 */
export const useFormikAutoSaveOnBlur = options => {
  const { isEnabled = true, debounceMs = DEFAULT_DEBOUNCE_MS } = options || {};

  const { dirty, isValidating, isSubmitting, submitForm, validateForm } = useFormikContext();

  const debounceTimerRef = useRef(null);
  const pendingSubmitRef = useRef(false);

  const canAttemptSubmit = useMemo(() => {
    if (!isEnabled) return false;
    if (!dirty) return false;
    if (isSubmitting) return false;
    if (isValidating) return false;
    return true;
  }, [dirty, isEnabled, isSubmitting, isValidating]);

  const attemptSubmit = useCallback(async () => {
    if (!canAttemptSubmit) return;

    const errors = await validateForm();

    pendingSubmitRef.current = false;

    if (errors && Object.keys(errors).length > 0) return;

    await submitForm();
  }, [canAttemptSubmit, submitForm, validateForm]);

  const requestSubmit = useCallback(() => {
    if (!isEnabled) return;

    pendingSubmitRef.current = true;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      attemptSubmit();
    }, debounceMs);
  }, [attemptSubmit, debounceMs, isEnabled]);

  const onBlur = useCallback(
    event => {
      if (!isEnabled) return;

      const target = event?.target;
      if (!isProbablyTextInputTarget(target)) return;

      requestSubmit();
    },
    [isEnabled, requestSubmit],
  );

  // If a blur-triggered save was queued but Formik was busy, retry once it becomes idle.
  useEffect(() => {
    if (!pendingSubmitRef.current) return;
    if (!canAttemptSubmit) return;

    attemptSubmit();
  }, [attemptSubmit, canAttemptSubmit]);

  useEffect(
    () => () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    },
    [],
  );

  return { onBlur, requestSubmit };
};
