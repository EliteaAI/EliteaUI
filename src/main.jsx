import React, { useEffect, useState } from 'react';

import { enGB } from 'date-fns/locale/en-GB';
import ReactDOM from 'react-dom/client';
import { Provider, useDispatch } from 'react-redux';
import io from 'socket.io-client';

import { CssBaseline, GlobalStyles, ThemeProvider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';

import { ToolkitSocketProvider } from '@/[fsd]/app/providers';
import store from '@/[fsd]/app/store';
import { ToastComponent, ToastProvider } from '@/components/ToastProvider';
import { FilePreviewNavigationProvider } from '@/contexts/FilePreviewNavigationContext';
import useEliteATheme from '@/hooks/useEliteATheme';
import { actions as settingsActions } from '@/slices/settings.js';
import { logVersion } from '@/utils.js';

import App from './App';
import { DEV, VITE_DEV_TOKEN, VITE_SOCKET_PATH, VITE_SOCKET_SERVER } from './common/constants';
import SocketContext from './contexts/SocketContext';

logVersion();

const RootComponent = () => {
  const { globalTheme } = useEliteATheme();

  const [socket, setSocket] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!VITE_SOCKET_SERVER) return;

    const ioOptions = {
      path: VITE_SOCKET_PATH,
      // reconnectionAttempts: 10,
      reconnectionDelayMax: 2000,
      extraHeaders: {},
    };
    if (DEV && VITE_DEV_TOKEN) {
      ioOptions.extraHeaders.Authorization = `Bearer ${VITE_DEV_TOKEN}`;
    }

    const socketIo = io(VITE_SOCKET_SERVER, ioOptions);

    socketIo.on('connect', async () => {
      // eslint-disable-next-line no-console
      console.debug('sio connected', socketIo);
      setSocket(socketIo);
      await dispatch(settingsActions.setSocketConnected(socketIo.connected));
    });

    socketIo?.on('connect_error', err => {
      // eslint-disable-next-line no-console
      console.warn(`Connection error due to ${err}`);
      dispatch(settingsActions.setSocketConnected(socketIo.connected));
    });
    socketIo?.on('disconnect', async () => {
      // eslint-disable-next-line no-console
      console.debug('needs reconnecting', socketIo);
      await dispatch(settingsActions.setSocketConnected(socketIo.connected));
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
            <GlobalStyles
              styles={theme => ({
                body: {
                  background: theme.palette.background.eliteaDefault,
                },
                html: {
                  background: theme.palette.background.eliteaDefault,
                },
                '#root': {
                  background: theme.palette.background.eliteaDefault,
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
              })}
            />
            <FilePreviewNavigationProvider>
              <ToolkitSocketProvider>
                <App />
              </ToolkitSocketProvider>
            </FilePreviewNavigationProvider>
            <ToastComponent />
          </ToastProvider>
        </SocketContext.Provider>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <RootComponent />
    </Provider>
  </React.StrictMode>,
);
