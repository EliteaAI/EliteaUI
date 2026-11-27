const toList = starters => (Array.isArray(starters) ? starters : []);

/** Drops empty entries, the same way starters are filtered before they are saved. */
export const filterEmptyStarters = starters => toList(starters).filter(starter => starter?.trim());

/** Position-by-position equality; a missing list counts as an empty one. */
export const areStartersEqual = (startersA, startersB) => {
  const listA = toList(startersA);
  const listB = toList(startersB);

  return listA.length === listB.length && listA.every((value, index) => value === listB[index]);
};
