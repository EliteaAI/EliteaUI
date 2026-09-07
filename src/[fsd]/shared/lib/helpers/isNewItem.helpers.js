export const DEFAULT_NEW_ITEM_DAYS = 14;

export const isNewItem = (createdAt, newItemDays) => {
  if (!createdAt || !newItemDays) return false;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - newItemDays);
  return new Date(createdAt) >= cutoff;
};
