import {
  PUBLIC_PROJECT_ID,
  PUBLIC_PROJECT_NAME,
  ProjectIdStorageKey,
  ProjectNameStorageKey,
} from '@/common/constants';
import { createSlice } from '@reduxjs/toolkit';

import { alitaApi } from '../api/alitaApi.js';

const defaultProjects = [
  {
    id: PUBLIC_PROJECT_ID,
    name: PUBLIC_PROJECT_NAME,
  },
];

const getMessage = (
  isBlockNav,
  isStreaming,
  isEditingCanvas,
  isEditingAgent,
  isEditingToolkit,
  isEditingPipeline,
  isEditingArtifact,
  streamingType,
  isToolkitCreateMode,
) => {
  if (isBlockNav) {
    if (isStreaming) {
      switch (streamingType) {
        case 'application':
          return 'There are unsaved changes and the agent is being executed. Are you sure you want to leave?';
        default:
          return 'There are unsaved changes and you are chatting now. Are you sure you want to leave?';
      }
    } else if (isEditingCanvas) {
      return 'You are editing canvas now. Are you sure you want to leave?';
    } else if (isEditingAgent) {
      return 'You are editing an agent now. Do you want to discard current changes and continue?';
    } else if (isEditingPipeline) {
      return 'You are editing a pipeline now. Do you want to discard current changes and continue?';
    } else if (isEditingToolkit && !isToolkitCreateMode) {
      return 'You are editing a toolkit now. Do you want to discard current changes and continue?';
    } else if (isEditingArtifact) {
      return 'You are previewing an artifact now. Do you want to close the preview and continue?';
    } else {
      return 'There are unsaved changes. Are you sure you want to leave?';
    }
  } else {
    if (isStreaming) {
      switch (streamingType) {
        case 'application':
          return 'The agent is being executed. Are you sure you want to leave?';
        default:
          return 'Output is still generating. Switching now will stop it and you may lose progress. Switch anyway?';
      }
    } else if (isEditingCanvas) {
      return 'You are editing canvas now. Are you sure you want to leave?';
    } else if (isEditingAgent) {
      return 'You are editing an agent now. Are you sure you want to leave?';
    } else if (isEditingToolkit && !isToolkitCreateMode) {
      return 'You are editing a toolkit now. Are you sure you want to leave?';
    } else if (isEditingArtifact) {
      return 'You are previewing an artifact now. Are you sure you want to leave?';
    } else {
      return 'It seems the chatting is finished. You can leave now!';
    }
  }
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    sideBarCollapsed: localStorage.getItem('sideBarCollapsed') !== 'false',
    mode: localStorage.getItem('mode') || 'dark',
    pageSize: 20,
    navBlocker: {
      isBlockNav: false,
      isStreaming: false,
      isEditingCanvas: false,
      isEditingAgent: false,
      isEditingPipeline: false,
      isEditingToolkit: false,
      isEditingArtifact: false,
      isToolkitCreateMode: false,
      streamingType: 'application',
      isResetApiState: false,
      warningMessage: 'There are unsaved changes. Are you sure you want to leave?',
    },
    projects: defaultProjects,
    project: sessionStorage.getItem(ProjectIdStorageKey)
      ? {
          id: +sessionStorage.getItem(ProjectIdStorageKey),
          name: sessionStorage.getItem(ProjectNameStorageKey),
        }
      : localStorage.getItem(ProjectIdStorageKey)
        ? {
            id: +localStorage.getItem(ProjectIdStorageKey),
            name: localStorage.getItem(ProjectNameStorageKey),
          }
        : {
            id: undefined,
            name: '',
          },
    socketConnected: false,
  },
  reducers: {
    switchMode: state => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      localStorage.setItem('mode', state.mode);
    },
    setSideBarCollapsed: (state, { payload }) => {
      state.sideBarCollapsed = payload;
      localStorage.setItem('sideBarCollapsed', payload ? '' : 'false');
    },
    setBlockNav: (state, { payload }) => {
      state.navBlocker.isBlockNav = payload;
      state.navBlocker.warningMessage = payload
        ? getMessage(
            payload,
            state.navBlocker.isStreaming,
            state.navBlocker.isEditingCanvas,
            state.navBlocker.isEditingAgent,
            state.navBlocker.isEditingToolkit,
            state.navBlocker.isEditingPipeline,
            state.navBlocker.isEditingArtifact,
            state.navBlocker.streamingType,
            state.navBlocker.isToolkitCreateMode,
          )
        : state.navBlocker.warningMessage;
    },
    setStreamingBlockNav: (state, { payload }) => {
      state.navBlocker.isStreaming = payload.isStreaming;
      state.navBlocker.streamingType = payload.streamingType;
      state.navBlocker.warningMessage = payload.isStreaming
        ? getMessage(
            state.navBlocker.isBlockNav,
            payload.isStreaming,
            state.navBlocker.isEditingCanvas,
            state.navBlocker.isEditingAgent,
            state.navBlocker.isEditingToolkit,
            state.navBlocker.isEditingPipeline,
            state.navBlocker.isEditingArtifact,
            payload.streamingType,
            state.navBlocker.isToolkitCreateMode,
          )
        : state.navBlocker.warningMessage;
    },
    setEditingCanvasBlockNav: (state, { payload }) => {
      state.navBlocker.isEditingCanvas = payload.isEditingCanvas;
      state.navBlocker.streamingType = '';
      state.navBlocker.warningMessage = getMessage(
        state.navBlocker.isBlockNav,
        state.navBlocker.isStreaming,
        payload.isEditingCanvas,
        state.navBlocker.isEditingAgent,
        state.navBlocker.isEditingToolkit,
        state.navBlocker.isEditingPipeline,
        state.navBlocker.isEditingArtifact,
        payload.streamingType,
        state.navBlocker.isToolkitCreateMode,
      );
    },
    setAgentEditingBlockNav: (state, { payload }) => {
      state.navBlocker.isEditingAgent = payload;
      state.navBlocker.warningMessage = getMessage(
        state.navBlocker.isBlockNav,
        state.navBlocker.isStreaming,
        state.navBlocker.isEditingCanvas,
        payload,
        state.navBlocker.isEditingToolkit,
        state.navBlocker.isEditingPipeline,
        state.navBlocker.isEditingArtifact,
        state.navBlocker.streamingType,
        state.navBlocker.isToolkitCreateMode,
      );
    },
    setToolkitEditingBlockNav: (state, { payload }) => {
      state.navBlocker.isEditingToolkit = payload;
      state.navBlocker.warningMessage = getMessage(
        state.navBlocker.isBlockNav,
        state.navBlocker.isStreaming,
        state.navBlocker.isEditingCanvas,
        state.navBlocker.isEditingAgent,
        payload,
        state.navBlocker.isEditingPipeline,
        state.navBlocker.isEditingArtifact,
        state.navBlocker.streamingType,
        state.navBlocker.isToolkitCreateMode,
      );
    },
    setPipelineEditingBlockNav: (state, { payload }) => {
      state.navBlocker.isEditingPipeline = payload;
      state.navBlocker.warningMessage = getMessage(
        state.navBlocker.isBlockNav,
        state.navBlocker.isStreaming,
        state.navBlocker.isEditingCanvas,
        state.navBlocker.isEditingAgent,
        state.navBlocker.isEditingToolkit,
        payload,
        state.navBlocker.isEditingArtifact,
        state.navBlocker.streamingType,
        state.navBlocker.isToolkitCreateMode,
      );
    },
    setArtifactEditingBlockNav: (state, { payload }) => {
      state.navBlocker.isEditingArtifact = payload;
      state.navBlocker.warningMessage = getMessage(
        state.navBlocker.isBlockNav,
        state.navBlocker.isStreaming,
        state.navBlocker.isEditingCanvas,
        state.navBlocker.isEditingAgent,
        state.navBlocker.isEditingToolkit,
        state.navBlocker.isEditingPipeline,
        payload,
        state.navBlocker.streamingType,
        state.navBlocker.isToolkitCreateMode,
      );
    },
    setToolkitCreateMode: (state, { payload }) => {
      state.navBlocker.isToolkitCreateMode = payload;
      state.navBlocker.warningMessage = getMessage(
        state.navBlocker.isBlockNav,
        state.navBlocker.isStreaming,
        state.navBlocker.isEditingCanvas,
        state.navBlocker.isEditingAgent,
        state.navBlocker.isEditingToolkit,
        state.navBlocker.isEditingPipeline,
        state.navBlocker.isEditingArtifact,
        state.navBlocker.streamingType,
        payload,
      );
    },
    setIsResetApiState: (state, { payload }) => {
      state.navBlocker.isResetApiState = payload;
    },
    setProject: (state, { payload }) => {
      state.project = payload;
      sessionStorage.setItem(ProjectIdStorageKey, payload?.id);
      sessionStorage.setItem(ProjectNameStorageKey, payload?.name);
      localStorage.setItem(ProjectIdStorageKey, payload?.id);
      localStorage.setItem(ProjectNameStorageKey, payload?.name);
    },
    setPageSize: (state, { payload }) => {
      state.pageSize = payload;
    },
    setSocketConnected: (state, { payload }) => {
      state.socketConnected = payload;
    },
  },
  extraReducers: builder => {
    builder.addMatcher(alitaApi.endpoints.authorDetails.matchFulfilled, (state, { payload }) => {
      if (!state.project.id) {
        if (payload?.personal_project_id) {
          state.project = {
            id: payload?.personal_project_id,
            name: 'Private',
          };
          sessionStorage.setItem(ProjectIdStorageKey, payload?.personal_project_id);
          sessionStorage.setItem(ProjectNameStorageKey, 'Private');
          localStorage.setItem(ProjectIdStorageKey, payload?.personal_project_id);
          localStorage.setItem(ProjectNameStorageKey, 'Private');
        }
      } else {
        if (!sessionStorage.getItem(ProjectIdStorageKey)) {
          sessionStorage.setItem(ProjectIdStorageKey, state.project.id);
          sessionStorage.setItem(ProjectNameStorageKey, state.project.name);
        }
        if (!localStorage.getItem(ProjectIdStorageKey)) {
          localStorage.setItem(ProjectIdStorageKey, state.project.id);
          localStorage.setItem(ProjectNameStorageKey, state.project.name);
        }
      }
    });
    builder.addMatcher(alitaApi.endpoints.projectList.matchFulfilled, (state, { payload }) => {
      state.projects = [...(payload || defaultProjects)];
      if (state.project.id && payload?.length && !payload.find(project => project.id == state.project.id)) {
        const firstProject = payload[0];
        state.project = {
          id: firstProject.id,
          name: firstProject.name,
        };
        sessionStorage.setItem(ProjectIdStorageKey, firstProject.id);
        sessionStorage.setItem(ProjectNameStorageKey, firstProject.name);
        localStorage.setItem(ProjectIdStorageKey, firstProject.id);
        localStorage.setItem(ProjectNameStorageKey, firstProject.name);
      }
    });
  },
});

export const { name, actions } = settingsSlice;
export default settingsSlice.reducer;
