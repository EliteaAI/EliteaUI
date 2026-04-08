import { eliteaApi } from '@/api/eliteaApi.js';
import { createSlice } from '@reduxjs/toolkit';

const initApplication = {
  name: '',
  description: '',
  tags: [],
};
const applicationsSlice = createSlice({
  name: 'applications',
  initialState: {
    currentApplication: {
      ...initApplication,
    },
    toolkitSchemas: {},
    mcpSchemas: {},
    configurationsAsSchema: [],
    isSaving: false,
    shouldRefetchDetails: false,
    versionValidationInfo: {},
  },
  reducers: {
    setIsSaving: (state, action) => {
      state.isSaving = action.payload;
    },
    setShouldRefetchDetails: (state, action) => {
      state.shouldRefetchDetails = action.payload;
    },
    setVersionValidationInfo: (state, action) => {
      const { applicationId, projectId, versionId, validationInfo } = action.payload;
      state.versionValidationInfo = {
        ...state.versionValidationInfo,
        [`${projectId}_${applicationId}_${versionId}`]: validationInfo,
      };
    },
  },
  extraReducers: builder => {
    builder.addMatcher(
      eliteaApi.endpoints.toolkitTypes.matchFulfilled,
      (state, { payload, meta: { arg } }) => {
        const { params: { mcp } = {} } = arg.originalArgs || {};
        if (!mcp) {
          state.toolkitSchemas = payload ?? {};
        } else {
          state.mcpSchemas = payload ?? {};
        }
      },
    );
    builder.addMatcher(
      eliteaApi.endpoints.getAvailableConfigurationsType.matchFulfilled,
      (state, { payload }) => {
        // Merge configurations from different sections instead of overwriting
        if (payload && Array.isArray(payload)) {
          // Create a map to avoid duplicates by type
          const existingConfigs = new Map(state.configurationsAsSchema.map(config => [config.type, config]));

          // Add new configurations, updating existing ones if they have the same type
          payload.forEach(config => {
            if (config && config.type) {
              existingConfigs.set(config.type, config);
            }
          });

          // Convert back to array
          state.configurationsAsSchema = Array.from(existingConfigs.values());
        }
      },
    );
    builder.addMatcher(eliteaApi.endpoints.applicationDetails.matchFulfilled, (state, { payload }) => {
      state.currentApplication = {
        ...payload,
      };
    });
    builder.addMatcher(
      eliteaApi.endpoints.validateApplicationVersion.matchFulfilled,
      (state, { meta: { arg } }) => {
        const { applicationId, projectId, versionId } = arg.originalArgs;
        state.versionValidationInfo = {
          ...state.versionValidationInfo,
          [`${projectId}_${applicationId}_${versionId}`]: [],
        };
      },
    );
    builder.addMatcher(eliteaApi.endpoints.applicationEdit.matchFulfilled, (state, { payload }) => {
      state.currentApplication = {
        ...payload,
      };
    });
  },
});

export const { name, actions } = applicationsSlice;
export default applicationsSlice.reducer;
