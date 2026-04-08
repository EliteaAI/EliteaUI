import { createSlice } from '@reduxjs/toolkit';

const artifactSlice = createSlice({
  name: 'artifact',
  initialState: {
    bucket: null,
  },
  reducers: {
    setBucket: (state, action) => {
      const bucket = action.payload;
      state.bucket = bucket;
    },
  },
});

export const { name, actions } = artifactSlice;
export default artifactSlice.reducer;
