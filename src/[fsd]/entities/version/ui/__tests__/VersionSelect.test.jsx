// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getDefaultVersionId } from '@/[fsd]/entities/version/lib/helpers';
import '@testing-library/jest-dom/vitest';
import { cleanup, render } from '@testing-library/react';

import VersionSelect from '../VersionSelect';

// the Schedule form uses VersionSelect without URL params.

let singleSelectProps;
const navigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/agents/1/2', state: {}, search: '' }),
  useNavigate: () => navigate,
  useParams: () => ({ agentId: '1', version: '2' }),
}));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useNameFromUrl: () => 'agent',
  useSelectedProjectId: () => 1,
  useViewModeFromUrl: () => 'owner',
}));

vi.mock('@/[fsd]/shared/ui/select', () => ({
  SingleSelect: props => {
    singleSelectProps = props;
    return <div data-testid="single-select" />;
  },
}));

vi.mock('@/[fsd]/entities/version/ui', () => ({ VersionSelectOption: () => null }));
vi.mock('@/[fsd]/entities/version/lib/hooks', () => ({
  useVersionSelectSearch: options => ({ searchQuery: '', filteredOptions: options, handleSearch: vi.fn() }),
}));
vi.mock('@/[fsd]/entities/version/ui/VersionIconBlock', () => ({ default: () => null }));
vi.mock('@/assets/publish-version.svg?react', () => ({ default: () => null }));
vi.mock('@/components/Icons/AttentionIcon', () => ({ default: () => null }));
vi.mock('@/components/Icons/PinIcon', () => ({ default: () => null }));

const VERSIONS = [
  { id: 10, name: 'base', created_at: '2026-01-01T00:00:00Z' },
  { id: 11, name: 'v2', created_at: '2026-02-01T00:00:00Z' },
];

describe('getDefaultVersionId', () => {
  it('returns meta.default_version_id when set', () => {
    expect(getDefaultVersionId({ meta: { default_version_id: 11 }, versions: VERSIONS })).toBe(11);
  });

  it('returns the base version id when no default is set', () => {
    expect(getDefaultVersionId({ meta: {}, versions: VERSIONS })).toBe(10);
    expect(getDefaultVersionId({ versions: VERSIONS })).toBe(10);
  });

  it('returns null when there is nothing to pick', () => {
    expect(getDefaultVersionId(undefined)).toBeNull();
    expect(getDefaultVersionId({ versions: [] })).toBeNull();
  });
});

describe('VersionSelect controlled mode', () => {
  beforeEach(() => {
    singleSelectProps = undefined;
    navigate.mockClear();
  });
  afterEach(cleanup);

  it('shows value and calls onChange without navigating', () => {
    const onChange = vi.fn();
    render(
      <VersionSelect
        versions={VERSIONS}
        value={11}
        onChange={onChange}
      />,
    );

    expect(singleSelectProps.value).toBe(11);
    singleSelectProps.onValueChange(10);

    expect(onChange).toHaveBeenCalledWith(10);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('keeps the URL mode when onChange is absent', () => {
    const onVersionChange = vi.fn();
    render(
      <VersionSelect
        versions={VERSIONS}
        onVersionChange={onVersionChange}
      />,
    );

    singleSelectProps.onValueChange(10);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(onVersionChange).toHaveBeenCalledWith(10, VERSIONS[0]);
  });
});
