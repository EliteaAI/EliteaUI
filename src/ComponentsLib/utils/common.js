export const filterProps = (...customProps) => ({
  shouldForwardProp: prop => !customProps.includes(prop),
});
