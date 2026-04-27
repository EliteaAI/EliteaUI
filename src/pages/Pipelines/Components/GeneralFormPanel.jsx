import { useCallback, useEffect, useState } from 'react';

import { IconButton } from '@mui/material';

import DoubleLeftIcon from '@/components/Icons/DoubleLeftIcon';
import DoubleRightIcon from '@/components/Icons/DoubleRightIcon';
import useIsSmallWindow from '@/hooks/useIsSmallWindow';
import useViewMode from '@/hooks/useViewMode';
import PipelineConfigurationForm from '@/pages/Applications/Components/Applications/PipelineConfigurationForm.jsx';
import { ContentContainer } from '@/pages/Common/index.js';
import { useTheme } from '@emotion/react';

const GeneralFormPanel = ({ applicationId, onCollapsed }) => {
  const theme = useTheme();
  const viewMode = useViewMode();

  const [collapsed, setCollapsed] = useState(false);
  const { isSmallWindow } = useIsSmallWindow();

  const onClickCollapsed = useCallback(() => {
    setCollapsed(!collapsed);
    onCollapsed?.(!collapsed);
  }, [collapsed, onCollapsed]);

  useEffect(() => {
    if (isSmallWindow) {
      setCollapsed(false);
      onCollapsed?.(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSmallWindow]);

  return (
    <>
      <ContentContainer
        flex={3}
        maxWidth={isSmallWindow ? '100%' : collapsed ? '28px' : '320px'}
        position={'relative'}
        // paddingBottom={'20px'}
        display={'flex'}
        minWidth={isSmallWindow ? '100%' : collapsed ? '28px' : '320px'}
        height={!isSmallWindow ? '100% !important' : 'auto'}
        flexDirection="column"
        boxSizing="border-box"
        gap="24px"
      >
        {!isSmallWindow && (
          <IconButton
            sx={{
              padding: '0px',
              marginLeft: '0px',
              position: 'absolute',
              top: '0px',
              right: '0px',
              zIndex: 100,
            }}
            variant="alita"
            color="tertiary"
            onClick={onClickCollapsed}
          >
            {!collapsed ? (
              <DoubleLeftIcon
                fill={theme.palette.icon.fill.default}
                width={16}
              />
            ) : (
              <DoubleRightIcon
                fill={theme.palette.icon.fill.default}
                width={16}
              />
            )}
          </IconButton>
        )}
        {!collapsed && (
          <>
            <PipelineConfigurationForm
              applicationId={applicationId}
              viewMode={viewMode}
            />
          </>
        )}
      </ContentContainer>
    </>
  );
};

export default GeneralFormPanel;
