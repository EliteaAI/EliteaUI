import { useRef } from 'react';

const useAutoBlur = () => {
  const timerRef = useRef(null);
  const doTriggerBlur = () => {
    if (document.activeElement && document.activeElement.tagName !== 'BODY') {
      const targetElement = document.activeElement;
      targetElement.blur();
      targetElement.focus();
    }
  };
  const autoBlur = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(doTriggerBlur, 10);
  };
  return autoBlur;
};

export default useAutoBlur;
