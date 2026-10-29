import { useCallback, useEffect, useState } from 'react';

import { IconButton } from '@mui/material';

import { useIsSmallWindow, useViewMode } from '@/[fsd]/shared/lib/hooks';
import DoubleLeftIcon from '@/components/Icons/DoubleLeftIcon';
import DoubleRightIcon from '@/components/Icons/DoubleRightIcon';
import PipelineConfigurationForm from '@/pages/Applications/Components/Applications/PipelineConfigurationForm.jsx';
import { ContentContainer } from '@/pages/Common/index.js';
import { useTheme } from '@emotion/react';

const GeneralFormPanel = ({
  applicationId,
  onCollapsed,
  isCreateMode,
  onSelectNode,
  collapsed: controlledCollapsed,
  onCollapsedChange,
}) => {
  const theme = useTheme();
  const viewMode = useViewMode();

  // Controlled when the parent passes `collapsed` (the pipeline workspace auto-collapses it)
  const [ownCollapsed, setOwnCollapsed] = useState(false);
  const isControlled = controlledCollapsed !== undefined;
  const collapsed = isControlled ? controlledCollapsed : ownCollapsed;
  const setCollapsed = useCallback(
    value => {
      if (!isControlled) setOwnCollapsed(value);
      onCollapsedChange?.(value);
    },
    [isControlled, onCollapsedChange],
  );
  const { isSmallWindow } = useIsSmallWindow();

  const onClickCollapsed = useCallback(() => {
    setCollapsed(!collapsed);
    onCollapsed?.(!collapsed);
  }, [collapsed, onCollapsed, setCollapsed]);

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
        data-testid="pipeline-config-tab"
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
            data-testid="pipeline-config-collapse-button"
            sx={{
              padding: '0px',
              marginLeft: '0px',
              position: 'absolute',
              top: '0px',
              right: '0px',
              zIndex: 100,
            }}
            variant="elitea"
            color="tertiary"
            onClick={onClickCollapsed}
          >
            {!collapsed ? (
              <DoubleLeftIcon
                fill={theme.palette.icon.default}
                width={16}
              />
            ) : (
              <DoubleRightIcon
                fill={theme.palette.icon.default}
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
              isCreateMode={isCreateMode}
              onSelectNode={onSelectNode}
            />
          </>
        )}
      </ContentContainer>
    </>
  );
};

export default GeneralFormPanel;
