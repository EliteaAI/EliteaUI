// The frame of the concept: the new menu on the left and the page on the right. Without children the right side is the
// team's real page for the router's address (MainPanel, as AppLayout mounts it); the chat page's own chats column and
// right Participants panel are hidden there: the chats live in the menu now, the panel is gone (owner, 2026-11-10).
import { Suspense, lazy, memo } from 'react';

import { Box } from '@mui/material';

import { ChatHistoryProvider } from '@/[fsd]/features/chat/conversation-list/ui';
import { InteractiveTourRoot, useInteractiveTourController } from '@/[fsd]/features/interactive-tours';
import { InteractiveTourProvider } from '@/[fsd]/shared/lib/context';
import { SupportAssistantWidget } from '@/[fsd]/widgets/support-assistant';

import ConceptSidebar, { CONCEPT_SIDEBAR_WIDTH, ConceptRail } from './ConceptSidebar';

// Loaded on first render, after '@/[fsd]/app/routes' (import cycle MainPanel → routes → router.jsx).
const MainPanel = lazy(() => import('@/[fsd]/app/layout/MainPanel'));

// The chat page (src/pages/NewChat/NewChat.jsx) is a Grid: chats column (lg 3), conversation (xs 12), right panel (lg 0.5).
export const HIDE_CHAT_PAGE_PARTS = {
  '& main .MuiGrid-container > .MuiGrid-grid-lg-3, & main .MuiGrid-container > .MuiGrid-grid-lg-0\\.5': {
    display: 'none',
  },
  // The concept hides the chat page's own columns and lets the conversation fill the frame.
  '& main .MuiGrid-container > .MuiGrid-grid-xs-12': {
    flex: '1 1 auto',
    maxWidth: '100% !important', // component-check: allow conversation fills the concept frame
    width: '100% !important', // component-check: allow conversation fills the concept frame
    marginLeft: '0 !important',
    paddingRight: '1.5rem',
    boxSizing: 'border-box',
  },
};

// `rail`: the menu folded to icons, as on a section page (2026-11-12).
const ConceptShell = memo(({ active, hide = HIDE_CHAT_PAGE_PARTS, rail, children }) => {
  const tourValue = useInteractiveTourController();
  return (
    <InteractiveTourProvider value={tourValue}>
      {/* The menu's chat list and the chat page share it, as under AppLayoutInner */}
      <ChatHistoryProvider>
        <SupportAssistantWidget>
          {({ onToggleAssistant }) => (
            <Box sx={styles.app}>
              {rail ? (
                <ConceptRail
                  active={active}
                  onToggleAssistant={onToggleAssistant}
                />
              ) : (
                <ConceptSidebar
                  active={active}
                  onToggleAssistant={onToggleAssistant}
                />
              )}
              <Box sx={[styles.main, hide]}>
                {children ?? (
                  <Suspense>
                    <MainPanel />
                  </Suspense>
                )}
              </Box>
            </Box>
          )}
        </SupportAssistantWidget>
      </ChatHistoryProvider>
      <InteractiveTourRoot />
    </InteractiveTourProvider>
  );
});
ConceptShell.displayName = 'ConceptShell';

const styles = {
  app: { display: 'flex', width: '100%', height: '100vh' },
  main: ({ palette }) => ({
    flex: 1,
    minWidth: 0,
    height: '100vh',
    overflow: 'hidden',
    background: palette.background.default?.primary ?? palette.background.default,
    '& > main': { width: '100% !important', maxWidth: '100% !important' }, // component-check: allow the frame stretches the team's main area to the window
  }),
};

export { CONCEPT_SIDEBAR_WIDTH };
export default ConceptShell;
