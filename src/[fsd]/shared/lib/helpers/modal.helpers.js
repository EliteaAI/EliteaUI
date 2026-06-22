export const getContentPadding = (isFullscreen, isSimple) => {
  if (isFullscreen) return '0 !important';
  if (isSimple) return '0 1.5rem 0.25rem !important';
  return '1.5rem !important';
};
