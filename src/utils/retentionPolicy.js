/**
 * Utility functions for retention policy formatting and conversion
 */

/**
 * Convert retention policy values to days for comparison
 * @param {number} value - The retention value
 * @param {string} measure - The retention measure (days, weeks, months, years)
 * @returns {number} - Number of days
 */
export const convertToDays = (value, measure) => {
  const conversions = {
    days: 1,
    weeks: 7,
    months: 30, // Approximate
    years: 365,
  };

  return value * (conversions[measure] || 1);
};

/**
 * Convert backend-normalized values back to user-friendly units
 * This handles cases where backend stores "313 weeks" but user intended "6 years"
 * @param {object} retentionPolicy - Object with expiration_value and expiration_measure
 * @returns {object} - {expiration_value, expiration_measure} with converted values
 */
const convertToUserFriendlyUnits = retentionPolicy => {
  if (!retentionPolicy || !retentionPolicy.expiration_value || !retentionPolicy.expiration_measure) {
    return retentionPolicy;
  }

  const { expiration_value, expiration_measure } = retentionPolicy;

  // Handle backend normalization patterns intelligently
  let convertedValue = expiration_value;
  let convertedMeasure = expiration_measure;

  // Convert large/awkward values back to more readable units
  if (expiration_measure === 'days') {
    // Convert days to years if it's a clean year conversion (365, 730, 1095, etc.)
    if (expiration_value >= 365 && expiration_value % 365 === 0) {
      convertedValue = expiration_value / 365;
      convertedMeasure = 'years';
    }
    // Convert days to months if it's close to month multiples
    else if (expiration_value >= 28) {
      const monthsExact = expiration_value / 30;
      const monthsRounded = Math.round(monthsExact);
      // Allow for slight variations in month calculations (28-31 days per month)
      // For larger month values, allow more tolerance due to month length variations
      const allowedDifference = monthsRounded > 12 ? 15 : 5; // More tolerance for large values
      const daysDifference = Math.abs(expiration_value - monthsRounded * 30);
      if (daysDifference <= allowedDifference && monthsRounded >= 1) {
        convertedValue = monthsRounded;
        convertedMeasure = 'months';
      }
    }
  } else if (expiration_measure === 'weeks') {
    // Convert large week values back to years if it makes sense
    // Allow for slight variations (52-53 weeks per year)
    if (expiration_value >= 52) {
      const yearsExact = expiration_value / 52;
      const yearsRounded = Math.round(yearsExact);
      // If it's within 1 week of a year multiple, consider it years
      const weeksDifference = Math.abs(expiration_value - yearsRounded * 52);
      if (weeksDifference <= 1 && yearsRounded >= 1) {
        convertedValue = yearsRounded;
        convertedMeasure = 'years';
      }
    }
    // Convert weeks to months if it's approximately right (4-5 weeks per month)
    else if (expiration_value >= 4 && expiration_value < 52) {
      const monthsApprox = expiration_value / 4.33; // Average weeks per month
      const monthsRounded = Math.round(monthsApprox);
      // If it's close to a whole number of months
      if (Math.abs(monthsApprox - monthsRounded) < 0.3 && monthsRounded >= 1) {
        convertedValue = monthsRounded;
        convertedMeasure = 'months';
      }
    }
  }

  return {
    expiration_value: convertedValue,
    expiration_measure: convertedMeasure,
  };
};

/**
 * Get retention policy values for editing - applies intelligent conversion to preserve user intent
 * @param {object} retentionPolicy - Object with expiration_value and expiration_measure
 * @returns {object} - {expiration_value, expiration_measure} for form editing
 */
export const getRetentionPolicyForEditing = retentionPolicy => {
  return convertToUserFriendlyUnits(retentionPolicy);
};

/**
 * Format retention policy for display with intelligent unit conversion
 * Handles backend normalization patterns while keeping display readable
 * @param {object} retentionPolicy - Object with expiration_value and expiration_measure
 * @returns {string} - Formatted string like "1 Year", "3 Years", "6 Months"
 */
export const formatRetentionPolicyDisplay = retentionPolicy => {
  if (!retentionPolicy || !retentionPolicy.expiration_value || !retentionPolicy.expiration_measure) {
    return 'Not set';
  }

  // Convert to user-friendly units first
  const converted = convertToUserFriendlyUnits(retentionPolicy);
  const { expiration_value, expiration_measure } = converted;

  // Format with proper pluralization
  const singularMeasure = expiration_measure.slice(0, -1); // Remove 's' for singular
  const finalMeasure = expiration_value === 1 ? singularMeasure : expiration_measure;

  return `${expiration_value} ${finalMeasure.charAt(0).toUpperCase() + finalMeasure.slice(1)}`;
};

/**
 * Convert retentionDays to user-friendly units (days, weeks, months, years)
 */
export const convertDaysToMeasure = days => {
  if (days % 365 === 0) return { value: days / 365, measure: 'years' };
  if (days % 30 === 0) return { value: days / 30, measure: 'months' };
  if (days % 7 === 0) return { value: days / 7, measure: 'weeks' };
  return { value: days, measure: 'days' };
};

export const formatRetentionDaysDisplay = days => {
  if (!days || days <= 0) return 'Not set';

  const { value, measure } = convertDaysToMeasure(days);
  const singular = measure.slice(0, -1); // Remove 's' for singular
  const finalMeasure = value === 1 ? singular : measure;

  return `${value} ${finalMeasure.charAt(0).toUpperCase() + finalMeasure.slice(1)}`;
};

export const convertRetentionDaysToPolicy = retentionDays => {
  if (!retentionDays) return null;

  const { value, measure } = convertDaysToMeasure(retentionDays);

  return {
    expiration_measure: measure,
    expiration_value: value,
  };
};
