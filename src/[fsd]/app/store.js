import importWizardReducer, {
  name as importWizardReducerName,
} from '@/[fsd]/entities/import-wizard/model/importWizard.slice';
import indexesReducer, {
  name as indexesReducerName,
} from '@/[fsd]/features/toolkits/indexes/model/indexes.slice';
// Important! Need to have been already imported all APIs before the store will be created
import '@/api';
import {
  middleware as alitaMiddleware,
  reducer as alitaReducer,
  reducerPath as alitaReducerName,
} from '@/api/alitaApi';
import agentsStudioReducer, { name as agentsStudioReducerName } from '@/slices/agentsStudio';
import applicationsReducer, { name as applicationsReducerName } from '@/slices/applications';
import artifactReducer, { name as artifactReducerName } from '@/slices/artifact';
import chatReducer, { name as chatReducerName } from '@/slices/chat';
import datasourcesReducer, { name as datasourcesReducerName } from '@/slices/datasources';
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

const store = configureStore({
  reducer: {
    [alitaReducerName]: alitaReducer,
    [agentsStudioReducerName]: agentsStudioReducer,
    [applicationsReducerName]: applicationsReducer,
    [artifactReducerName]: artifactReducer,
    [authorReducerName]: authorReducer,
    [chatReducerName]: chatReducer,
    [datasourcesReducerName]: datasourcesReducer,
    [fileTypesReducerName]: fileTypesReducer,
    [importWizardReducerName]: importWizardReducer,
    [pipelineEditorReducerName]: pipelineEditorReducer,
    [pipelineReducerName]: pipelineReducer,
    [searchReducerName]: searchReducer,
    [settingsReducerName]: settingsReducer,
    [tagsReducerName]: tagsReducer,
    [uploadReducerName]: uploadReducer,
    [userReducerName]: userReducer,
    [indexesReducerName]: indexesReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore actions that process the Blob
        ignoredActions: ['alitaApi/executeQuery/fulfilled'],
        ignoredPaths: [alitaReducerName],
      },
    }).concat([alitaMiddleware]),
});

export default store;
