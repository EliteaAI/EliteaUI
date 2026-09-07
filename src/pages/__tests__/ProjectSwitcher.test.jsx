// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Box } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ProjectSwitcher from '../ProjectSwitcher';

const dispatch = vi.fn();
let routeProjectId;
const refetch = vi.fn();
const replace = vi.fn();
let projectListState;

vi.mock('react-router-dom', () => ({
  Link: props => <Box component="span">{props.children}</Box>,
  useParams: () => ({ projectId: routeProjectId }),
  useLocation: () => ({ pathname: '/591/toolkits/all/870', search: '?tab=1', hash: '' }),
}));

vi.mock('react-redux', () => ({ useDispatch: () => dispatch }));

vi.mock('@/api/project.js', () => ({ useProjectListQuery: () => projectListState }));

vi.mock('@/api/eliteaApi', () => ({ eliteaApi: { util: { resetApiState: () => ({ type: 'reset' }) } } }));

vi.mock('@/slices/settings.js', () => ({
  actions: { setProject: payload => ({ type: 'setProject', payload }) },
}));

vi.mock('@/pages/Page404.jsx', () => ({ default: () => <Box data-testid="page-404" /> }));

vi.mock('@/components/Chat/StyledComponents', () => ({
  StyledCircleProgress: () => <Box data-testid="spinner" />,
}));

vi.mock('@/[fsd]/shared/ui', () => ({
  Button: {
    BaseBtn: props => (
      <button
        type="button"
        onClick={props.onClick}
      >
        {props.children}
      </button>
    ),
  },
}));

vi.mock('@/[fsd]/shared/ui/button/BaseBtn', () => ({ BUTTON_VARIANTS: { elitea: 'elitea' } }));

vi.mock('@/[fsd]/shared/lib/helpers', () => ({
  NavigationHelpers: { stripProjectSegment: pathname => pathname.replace('/591', '') },
}));

const pending = { data: undefined, isError: false, isSuccess: false, refetch };
const failed = { data: undefined, isError: true, isSuccess: false, refetch };
const loaded = rows => ({ data: rows, isError: false, isSuccess: true, refetch });

beforeEach(() => {
  vi.clearAllMocks();
  routeProjectId = '591';
  projectListState = pending;
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { origin: 'http://elitea.test', replace },
  });
});

afterEach(() => cleanup());

describe('ProjectSwitcher', () => {
  it('waits instead of judging the project while the list is still pending', () => {
    render(<ProjectSwitcher />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('switches to the project and drops its segment from the path', () => {
    projectListState = loaded([{ id: 591, name: 'Acme' }]);

    render(<ProjectSwitcher />);

    expect(dispatch).toHaveBeenCalledWith({ type: 'setProject', payload: { id: 591, name: 'Acme' } });
    expect(replace).toHaveBeenCalledWith('http://elitea.test/toolkits/all/870?tab=1');
  });

  // A failed request carries no data, which is indistinguishable from an empty list. Reading it as
  // "the project does not exist" is what turned a transient error into a permanent dead end.
  it('reports a failed lookup as an error the user can retry, not as a missing project', () => {
    projectListState = failed;

    render(<ProjectSwitcher />);

    expect(screen.getByText('Could not load your projects.')).toBeInTheDocument();
    expect(screen.queryByText(/not available to your account/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Retry'));
    expect(refetch).toHaveBeenCalled();
  });

  // A PROJECT tag invalidation refetches the list while the redirect is still in flight, handing the
  // effect a fresh object for the same project. Re-entering would re-dispatch and, on an artifacts
  // path, re-run `resetApiState` — which invalidates the very query it depends on.
  it('redirects once even when the project list is refetched under it', () => {
    projectListState = loaded([{ id: 591, name: 'Acme' }]);
    const { rerender } = render(<ProjectSwitcher attempt={1} />);

    projectListState = loaded([{ id: 591, name: 'Acme' }]);
    rerender(<ProjectSwitcher attempt={2} />);

    expect(replace).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  // `attempt` only forces the memoised component to re-render, standing in for the query state
  // changing under it. A remount would pass even against a verdict that latches.
  it('recovers when a later attempt returns the project', () => {
    projectListState = failed;
    const { rerender } = render(<ProjectSwitcher attempt={1} />);

    projectListState = loaded([{ id: 591, name: 'Acme' }]);
    rerender(<ProjectSwitcher attempt={2} />);

    expect(screen.queryByText('Could not load your projects.')).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith('http://elitea.test/toolkits/all/870?tab=1');
  });

  // `/:projectId/*` is the last route, so a mistyped path reaches this component; it must stay a
  // 404 instead of spinning on a project lookup that can never resolve.
  it('leaves a non-numeric first segment as a not-found page', () => {
    routeProjectId = 'toolkitz';

    render(<ProjectSwitcher />);

    expect(screen.getByTestId('page-404')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('names the project when a loaded list genuinely does not contain it', () => {
    projectListState = loaded([{ id: 2, name: 'Private' }]);

    render(<ProjectSwitcher />);

    expect(screen.getByText('Project 591 is not available to your account.')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
