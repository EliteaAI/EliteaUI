// Lets slices from higher layers (entities, features) add their reducers to the store
// without shared/ importing them. This module must stay import-free to avoid cycles.
const registeredReducers = {};
let onReducersChange = null;
let isSealed = false;

export const registerReducer = (name, reducer) => {
  if (registeredReducers[name] === reducer) return;
  // A slice registering after startup means it is missing from app/store/registerReducers.js,
  // so raw state.x selectors would have seen undefined state until now.
  if (isSealed && import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn(
      `[reducerRegistry] "${name}" registered after startup; add it to app/store/registerReducers.js`,
    );
  }
  registeredReducers[name] = reducer;
  onReducersChange?.();
};

export const getRegisteredReducers = () => ({ ...registeredReducers });

export const setReducersChangeListener = listener => {
  onReducersChange = listener;
};

// Called by the app once its startup registrations are done.
export const sealReducerRegistry = () => {
  isSealed = true;
};
