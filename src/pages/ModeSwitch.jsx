import { memo, useCallback } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { actions } from '@/slices/settings';

const ModeSwitch = memo(() => {
  const dispatch = useDispatch();
  const mode = useSelector(state => state.settings.mode);

  const handleToggle = useCallback(() => {
    dispatch(actions.switchMode());
  }, [dispatch]);

  const toggle = () => (
    <>
      <label
        htmlFor="mode-toggle"
        style={{ marginRight: '10px' }}
      >
        Toggle Mode:
      </label>
      <input
        id="mode-toggle"
        type="checkbox"
        checked={mode === 'dark'}
        onChange={handleToggle}
      />
      <span>{mode === 'dark' ? 'Dark' : 'Light'} Mode</span>
    </>
  );

  const enableToggle = false;

  return (
    <div>
      <h1>Switch Mode</h1>
      {enableToggle ? toggle() : null}
    </div>
  );
});

ModeSwitch.displayName = 'ModeSwitch';

export default ModeSwitch;
