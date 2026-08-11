import { memo } from 'react';

import AppLayoutInner from '@/[fsd]/app/layout/AppLayoutInner';
import { useInteractiveTourController } from '@/[fsd]/features/interactive-tours';
import InteractiveTourRoot from '@/[fsd]/features/interactive-tours/ui/InteractiveTourRoot';
import { InteractiveTourProvider } from '@/[fsd]/shared/lib/context';
import { SupportAssistantWidget } from '@/[fsd]/widgets/support-assistant';

const AppLayout = memo(() => {
  const tourValue = useInteractiveTourController();

  return (
    <InteractiveTourProvider value={tourValue}>
      <SupportAssistantWidget>
        {({ onToggleAssistant }) => <AppLayoutInner onToggleAssistant={onToggleAssistant} />}
      </SupportAssistantWidget>
      <InteractiveTourRoot />
    </InteractiveTourProvider>
  );
});

AppLayout.displayName = 'AppLayout';

export default AppLayout;
