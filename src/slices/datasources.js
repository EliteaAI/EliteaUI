import { createSlice } from '@reduxjs/toolkit';

const initDataSource = {
  name: '',
  description: '',
  embedding_model: {},
  storage: '',
  tags: [],
  dataSets: [],
};
const datasourcesSlice = createSlice({
  name: 'datasources',
  initialState: {
    currentDataSource: {
      ...initDataSource,
    },
  },
  reducers: {
    updateCurrentDataSource: (state, action) => {
      const { key, value } = action.payload;
      state.currentDataSource[key] = value;
    },
    updateCurrentDataSets: (state, action) => {
      const { index, key, value } = action.payload;
      const dataSet = state.currentDataSource.dataSets[index];
      if (dataSet) {
        dataSet[key] = value;
      } else {
        state.currentDataSource.dataSets[index] = {
          key: value,
        };
      }
    },
    resetCurrentDataSource: state => {
      state.currentDataSource = { ...initDataSource };
    },
  },
});

export const { name, actions } = datasourcesSlice;
export default datasourcesSlice.reducer;
