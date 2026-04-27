import { alitaApi } from '@/api/alitaApi.js';
import { createSlice } from '@reduxjs/toolkit';

const indexesSlice = createSlice({
  name: 'indexes',
  initialState: {
    indexesList: {
      data: [],
      isFetching: false,
      isLoading: false,
      hasData: false,
    },
    toolkitScheduler: {},
    selectedHistoryItem: null,
  },
  reducers: {
    addTempLocalIndex: (state, action) => {
      state.indexesList.data = [action.payload, ...state.indexesList.data];
    },
    updateIndexDepMeta: (state, action) => {
      state.indexesList.data = state.indexesList.data.map(index => {
        if (index.id === action.payload.id) {
          return {
            ...index,
            metadata: {
              ...index.metadata,
              ...(action.payload.state && { state: action.payload.state }),
              ...(action.payload.task_id && { task_id: action.payload.task_id }),
              ...(action.payload.conversation_id && { conversation_id: action.payload.conversation_id }),
            },
          };
        }

        return index;
      });
    },
    selectHistoryItem: (state, action) => {
      state.selectedHistoryItem = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addMatcher(alitaApi.endpoints.getIndexesList.matchPending, state => {
        state.indexesList.isFetching = true;
        state.indexesList.isLoading = !state.indexesList.hasData;
      })
      .addMatcher(alitaApi.endpoints.getIndexesList.matchFulfilled, (state, { payload }) => {
        state.indexesList.data = payload ?? [];
        state.indexesList.isLoading = false;
        state.indexesList.isFetching = false;
        state.indexesList.hasData = true;
      })
      .addMatcher(alitaApi.endpoints.getIndexesList.matchRejected, state => {
        state.indexesList.data = [];
        state.indexesList.hasData = false;
        state.indexesList.isLoading = false;
        state.indexesList.isFetching = false;
      })
      .addMatcher(alitaApi.endpoints.getIndexSchedule.matchFulfilled, (state, { payload }) => {
        state.toolkitScheduler = payload.meta?.indexes_meta ?? {};
      })
      .addMatcher(alitaApi.endpoints.deleteIndexItem.matchFulfilled, (state, { meta: { arg } }) => {
        const indexName = arg?.originalArgs?.indexName;

        if (indexName) delete state.toolkitScheduler[indexName];
      });
  },
});

// Selectors
export const selectIndexesList = state => state.indexes.indexesList;
export const selectIndexesAvailable = state => state.indexes.indexesList.data.length > 0;
export const selectToolkitScheduler = state => state.indexes.toolkitScheduler;
export const selectHistoryItem = state => state.indexes.selectedHistoryItem;

export const { name, actions } = indexesSlice;
export default indexesSlice.reducer;
