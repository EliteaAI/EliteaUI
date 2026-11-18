// @vitest-environment jsdom
import { useState } from 'react';

import { MemoryRouter, RouterProvider, createMemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';

import { useSkillEditorSearchParams } from '../useSkillEditorSearchParams.hooks';

const renderAt = (url, props) => {
  const location = { current: null };
  const wrapper = ({ children }) => <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>;
  const hook = renderHook(
    hookProps => {
      location.current = useLocation();
      return useSkillEditorSearchParams(hookProps);
    },
    { wrapper, initialProps: props },
  );
  return { ...hook, location };
};

describe('useSkillEditorSearchParams', () => {
  afterEach(() => cleanup());

  it('reads the tab, the file and the panel from the address', () => {
    const { result } = renderAt('/skills/1?view=files&file=scripts%2Ffill.py&panel=instructions', {
      isTestPanelOpen: false,
    });
    expect(result.current).toMatchObject({
      view: 'files',
      filePath: 'scripts/fill.py',
      panel: 'instructions',
    });
  });

  it('opens Settings when the address names no tab', () => {
    const { result } = renderAt('/skills/1', { isTestPanelOpen: false });
    expect(result.current.view).toBe('settings');
  });

  it('opens Test once after a reload with panel=test, and not again when the person closes it', () => {
    const onOpenTestPanel = vi.fn();
    const { rerender, location } = renderAt('/skills/1?panel=test', {
      isTestPanelOpen: false,
      onOpenTestPanel,
    });
    expect(onOpenTestPanel).toHaveBeenCalledTimes(1);

    rerender({ isTestPanelOpen: true, onOpenTestPanel });
    rerender({ isTestPanelOpen: false, onOpenTestPanel });
    expect(onOpenTestPanel).toHaveBeenCalledTimes(1);
    expect(new URLSearchParams(location.current.search).has('panel')).toBe(false);
  });

  it('writes panel=test when Test opens from anywhere, and removes it when Test closes', () => {
    const { rerender, location } = renderAt('/skills/1?run=5', { isTestPanelOpen: false });

    rerender({ isTestPanelOpen: true });
    expect(new URLSearchParams(location.current.search).get('panel')).toBe('test');
    expect(new URLSearchParams(location.current.search).get('run')).toBe('5');

    rerender({ isTestPanelOpen: false });
    expect(new URLSearchParams(location.current.search).has('panel')).toBe(false);
  });

  it('keeps panel=instructions when Test closes to make room for the instructions', () => {
    const { rerender, location } = renderAt('/skills/1?view=files&panel=instructions', {
      isTestPanelOpen: true,
    });
    rerender({ isTestPanelOpen: false });
    expect(new URLSearchParams(location.current.search).get('panel')).toBe('instructions');
  });

  it('opens the instructions when they close Test in the same click, as RouterProvider applies it later', async () => {
    const Page = () => {
      const [isTestPanelOpen, setIsTestPanelOpen] = useState(true);
      const { panel, updateParams } = useSkillEditorSearchParams({ isTestPanelOpen });
      return (
        <button
          data-testid="open-instructions"
          data-panel={panel ?? ''}
          onClick={() => {
            setIsTestPanelOpen(false);
            updateParams({ panel: 'instructions' });
          }}
        />
      );
    };
    const router = createMemoryRouter([{ path: '/skills/1', element: <Page /> }], {
      initialEntries: ['/skills/1?view=files&panel=test'],
    });
    render(<RouterProvider router={router} />);

    await act(async () => fireEvent.click(screen.getByTestId('open-instructions')));

    expect(new URLSearchParams(router.state.location.search).get('panel')).toBe('instructions');
    expect(screen.getByTestId('open-instructions')).toHaveAttribute('data-panel', 'instructions');
  });
});
