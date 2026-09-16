import { useMemo } from 'react';

import { useTheme } from '@mui/material';

import { useGetCurrentToolkitSchemas } from '@/[fsd]/features/toolkits/lib/hooks';
import { getToolIconByType } from '@/common/toolkitUtils.jsx';

export const useIconMetaTooltipType = (type, isMCP) => {
  const theme = useTheme();
  const { toolkitSchemas } = useGetCurrentToolkitSchemas();

  const typeInfo = useMemo(() => {
    return toolkitSchemas?.[type];
  }, [toolkitSchemas, type]);
  // const iconComponent = getToolIconByType(type, theme, typeInfo);

  const iconComponent = useMemo(() => {
    return typeInfo ? getToolIconByType(type, theme, { toolSchema: typeInfo, isMCP }) : null;
  }, [type, theme, typeInfo, isMCP]);

  return {
    component: iconComponent,
    alt: `${type} icon`,
    type: 'component', // Indicate we're using a component instead of URL
  };
};
