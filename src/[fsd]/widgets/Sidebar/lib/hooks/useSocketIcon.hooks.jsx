import { useSelector } from 'react-redux';

import { SocketConstants } from '@/[fsd]/widgets/Sidebar/lib/constants';

export const useSocketIcon = () => {
  const { socketConnected } = useSelector(state => state.settings);

  return {
    isSocketIconVisible: true,
    socketStatus: socketConnected
      ? SocketConstants.SocketStatus.Connected
      : SocketConstants.SocketStatus.Disconnected,
  };
};
