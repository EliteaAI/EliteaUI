import { PermissionStorageKey, PublicPermissionStorageKey } from '@/common/constants.js';
import { actions as settingsActions } from '@/slices/settings';
import { createSlice } from '@reduxjs/toolkit';

import { eliteaApi } from '../api/eliteaApi.js';

const initialState = () => ({
  id: null,
  email: null,
  last_login: null,
  name: null,
  permissions: sessionStorage.getItem(PermissionStorageKey)
    ? JSON.parse(sessionStorage.getItem(PermissionStorageKey))
    : undefined,
  publicPermissions: sessionStorage.getItem(PublicPermissionStorageKey)
    ? JSON.parse(sessionStorage.getItem(PublicPermissionStorageKey))
    : undefined,
});

const userSlice = createSlice({
  name: 'user',
  initialState: initialState(),
  reducers: {
    logout: state => {
      sessionStorage.removeItem(PermissionStorageKey);
      sessionStorage.removeItem(PublicPermissionStorageKey);
      Object.assign(state, initialState());
    },
  },
  extraReducers: builder => {
    builder
      .addCase(settingsActions.setProject, state => {
        state.permissions = undefined;
        sessionStorage.removeItem(PermissionStorageKey);
      })
      .addMatcher(eliteaApi.endpoints.authorDetails.matchFulfilled, (state, { payload }) => {
        Object.assign(state, payload);
      })
      .addMatcher(eliteaApi.endpoints.publicPermissionList.matchFulfilled, (state, { payload }) => {
        if (!payload || !payload.length) {
          state.publicPermissions = ['empty.fake.permission.public'];
          sessionStorage.removeItem(PublicPermissionStorageKey);
        } else {
          state.publicPermissions = payload;
          sessionStorage.setItem(PublicPermissionStorageKey, JSON.stringify(payload));
        }
      })
      .addMatcher(eliteaApi.endpoints.permissionList.matchFulfilled, (state, { payload }) => {
        if (!payload || !payload.length) {
          state.permissions = ['empty.fake.permission'];
          sessionStorage.removeItem(PermissionStorageKey);
        } else {
          state.permissions = payload;
          sessionStorage.setItem(PermissionStorageKey, JSON.stringify(payload));
        }
      })
      .addMatcher(eliteaApi.endpoints.publicPermissionList.matchRejected, state => {
        state.publicPermissions = ['empty.fake.permission.public'];
        sessionStorage.removeItem(PublicPermissionStorageKey);
      })
      .addMatcher(eliteaApi.endpoints.permissionList.matchRejected, state => {
        state.permissions = ['empty.fake.permission'];
        sessionStorage.removeItem(PermissionStorageKey);
      });
  },
});

export const logout = () => async dispatch => {
  await dispatch(userSlice.actions.logout());
  await dispatch(eliteaApi.util.resetApiState());
};

export const { name } = userSlice;
export default userSlice.reducer;
