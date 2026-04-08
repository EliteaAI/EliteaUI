import { createSelector, createSlice } from '@reduxjs/toolkit';

// Transform API response with document_types, image_types and code_types to UI format (mime_type -> [extensions])
const transformDocumentLoaders = apiResponse => {
  if (!apiResponse || typeof apiResponse !== 'object') {
    return {}; // No fallback - return empty object if API data unavailable
  }

  const transformed = {};

  // Helper function to process each category (document_types, image_types, code_types)
  const processCategory = categoryData => {
    if (categoryData && typeof categoryData === 'object') {
      Object.entries(categoryData).forEach(([extension, mimeType]) => {
        if (!transformed[mimeType]) {
          transformed[mimeType] = [];
        }
        if (!transformed[mimeType].includes(extension)) {
          transformed[mimeType].push(extension);
        }
      });
    }
  };

  // Process document_types, image_types and code_types
  processCategory(apiResponse.document_types);
  processCategory(apiResponse.image_types);
  processCategory(apiResponse.code_types);
  // Other
  processCategory({ '.svg': 'image/svg+xml' });

  return transformed;
};

const initialState = {
  // All file types from API (no static fallback)
  allowedFileTypes: {},
  documentLoaders: {}, // Raw API response with document_types, image_types and code_types
  isLoading: false,
  error: null,
};

const fileTypesSlice = createSlice({
  name: 'fileTypes',
  initialState,
  reducers: {
    setDocumentLoaders: (state, action) => {
      state.documentLoaders = action.payload;

      // Transform API data to UI format (all file types from API)
      state.allowedFileTypes = transformDocumentLoaders(action.payload);
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
  },
});

export const { setDocumentLoaders, setLoading, setError, clearError } = fileTypesSlice.actions;

// Selectors with safe defaults
export const selectAllowedFileTypes = state => state.fileTypes.allowedFileTypes || {};
export const selectDocumentLoaders = state => state.fileTypes.documentLoaders || {};
export const selectFileTypesLoading = state => state.fileTypes.isLoading || false;
export const selectFileTypesError = state => state.fileTypes.error;

// Derived selectors with memoization to prevent unnecessary re-renders
export const selectAllowedExtensions = createSelector([selectAllowedFileTypes], fileTypes =>
  Object.values(fileTypes).flat(),
);

export const selectAllowedMimeTypes = createSelector([selectAllowedFileTypes], fileTypes =>
  Object.keys(fileTypes),
);

// Additional selectors for document and image types separately with memoization
export const selectDocumentTypes = createSelector(
  [selectDocumentLoaders],
  documentLoaders => documentLoaders.document_types || {},
);

export const selectImageTypes = createSelector(
  [selectDocumentLoaders],
  documentLoaders => documentLoaders.image_types || {},
);

export const selectCodeTypes = createSelector(
  [selectDocumentLoaders],
  documentLoaders => documentLoaders.code_types || {},
);

export const { name, actions } = fileTypesSlice;

export default fileTypesSlice.reducer;
