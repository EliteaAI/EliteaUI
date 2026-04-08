import axios from 'axios';

import { PathValidationHelpers } from '@/[fsd]/features/artifacts/lib/helpers';
import { DEV, VITE_DEV_TOKEN, VITE_SERVER_URL } from '@/common/constants';
import { clearBaseUrlPrefix } from '@/common/utils';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export const uploadSlice = createSlice({
  name: 'upload',
  initialState: {
    isUploading: false,
    uploadFinished: false,
    skippedFiles: [],
    fileStatuses: [
      //   {
      //   uploadProgress: 100,
      //   filename: 'test 1',
      //     failed: false
      // },{
      //   uploadProgress: 0,
      //   filename: 'test 2',
      //     failed: true
      // }
    ],
  },
  reducers: {
    setIsUploading: (state, action) => {
      state.isUploading = action.payload;
    },
    setUploadFinished: (state, action) => {
      state.uploadFinished = action.payload;
    },
    resetFileStatus: (state, action) => {
      state.fileStatuses = action.payload;
    },
    setSkippedFiles: (state, action) => {
      state.skippedFiles = action.payload;
    },
    updateFileStatus: (state, action) => {
      const newStatus = [...state.fileStatuses];
      const { index, ...otherStatuses } = action.payload;
      newStatus[index] = {
        ...newStatus[index],
        ...otherStatuses,
      };
      state.fileStatuses = newStatus;
    },
  },
  extraReducers: builder => {
    // eslint-disable-next-line no-unused-vars
    builder.addCase(uploadFile.fulfilled, (state, action) => {});
  },
});

export const uploadFile = createAsyncThunk(
  'upload/uploadFile',
  async ({ files, url, projectId, folderPath = '' }, { dispatch, rejectWithValue }) => {
    if (!PathValidationHelpers.isSecureUploadPath(folderPath))
      return rejectWithValue('Upload blocked: Security violation detected in path');

    const headers = {
      'Content-Type': 'multipart/form-data',
    };

    if (DEV) {
      if (VITE_DEV_TOKEN) headers['Authorization'] = `Bearer ${VITE_DEV_TOKEN}`;

      headers['Cache-Control'] = 'no-cache';
    }

    const displayFilenames = Object.keys(files).map(key => {
      const fileName = files[key].name;
      return folderPath ? `${folderPath}/${fileName}` : fileName;
    });

    dispatch(
      uploadSlice.actions.resetFileStatus(
        displayFilenames.map(filename => ({
          filename,
          uploadProgress: 0,
          failed: false,
        })),
      ),
    );
    dispatch(uploadSlice.actions.setIsUploading(true));
    dispatch(uploadSlice.actions.setUploadFinished(false));

    let uploadPromises;
    try {
      uploadPromises = Object.keys(files).map((key, index) => {
        // Construct URL with folder path as part of the path (S3 API expects key in URL)
        // Note: S3 API doesn't use /api/v2 prefix, it's directly under /artifacts/s3
        const fileName = files[key].name;
        const fileKey = folderPath ? `${folderPath}/${fileName}` : fileName;

        if (!PathValidationHelpers.isSecureUploadPath(fileKey))
          throw new Error(`Security violation: Unsafe file key detected for "${fileName}"`);

        // Encode each path segment separately to preserve slashes in the path
        const encodedFileKey = fileKey
          .split('/')
          .map(segment => encodeURIComponent(segment))
          .join('/');

        const baseUrl = clearBaseUrlPrefix(VITE_SERVER_URL, '/api/v2');
        const uploadUrl = `${baseUrl}${url}/${encodedFileKey}?project_id=${projectId}`;

        // S3 PUT expects raw file content, not FormData
        // Send the file directly as the request body with appropriate Content-Type
        const file = files[key];
        const uploadHeaders = {
          ...headers,
          'Content-Type': file.type || 'application/octet-stream',
        };

        return axios.put(uploadUrl, file, {
          onUploadProgress: progressEvent => {
            const uploadProgress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            dispatch(uploadSlice.actions.updateFileStatus({ index, uploadProgress }));
          },
          withCredentials: true,
          headers: uploadHeaders,
        });
      });
    } catch (error) {
      // Clean up upload state so the UI does not freeze
      dispatch(uploadSlice.actions.setIsUploading(false));
      dispatch(uploadSlice.actions.setUploadFinished(false));
      dispatch(uploadSlice.actions.resetFileStatus([]));
      return rejectWithValue(error.message);
    }

    Promise.allSettled(uploadPromises).then(results => {
      // All requests completed (either fulfilled or rejected)
      let hasFailure = false;
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          dispatch(
            uploadSlice.actions.updateFileStatus({
              index,
              uploadFinished: true,
              failed: false,
            }),
          );
        } else {
          dispatch(
            uploadSlice.actions.updateFileStatus({
              index,
              uploadFinished: true,
              failed: true,
            }),
          );
          hasFailure = true;
        }
      });
      dispatch(uploadSlice.actions.setIsUploading(hasFailure));
      dispatch(uploadSlice.actions.setUploadFinished(true));
    });
  },
);

export const { setUploadProgress, setUploadFinished, setIsUploading, setSkippedFiles } = uploadSlice.actions;
export const { name } = uploadSlice;
export default uploadSlice.reducer;
