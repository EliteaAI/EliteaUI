// Lets slices from higher layers (entities, features) add their reducers to the store
// without shared/ importing them. This module must stay import-free to avoid cycles.
const registeredReducers = {};
let onReducersChange = null;

export const registerReducer = (name, reducer) => {
  if (registeredReducers[name] === reducer) return;
  registeredReducers[name] = reducer;
  onReducersChange?.();
};

export const getRegisteredReducers = () => ({ ...registeredReducers });

export const setReducersChangeListener = listener => {
  onReducersChange = listener;
};
