// RTK Query endpoints must be injected before the reducers that match on them are imported
import '@/[fsd]/app/store/registerReducers';
import { getRegisteredReducers } from '@/[fsd]/shared/config/reducerRegistry';
import '@/api';
import {
  middleware as eliteaMiddleware,
  reducer as eliteaReducer,
  reducerPath as eliteaReducerName,
} from '@/api/eliteaApi';
import agentHubReducer, { name as agentHubReducerName } from '@/slices/agentHub';
import applicationsReducer, { name as applicationsReducerName } from '@/slices/applications';
import artifactReducer, { name as artifactReducerName } from '@/slices/artifact';
import chatReducer, { name as chatReducerName } from '@/slices/chat';
import fileTypesReducer, { name as fileTypesReducerName } from '@/slices/fileTypes';
import pipelineReducer, { name as pipelineReducerName } from '@/slices/pipeline';
import pipelineEditorReducer, { name as pipelineEditorReducerName } from '@/slices/pipelineEditor';
import searchReducer, { name as searchReducerName } from '@/slices/search';
import settingsReducer, { name as settingsReducerName } from '@/slices/settings';
import tagsReducer, { name as tagsReducerName } from '@/slices/tags';
import authorReducer, { name as authorReducerName } from '@/slices/trendingAuthors';
import uploadReducer, { name as uploadReducerName } from '@/slices/upload';
import userReducer, { name as userReducerName } from '@/slices/user';
import { configureStore } from '@reduxjs/toolkit';

// Mirrors shared/config/store.js plus the registered slices
const REDUCERS = {
  ...getRegisteredReducers(),
  [eliteaReducerName]: eliteaReducer,
  [agentHubReducerName]: agentHubReducer,
  [applicationsReducerName]: applicationsReducer,
  [artifactReducerName]: artifactReducer,
  [authorReducerName]: authorReducer,
  [chatReducerName]: chatReducer,
  [fileTypesReducerName]: fileTypesReducer,
  [pipelineEditorReducerName]: pipelineEditorReducer,
  [pipelineReducerName]: pipelineReducer,
  [searchReducerName]: searchReducer,
  [settingsReducerName]: settingsReducer,
  [tagsReducerName]: tagsReducer,
  [uploadReducerName]: uploadReducer,
  [userReducerName]: userReducer,
};

const INIT_ACTION = { type: '@@storybook/INIT' };

// state: { sliceName: fields } - given fields go on top of each slice's initial state
export const createStoryStore = (state = {}) =>
  configureStore({
    reducer: REDUCERS,
    preloadedState: Object.fromEntries(
      Object.entries(state).map(([name, fields]) => [
        name,
        { ...REDUCERS[name](undefined, INIT_ACTION), ...fields },
      ]),
    ),
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }).concat([eliteaMiddleware]),
  });
