import { registerReducer } from '@/[fsd]/shared/config/reducerRegistry';
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isForking: false,
  data: undefined,
  sourceProjectId: undefined,
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
      const { isForking, data, sourceProjectId } = action.payload;
      state.openWizard = true;
      state.data = data;
      state.isForking = isForking;
      state.sourceProjectId = sourceProjectId;
    },
    closeImportWizard: state => {
      state.openWizard = false;
      state.data = undefined;
      state.isForking = false;
      state.sourceProjectId = undefined;
    },
  },
});

export const { name, actions } = importWizardsSlice;
registerReducer(importWizardsSlice.name, importWizardsSlice.reducer);

export default importWizardsSlice.reducer;
