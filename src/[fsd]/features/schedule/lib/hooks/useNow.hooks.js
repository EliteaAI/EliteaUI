import { useEffect, useState } from 'react';

const TICK_MS = 60_000;

// The current time, renewed every minute, so an "Expires in" text moves on without a new request
export const useNow = () => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, []);
  return now;
};
