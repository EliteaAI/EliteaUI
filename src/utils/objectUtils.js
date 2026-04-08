export const getFirstElementFromFirstProperty = obj => {
  const objKeys = Object.keys(obj);

  if (objKeys.length === 0) {
    return null;
  }

  const firstKey = objKeys[0];
  const array = obj[firstKey];
  return array.length > 0 ? array[0] : null;
};
