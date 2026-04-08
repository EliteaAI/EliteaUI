import { configureStore, createSlice } from '@reduxjs/toolkit';

// Simplified settings slice for Storybook
const storybookSettingsSlice = createSlice({
  name: 'settings',
  initialState: {
    mode: 'light', // Default to light theme
    socketConnected: false,
  },
  reducers: {
    setMode: (state, action) => {
      state.mode = action.payload;
    },
    toggleMode: state => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
    },
    setSocketConnected: (state, action) => {
      state.socketConnected = action.payload;
    },
  },
});

// Simplified user slice for Storybook
const storybookUserSlice = createSlice({
  name: 'user',
  initialState: {
    user: null,
    permissions: [],
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setPermissions: (state, action) => {
      state.permissions = action.payload;
    },
  },
});

// Create a minimal store for Storybook
const StorybookStore = configureStore({
  reducer: {
    settings: storybookSettingsSlice.reducer,
    user: storybookUserSlice.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Disable serializable checks for Storybook
        ignoredActions: [],
        ignoredPaths: [],
      },
    }),
});

export default StorybookStore;
export const { setMode, toggleMode, setSocketConnected } = storybookSettingsSlice.actions;
export const { setUser, setPermissions } = storybookUserSlice.actions;
