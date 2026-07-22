import { createSlice } from '@reduxjs/toolkit';

const CACHE_DURATION_MS = 60 * 60 * 1000; // 60 minutes

const skillHubSlice = createSlice({
  name: 'skillHub',
  initialState: {
    skillsByTag: {},
    totalCountsByTag: {},
    currentPageByTag: {},
    lastFetchedAt: null, // Timestamp of last successful fetch
    lastRefreshedAt: null,
    lastQuery: '', // The query used for the last fetch
  },
  reducers: {
    setSkillsData: (state, action) => {
      const { skillsByTag, totalCountsByTag, currentPageByTag, query } = action.payload;
      state.skillsByTag = skillsByTag;
      state.totalCountsByTag = totalCountsByTag;
      state.currentPageByTag = currentPageByTag;
      state.lastFetchedAt = Date.now();
      state.lastRefreshedAt = Date.now();
      state.lastQuery = query || '';
    },
    // Per-category loads only ever FOLLOW a bulk setSkillsData (which records
    // lastQuery), so lastQuery is deliberately left untouched here — bumping
    // only lastFetchedAt keeps the cache-validity check honest.
    updateCategoryData: (state, action) => {
      const { categoryName, page, rows, total } = action.payload;
      state.skillsByTag[categoryName] =
        page === 0 ? rows : [...(state.skillsByTag[categoryName] || []), ...rows];
      state.totalCountsByTag[categoryName] = total || rows.length;
      state.currentPageByTag[categoryName] = page;
      state.lastFetchedAt = Date.now();
      state.lastRefreshedAt = Date.now();
    },
    replaceCategoryData: (state, action) => {
      const { categoryName, page, rows, total } = action.payload;
      state.skillsByTag[categoryName] = rows;
      state.totalCountsByTag[categoryName] = total || rows.length;
      state.currentPageByTag[categoryName] = page;
      state.lastFetchedAt = Date.now();
      state.lastRefreshedAt = Date.now();
    },
    addToMyLiked: (state, action) => {
      const { skill, categoryName } = action.payload;
      const currentMyLiked = state.skillsByTag[categoryName] || [];
      if (!currentMyLiked.some(item => item.id === skill.id)) {
        state.skillsByTag[categoryName] = [skill, ...currentMyLiked];
        state.totalCountsByTag[categoryName] = (state.totalCountsByTag[categoryName] || 0) + 1;
      }
    },
    removeFromMyLiked: (state, action) => {
      const { skillId, categoryName } = action.payload;
      const currentMyLiked = state.skillsByTag[categoryName] || [];
      state.skillsByTag[categoryName] = currentMyLiked.filter(item => item.id !== skillId);
      state.totalCountsByTag[categoryName] = Math.max(0, (state.totalCountsByTag[categoryName] || 0) - 1);
    },
    updateSkillInCategories: (state, action) => {
      const { skillId, patch } = action.payload;
      Object.keys(state.skillsByTag).forEach(category => {
        state.skillsByTag[category] = state.skillsByTag[category].map(skill =>
          skill.id === skillId ? { ...skill, ...patch } : skill,
        );
      });
    },
    clearCache: state => {
      state.skillsByTag = {};
      state.totalCountsByTag = {};
      state.currentPageByTag = {};
      state.lastFetchedAt = null;
      state.lastRefreshedAt = null;
      state.lastQuery = '';
    },
  },
});

// Selectors
export const selectSkillHubData = state => state.skillHub;

export const selectLastRefreshedAt = state => state.skillHub.lastRefreshedAt;

export const selectIsCacheValid = (state, query) => {
  const { lastFetchedAt, lastQuery } = state.skillHub;
  if (!lastFetchedAt) return false;
  if (lastQuery !== (query || '')) return false;
  const isExpired = Date.now() - lastFetchedAt > CACHE_DURATION_MS;
  return !isExpired;
};

export const { name, actions } = skillHubSlice;
export default skillHubSlice.reducer;
