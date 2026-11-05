import { useEffect, useState } from 'react';

const TICK_MS = 60_000;

// The current time, renewed every minute, so an "Expires in" text moves on without a new request
// enabled=false keeps no timer, for a list that has nothing time-bound to show
export const useNow = (enabled = true) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return undefined;
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, [enabled]);
  return now;
};
