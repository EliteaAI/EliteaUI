// sort-imports-ignore
import React, { memo, useEffect, useState } from 'react';

import { enGB } from 'date-fns/locale/en-GB';
import ReactDOM from 'react-dom/client';
import { Provider, useDispatch } from 'react-redux';
import io from 'socket.io-client';

import { CssBaseline, GlobalStyles, ThemeProvider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';

// Store must be imported before App to ensure API endpoints are injected before slice extraReducers run
import store from '@/[fsd]/shared/config/store';
import App from '@/[fsd]/app/App';
import { ToolkitSocketProvider } from '@/[fsd]/shared/lib/context';
import { DEV, VITE_DEV_TOKEN, VITE_SOCKET_PATH, VITE_SOCKET_SERVER } from '@/common/constants';
import { NpsSurveyWidget } from '@/[fsd]/widgets/nps-survey';
import { ToastComponent, ToastProvider } from '@/components/ToastProvider';
import { FilePreviewNavigationProvider } from '@/contexts/FilePreviewNavigationContext';
import SocketContext from '@/contexts/SocketContext';
import { useEliteATheme } from '@/[fsd]/shared/lib/hooks';
import { actions as settingsActions } from '@/slices/settings.js';
import { McpAuthHelpers } from '@/[fsd]/features/mcp';
import { logVersion } from '@/utils.js';

logVersion();
McpAuthHelpers.startTokenRefreshScheduler();

const RootComponent = memo(() => {
  const { globalTheme } = useEliteATheme();

  const [socket, setSocket] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!VITE_SOCKET_SERVER) return;

    const ioOptions = {
      path: VITE_SOCKET_PATH,
      reconnectionDelayMax: 2000,
      extraHeaders: {},
    };

    if (DEV && VITE_DEV_TOKEN) ioOptions.extraHeaders.Authorization = `Bearer ${VITE_DEV_TOKEN}`;

    const socketIo = io(VITE_SOCKET_SERVER, ioOptions);

    socketIo?.on('connect', () => {
      // eslint-disable-next-line no-console
      console.debug('sio connected', socketIo);

      setSocket(socketIo);
      dispatch(settingsActions.setSocketConnected(socketIo.connected));
    });

    socketIo?.on('connect_error', err => {
      // eslint-disable-next-line no-console
      console.warn(`Connection error due to ${err}`);
      dispatch(settingsActions.setSocketConnected(socketIo.connected));
    });

    socketIo?.on('disconnect', () => {
      // eslint-disable-next-line no-console
      console.debug('needs reconnecting', socketIo);
      dispatch(settingsActions.setSocketConnected(socketIo.connected));
    });

    return () => {
      socketIo && socketIo.disconnect();
    };
  }, [dispatch]);

  return (
    <ThemeProvider theme={globalTheme}>
      <LocalizationProvider
        dateAdapter={AdapterDateFns}
        adapterLocale={enGB}
      >
        <SocketContext.Provider value={socket}>
          <ToastProvider>
            <CssBaseline />
            <GlobalStyles styles={globalStyles} />
            <FilePreviewNavigationProvider>
              <ToolkitSocketProvider>
                <App />
              </ToolkitSocketProvider>
            </FilePreviewNavigationProvider>
            <ToastComponent />
            <NpsSurveyWidget />
          </ToastProvider>
        </SocketContext.Provider>
      </LocalizationProvider>
    </ThemeProvider>
  );
});

RootComponent.displayName = 'RootComponent';

/** @type {MuiSx} */
const globalStyles = theme => ({
  body: {
    background: theme.palette.background.default.primary,
  },
  html: {
    background: theme.palette.background.default.primary,
  },
  '#root': {
    background: theme.palette.background.default.primary,
  },
  '.elitea-assistant-container': {
    left: '1.25rem',
    pointerEvents: 'none',

    '> *': {
      pointerEvents: 'auto',
    },

    '> button': {
      pointerEvents: 'none',
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <RootComponent />
    </Provider>
  </React.StrictMode>,
);
