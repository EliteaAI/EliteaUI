import { useSelector } from 'react-redux';

import { SocketConstants } from '@/[fsd]/widgets/sidebar-root/lib/constants';

export const useSocketIcon = () => {
  const { socketConnected, socketReconnecting, socketReconnectAttempt } = useSelector(
    state => state.settings,
  );

  let socketStatus;
  if (socketConnected) {
    socketStatus = SocketConstants.SocketStatus.Connected;
  } else if (socketReconnecting) {
    socketStatus = SocketConstants.SocketStatus.Reconnecting;
  } else {
    socketStatus = SocketConstants.SocketStatus.Disconnected;
  }

  return {
    isSocketIconVisible: true,
    socketStatus,
    socketReconnectAttempt,
  };
};
