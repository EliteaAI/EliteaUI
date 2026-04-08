import { createSlice } from '@reduxjs/toolkit';

const CACHE_DURATION_MS = 60 * 60 * 1000; // 60 minutes

const agentsStudioSlice = createSlice({
  name: 'agentsStudio',
  initialState: {
    applicationsByTag: {},
    totalCountsByTag: {},
    currentPageByTag: {},
    lastFetchedAt: null, // Timestamp of last successful fetch
    lastQuery: '', // The query used for the last fetch
  },
  reducers: {
    setApplicationsData: (state, action) => {
      const { applicationsByTag, totalCountsByTag, currentPageByTag, query } = action.payload;
      state.applicationsByTag = applicationsByTag;
      state.totalCountsByTag = totalCountsByTag;
      state.currentPageByTag = currentPageByTag;
      state.lastFetchedAt = Date.now();
      state.lastQuery = query || '';
    },
    updateCategoryData: (state, action) => {
      const { categoryName, page, rows, total } = action.payload;
      state.applicationsByTag[categoryName] =
        page === 0 ? rows : [...(state.applicationsByTag[categoryName] || []), ...rows];
      state.totalCountsByTag[categoryName] = total || rows.length;
      state.currentPageByTag[categoryName] = page;
      state.lastFetchedAt = Date.now();
    },
    updateApplicationInCategories: (state, action) => {
      const { applicationId, updateFn } = action.payload;
      Object.keys(state.applicationsByTag).forEach(category => {
        state.applicationsByTag[category] = state.applicationsByTag[category].map(app => {
          if (app.id === applicationId) {
            return updateFn(app);
          }
          return app;
        });
      });
    },
    addToMyLiked: (state, action) => {
      const { application, categoryName } = action.payload;
      const currentMyLiked = state.applicationsByTag[categoryName] || [];
      if (!currentMyLiked.some(app => app.id === application.id)) {
        state.applicationsByTag[categoryName] = [application, ...currentMyLiked];
        state.totalCountsByTag[categoryName] = (state.totalCountsByTag[categoryName] || 0) + 1;
      }
    },
    removeFromMyLiked: (state, action) => {
      const { applicationId, categoryName } = action.payload;
      const currentMyLiked = state.applicationsByTag[categoryName] || [];
      state.applicationsByTag[categoryName] = currentMyLiked.filter(app => app.id !== applicationId);
      state.totalCountsByTag[categoryName] = Math.max(0, (state.totalCountsByTag[categoryName] || 0) - 1);
    },
    clearCategory: (state, action) => {
      const { categoryName } = action.payload;
      state.applicationsByTag[categoryName] = [];
      state.currentPageByTag[categoryName] = 0;
      // Keep totalCountsByTag to show skeleton count
    },
    clearCache: state => {
      state.applicationsByTag = {};
      state.totalCountsByTag = {};
      state.currentPageByTag = {};
      state.lastFetchedAt = null;
      state.lastQuery = '';
    },
  },
});

// Selectors
export const selectAgentsStudioData = state => state.agentsStudio;

export const selectIsCacheValid = (state, query) => {
  const { lastFetchedAt, lastQuery } = state.agentsStudio;
  if (!lastFetchedAt) return false;
  if (lastQuery !== (query || '')) return false;
  const isExpired = Date.now() - lastFetchedAt > CACHE_DURATION_MS;
  return !isExpired;
};

export const selectHasData = state => {
  const { applicationsByTag } = state.agentsStudio;
  return Object.keys(applicationsByTag).length > 0;
};

export const { name, actions } = agentsStudioSlice;
export default agentsStudioSlice.reducer;
