import { createSlice } from '@reduxjs/toolkit';

import { alitaApi } from '../api/alitaApi';

const isSearchDone = ({ query, queryTags }) => {
  return query || queryTags.length > 0;
};
const searchSlice = createSlice({
  name: 'search',
  initialState: {
    query: '',
    queryTags: [],
    searchDone: false,
  },
  reducers: {
    setQuery: (state, action) => {
      const { payload } = action;
      state.query = payload?.query || '';
      state.queryTags = payload?.queryTags || [];
    },
    resetQuery: state => {
      state.query = '';
      state.queryTags = [];
      state.searchDone = false;
    },
  },
  extraReducers: builder => {
    builder.addMatcher(alitaApi.endpoints.applicationList.matchFulfilled, state => {
      if (isSearchDone(state)) {
        state.searchDone = true;
      }
    });

    builder.addMatcher(alitaApi.endpoints.publicApplicationsList.matchFulfilled, state => {
      if (isSearchDone(state)) {
        state.searchDone = true;
      }
    });

    builder.addMatcher(alitaApi.endpoints.publicApplicationsList.matchFulfilled, state => {
      if (isSearchDone(state)) {
        state.searchDone = true;
      }
    });
    builder.addMatcher(alitaApi.endpoints.toolkitsList.matchFulfilled, state => {
      if (isSearchDone(state)) {
        state.searchDone = true;
      }
    });
    builder.addMatcher(alitaApi.endpoints.getConfigurationsList.matchFulfilled, state => {
      if (isSearchDone(state)) {
        state.searchDone = true;
      }
    });
  },
});

export const { name, actions } = searchSlice;
export default searchSlice.reducer;
