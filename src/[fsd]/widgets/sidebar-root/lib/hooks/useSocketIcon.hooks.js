import { useSelector } from 'react-redux';

import { SocketConstants } from '@/[fsd]/widgets/sidebar-root/lib/constants';

export const useSocketIcon = () => {
  const { socketConnected, sessionExpired } = useSelector(state => state.settings);

  return {
    isSocketIconVisible: true,
    // A socket bound to an expired session is connected but unusable, so do not report it as connected
    socketStatus:
      socketConnected && !sessionExpired
        ? SocketConstants.SocketStatus.Connected
        : SocketConstants.SocketStatus.Disconnected,
  };
};
