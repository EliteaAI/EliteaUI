import { memo } from 'react';

import { Box } from '@mui/material';
import IconButton from '@mui/material/IconButton';

import Tooltip from '@/ComponentsLib/Tooltip';
import CollapseIcon from '@/assets/collapse-icon.svg?react';
import ExpandIcon from '@/assets/expand-icon.svg?react';
import FullscreenOutlinedIcon from '@/assets/full-screen-icon.svg?react';
import CopyIcon from '@/components/Icons/CopyIcon';

const InputActionsToolbar = memo(props => {
  const {
    value,
    showCopyAction = true,
    showFullScreenAction = true,
    showExpandAction = true,
    onCopy,
    onFullScreen,
    switchRows,
    fullScreenIcon,
    isExpanded,
    actionsBarProps = {},
    toolbarSx,
    iconButtonSx,
    iconSizeSx,
  } = props;

  return (
    <Box
      sx={toolbarSx}
      {...actionsBarProps}
    >
      {showCopyAction && !!value && (
        <Tooltip
          title="Copy to clipboard"
          placement="top"
        >
          <Box component="span">
            <IconButton
              disabled={!value}
              sx={iconButtonSx}
              variant="elitea"
              color="tertiary"
              onClick={onCopy}
            >
              <CopyIcon sx={iconSizeSx} />
            </IconButton>
          </Box>
        </Tooltip>
      )}
      {showFullScreenAction && (
        <Box sx={!value ? { position: 'absolute', top: '1.5rem' } : {}}>
          <Tooltip
            title={fullScreenIcon ? 'AI Assistant' : 'Full screen view'}
            placement="top"
          >
            <IconButton
              sx={iconButtonSx}
              variant="elitea"
              color="tertiary"
              onClick={onFullScreen}
            >
              {fullScreenIcon || <FullscreenOutlinedIcon sx={iconSizeSx} />}
            </IconButton>
          </Tooltip>
        </Box>
      )}
      {showExpandAction && !!value && (
        <Tooltip
          title={isExpanded ? 'Collapse field' : 'Expand field'}
          placement="top"
        >
          <IconButton
            sx={iconButtonSx}
            variant="elitea"
            color="tertiary"
            onClick={switchRows}
          >
            {isExpanded ? <CollapseIcon sx={iconSizeSx} /> : <ExpandIcon sx={iconSizeSx} />}
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
});

InputActionsToolbar.displayName = 'InputActionsToolbar';

export default InputActionsToolbar;
