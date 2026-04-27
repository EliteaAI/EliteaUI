import { useEffect, useState } from 'react';

import KeyboardDoubleArrowDownOutlinedIcon from '@mui/icons-material/KeyboardDoubleArrowDownOutlined';
import { ToggleButton } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';

export const AUTO_SCROLL_KEY = 'project_alita.chat.autoscroll';
export const CONVERSATION_AUTO_SCROLL_KEY = 'project_alita.conversation.autoscroll';

export default function AutoScrollToggle({ storageKey = AUTO_SCROLL_KEY }) {
  const [isAutoScroll, setIsAutoScroll] = useState(sessionStorage.getItem(storageKey) || true);

  useEffect(() => {
    sessionStorage.setItem(AUTO_SCROLL_KEY, isAutoScroll ? 'true' : 'false');
  }, [isAutoScroll]);

  return (
    <Tooltip
      title="Auto scroll to bottom"
      placement="top"
    >
      <ToggleButton
        variant="alita"
        onClick={() => setIsAutoScroll(prevState => !prevState)}
        isAutoScroll={isAutoScroll}
      >
        <KeyboardDoubleArrowDownOutlinedIcon sx={{ fontSize: 16 }} />
      </ToggleButton>
    </Tooltip>
  );
}
