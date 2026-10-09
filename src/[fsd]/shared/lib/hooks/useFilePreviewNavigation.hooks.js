import { useContext } from 'react';

import { FilePreviewNavigationContext } from '@/[fsd]/shared/lib/context/FilePreviewNavigationContext';

export const useFilePreviewNavigation = () => {
  const context = useContext(FilePreviewNavigationContext);
  if (!context) {
    throw new Error('useFilePreviewNavigation must be used within a FilePreviewNavigationProvider');
  }
  return context;
};
