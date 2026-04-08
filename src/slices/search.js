import { createSlice } from '@reduxjs/toolkit';

import { eliteaApi } from '../api/eliteaApi';

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
    builder.addMatcher(eliteaApi.endpoints.applicationList.matchFulfilled, state => {
      if (isSearchDone(state)) {
        state.searchDone = true;
      }
    });

    builder.addMatcher(eliteaApi.endpoints.publicApplicationsList.matchFulfilled, state => {
      if (isSearchDone(state)) {
        state.searchDone = true;
      }
    });

    builder.addMatcher(eliteaApi.endpoints.publicApplicationsList.matchFulfilled, state => {
      if (isSearchDone(state)) {
        state.searchDone = true;
      }
    });
    builder.addMatcher(eliteaApi.endpoints.toolkitsList.matchFulfilled, state => {
      if (isSearchDone(state)) {
        state.searchDone = true;
      }
    });
    builder.addMatcher(eliteaApi.endpoints.getConfigurationsList.matchFulfilled, state => {
      if (isSearchDone(state)) {
        state.searchDone = true;
      }
    });
  },
});

export const { name, actions } = searchSlice;
export default searchSlice.reducer;
