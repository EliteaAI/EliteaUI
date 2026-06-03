import * as yup from 'yup';

import { VALIDATION_LIMITS } from './constants';

/**
 * Yup validation schema for context strategy form
 */
export const contextStrategyValidationSchema = yup.object({
  max_context_tokens: yup
    .number()
    .typeError('Please enter a valid number')
    .integer('Must be a whole number')
    .required('This field is required')
    .min(
      VALIDATION_LIMITS.MAX_CONTEXT_TOKENS.MIN,
      `Max tokens must be at least ${VALIDATION_LIMITS.MAX_CONTEXT_TOKENS.MIN.toLocaleString()}`,
    )
    .max(
      VALIDATION_LIMITS.MAX_CONTEXT_TOKENS.MAX,
      `Max tokens cannot exceed ${VALIDATION_LIMITS.MAX_CONTEXT_TOKENS.MAX.toLocaleString()}`,
    ),
  preserve_recent_messages: yup
    .number()
    .typeError('Please enter a valid number')
    .integer('Must be a whole number')
    .required('This field is required')
    .min(
      VALIDATION_LIMITS.PRESERVE_RECENT_MESSAGES.MIN,
      `Preserve messages must be at least ${VALIDATION_LIMITS.PRESERVE_RECENT_MESSAGES.MIN}`,
    )
    .max(
      VALIDATION_LIMITS.PRESERVE_RECENT_MESSAGES.MAX,
      `Preserve messages cannot exceed ${VALIDATION_LIMITS.PRESERVE_RECENT_MESSAGES.MAX}`,
    ),
  summary_llm_settings: yup.object({
    max_tokens: yup
      .number()
      .typeError('Please enter a valid number')
      .integer('Must be a whole number')
      .required('This field is required')
      .min(
        VALIDATION_LIMITS.MAX_TOKENS.MIN,
        `Target tokens must be at least ${VALIDATION_LIMITS.MAX_TOKENS.MIN}`,
      )
      .max(
        VALIDATION_LIMITS.MAX_TOKENS.MAX,
        `Target tokens cannot exceed ${VALIDATION_LIMITS.MAX_TOKENS.MAX.toLocaleString()}`,
      )
      .test('less-than-max-context', function (value) {
        const maxContextTokens = this.from?.[1]?.value?.max_context_tokens;
        if (value === undefined || maxContextTokens === undefined) {
          return true;
        }
        if (value >= maxContextTokens) {
          return this.createError({
            message: `Must be less than Max Context Tokens (${maxContextTokens.toLocaleString()})`,
          });
        }
        return true;
      }),
  }),
});

/**
 * Validates a single field using Yup schema
 */
export const validateField = async (field, value) => {
  try {
    // Handle nested fields
    if (field === 'max_tokens') {
      await yup.reach(contextStrategyValidationSchema, 'summary_llm_settings.max_tokens').validate(value);
    } else {
      await yup.reach(contextStrategyValidationSchema, field).validate(value);
    }
    return null;
  } catch (error) {
    return error.message;
  }
};

/**
 * Validates the entire form data using Yup schema
 */
export const validateForm = async formData => {
  try {
    await contextStrategyValidationSchema.validate(formData, { abortEarly: false });
    return {};
  } catch (error) {
    const newErrors = {};

    if (error.inner) {
      error.inner.forEach(err => {
        const path = err.path;
        if (path.includes('summary_llm_settings')) {
          const field = path.split('.')[1];
          if (!newErrors.summary_llm_settings) {
            newErrors.summary_llm_settings = {};
          }
          newErrors.summary_llm_settings[field] = err.message;
        } else {
          newErrors[path] = err.message;
        }
      });
    }

    return newErrors;
  }
};

/**
 * Checks if the form has any validation errors
 */
export const isFormValid = errors => {
  return Object.keys(errors).length === 0;
};

/**
 * Clears a specific field error from the errors object
 */
export const clearFieldError = (errors, field, isNested = false) => {
  if (isNested) {
    // If there's no error to clear, still return the same object (no change needed)
    if (!errors.summary_llm_settings?.[field]) {
      return errors;
    }

    // Create a shallow copy of the nested object
    const newSummarySettings = { ...errors.summary_llm_settings };
    delete newSummarySettings[field];

    // Create new errors object
    const newErrors = { ...errors };
    if (Object.keys(newSummarySettings).length === 0) {
      delete newErrors.summary_llm_settings;
    } else {
      newErrors.summary_llm_settings = newSummarySettings;
    }
    return newErrors;
  } else {
    // Always return a new object to ensure state updates
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      return newErrors;
    }
  }
  return errors;
};

/**
 * Sets an error for a specific field
 */
export const setFieldError = (errors, field, errorMessage, isNested = false) => {
  if (isNested) {
    return {
      ...errors,
      summary_llm_settings: {
        ...(errors.summary_llm_settings || {}),
        [field]: errorMessage,
      },
    };
  }
  return {
    ...errors,
    [field]: errorMessage,
  };
};

export const handleConvertToNumberChange = (value, formikField, setFormikValue) => {
  const digitsOnly = value.replace(/[^0-9]/g, '');
  const finalValue = digitsOnly !== '' ? Number(digitsOnly) : '';
  setFormikValue(formikField, finalValue);
};
