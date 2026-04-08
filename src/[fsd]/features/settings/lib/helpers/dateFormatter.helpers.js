export const dateFormatter = value => {
  return value ? new Date(value).toLocaleString() : null;
};
