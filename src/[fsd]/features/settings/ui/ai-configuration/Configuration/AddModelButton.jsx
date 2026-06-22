import { memo, useCallback, useMemo } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/[fsd]/shared/ui';
import RouteDefinitions from '@/routes';

const AddModelButton = memo(() => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const locationState = useMemo(() => state || { from: [], routeStack: [] }, [state]);

  const addModelCredential = useCallback(() => {
    // Navigate to create model credential page with model configuration context
    const newRouteStack = [...locationState.routeStack];
    newRouteStack.push({
      breadCrumb: 'Model Configuration',
      pagePath: RouteDefinitions.SettingsWithTab.replace(':tab', 'model-configuration'),
    });
    newRouteStack.push({
      breadCrumb: 'New Configuration',
      pagePath: `${RouteDefinitions.Settings}/create-configuration?from=model-configuration`,
    });

    navigate(
      {
        pathname: `${RouteDefinitions.Settings}/create-configuration`,
        search: 'from=model-configuration',
      },
      {
        state: { routeStack: newRouteStack },
      },
    );
  }, [locationState.routeStack, navigate]);

  return (
    <Button.AddButton
      tooltip="Create configuration"
      onAdd={addModelCredential}
    />
  );
});

AddModelButton.displayName = 'AddModelButton';

export default AddModelButton;
