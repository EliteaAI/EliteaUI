import { createSlice } from '@reduxjs/toolkit';

import { trendingAuthor } from '../api/trendingAuthor.js';

const trendingAuthorSlice = createSlice({
  name: 'trendingAuthor',
  initialState: {
    trendingAuthorsList: [],
    authorDetails: {},
  },
  reducers: {
    resetAuthor: state => {
      state.authorDetails = {};
    },
  },
  extraReducers: builder => {
    builder.addMatcher(trendingAuthor.endpoints.trendingAuthorsList.matchFulfilled, (state, { payload }) => {
      state.trendingAuthorsList = payload;
    });
    builder.addMatcher(
      trendingAuthor.endpoints.trendingAuthorsDetails.matchFulfilled,
      (state, { payload }) => {
        state.authorDetails = payload;
      },
    );
  },
});

export const { name } = trendingAuthorSlice;
export default trendingAuthorSlice.reducer;
