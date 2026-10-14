// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import VersionSelector from '../VersionSelector';

const editing = vi.hoisted(() => ({ current: {} }));

vi.mock('@/hooks/useNavBlocker', () => ({ default: () => editing.current }));
vi.mock('@/assets/refresh-icon.svg?react', () => ({ default: () => null }));
vi.mock('@/assets/version-icon.svg?react', () => ({ default: () => null }));

const VERSIONS = [
  { id: 1, name: 'base' },
  { id: 2, name: 'v2' },
];

const pickSecondVersion = props => {
  render(
    <VersionSelector
      versions={VERSIONS}
      selectedVersion={VERSIONS[0]}
      {...props}
    />,
  );
  fireEvent.click(screen.getByTestId('chat-version-selector-trigger'));
  fireEvent.click(screen.getByText('v2'));
};

describe('VersionSelector with the skill canvas open', () => {
  afterEach(() => {
    cleanup();
    editing.current = {};
  });

  it('asks before switching away from unsaved skill edits', () => {
    editing.current = { isEditingSkill: true };
    const onSelect = vi.fn();
    const onCloseEditor = vi.fn();
    const onShowVersionChangeAlert = vi.fn();

    pickSecondVersion({ onSelect, onCloseEditor, isEditorDirty: true, onShowVersionChangeAlert });

    expect(onSelect).not.toHaveBeenCalled();
    expect(onCloseEditor).not.toHaveBeenCalled();
    onShowVersionChangeAlert.mock.calls[0][0]();
    expect(onCloseEditor).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(VERSIONS[1]);
  });

  it('closes a clean skill canvas and switches', () => {
    editing.current = { isEditingSkill: true };
    const onSelect = vi.fn();
    const onCloseEditor = vi.fn();
    const onShowVersionChangeAlert = vi.fn();

    pickSecondVersion({ onSelect, onCloseEditor, isEditorDirty: false, onShowVersionChangeAlert });

    expect(onShowVersionChangeAlert).not.toHaveBeenCalled();
    expect(onCloseEditor).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(VERSIONS[1]);
  });
});
