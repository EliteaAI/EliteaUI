import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isForking: false,
  data: undefined,
  openWizard: false,
};

const importWizardsSlice = createSlice({
  name: 'importWizard',
  initialState,
  reducers: {
    setIsForking: (state, action) => {
      state.isForking = action.isForking;
    },
    openImportWizard: (state, action) => {
      const { isForking, data } = action.payload;
      state.openWizard = true;
      state.data = data;
      state.isForking = isForking;
    },
    closeImportWizard: state => {
      state.openWizard = false;
      state.data = undefined;
      state.isForking = false;
    },
  },
});

export const { name, actions } = importWizardsSlice;
export default importWizardsSlice.reducer;
