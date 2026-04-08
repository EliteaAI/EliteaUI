export function getTabAccessibilityProps(index) {
  if (typeof index !== 'number' || index < 0) {
    throw new Error('Index must be a non-negative number');
  }

  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}
