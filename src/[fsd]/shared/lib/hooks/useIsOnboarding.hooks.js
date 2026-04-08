import { useMemo } from 'react';

import { useLocation } from 'react-router-dom';

import RouteDefinitions from '@/routes';

export const useIsOnboarding = () => {
  const location = useLocation();
  const isOnboardingPage = useMemo(
    () => location.pathname === RouteDefinitions.Onboarding,
    [location.pathname],
  );
  return isOnboardingPage;
};
