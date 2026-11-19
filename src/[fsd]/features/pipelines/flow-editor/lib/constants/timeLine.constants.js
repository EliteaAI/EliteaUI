export const STEP_MIN_WIDTH = '6.25rem';
export const STEP_CONNECTOR_MIN_WIDTH = '2.6875rem';
// A step name may outgrow its step, but never past the gap to the neighbouring dots.
export const STEP_NAME_MAX_WIDTH = `calc(${STEP_MIN_WIDTH} + ${STEP_CONNECTOR_MIN_WIDTH} - 0.5rem)`;
// The first and last steps sit near the scroll edges and use a shorter step width.
export const STEP_NAME_EDGE_MAX_WIDTH = '6rem';
// As tall as the expand button, so the name area is never shorter than its content.
export const STEP_NAME_HEIGHT = '1.75rem';
// Larger counts are shown as `99+`, so a big group cannot squeeze its name out of the step.
export const MAX_BADGE_COUNT = 99;
